import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: 'jane@example.com',
    password: '',
    firstname: 'Jane',
    lastname: 'Doe',
    activeTenantId: 'tenant-1',
  };

  const tenant = { id: 'tenant-1', name: 'Acme' };
  const membership = { userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER', tenant };

  function createService() {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tenant: { create: jest.fn() },
      membership: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([membership]),
      },
      passwordResetToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshTokenSession: {
        create: jest.fn().mockResolvedValue({ id: 'refresh-session-1' }),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const jwt = { sign: jest.fn((payload: object) => JSON.stringify(payload)), verify: jest.fn() };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
    return { service, prisma, jwt };
  }

  it('registers a user with an owner tenant and returns a session', async () => {
    const { service, prisma, jwt } = createService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => {
      prisma.tenant.create.mockResolvedValue({ id: 'tenant-1', name: 'Mon Entreprise' });
      prisma.user.create.mockResolvedValue({ ...user, email: 'jane@example.com' });
      return callback(prisma);
    });

    const result = await service.register({
      email: 'jane@example.com',
      password: 'correct horse battery staple',
      firstname: 'Jane',
      lastname: 'Doe',
    });

    const tenantCreateCall = (prisma.tenant.create.mock.calls as unknown[][])[0]?.[0] as {
      data: { name: string; invoiceNumberPrefix: string };
    };
    expect(tenantCreateCall.data).toEqual(expect.objectContaining({ name: 'Mon Entreprise', invoiceNumberPrefix: 'FAC' }));
    const userCreateCall = (prisma.user.create.mock.calls as unknown[][])[0]?.[0] as {
      data: { email: string; activeTenantId: string; password: string };
    };
    expect(userCreateCall.data.email).toBe('jane@example.com');
    expect(userCreateCall.data.activeTenantId).toBe('tenant-1');
    expect(prisma.membership.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    });
    expect(result.session.activeTenant).toEqual({ tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' });
    expect(jwt.sign).toHaveBeenCalledTimes(2);
    expect(userCreateCall.data.password).not.toBe('correct horse battery staple');
  });

  it('rejects registration when the email is already used', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.register({
      email: 'jane@example.com',
      password: 'password',
      firstname: 'Jane',
      lastname: 'Doe',
    })).rejects.toThrow('Email déjà utilisé');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('validates a password and rejects an unknown user or wrong password', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.validateUser('missing@example.com', 'password')).resolves.toBeNull();

    prisma.user.findUnique.mockResolvedValue({ ...user, password: 'invalid-hash' });
    await expect(service.validateUser('jane@example.com', 'password')).resolves.toBeNull();
  });

  it('refreshes only a valid token for an existing user', async () => {
    const { service, prisma, jwt } = createService();
    jwt.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1', type: 'refresh' });
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.refreshTokenSession.findUnique.mockResolvedValue({
      id: 'refresh-session-1',
      userId: 'user-1',
      jti: 'jti-1',
      familyId: 'family-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const result = await service.refreshAccessToken('refresh-token');

    expect(jwt.verify).toHaveBeenCalledWith('refresh-token');
    expect(result.session.user.id).toBe('user-1');
    expect(prisma.refreshTokenSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'refresh-session-1', revokedAt: null },
    }));
    const refreshCreateCall = (prisma.refreshTokenSession.create.mock.calls as unknown[][])[0]?.[0] as {
      data: { familyId: string };
    };
    expect(refreshCreateCall.data.familyId).toBe('family-1');

    jwt.verify.mockImplementation(() => { throw new Error('expired'); });
    await expect(service.refreshAccessToken('expired-token')).rejects.toThrow('Invalid refresh token');
  });

  it('revokes the whole refresh family when a revoked token is reused', async () => {
    const { service, prisma, jwt } = createService();
    jwt.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1', type: 'refresh' });
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.refreshTokenSession.findUnique.mockResolvedValue({
      id: 'refresh-session-1',
      userId: 'user-1',
      jti: 'jti-1',
      familyId: 'family-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    await expect(service.refreshAccessToken('reused-token')).rejects.toThrow('Invalid refresh token');
    const familyRevokeCall = (prisma.refreshTokenSession.updateMany.mock.calls as unknown[][])
      .find((call) => (call[0] as { where?: { familyId?: string } }).where?.familyId === 'family-1')?.[0] as {
        where: { familyId: string; revokedAt: null };
        data: { revokedAt: Date };
      };
    expect(familyRevokeCall.where).toEqual({ familyId: 'family-1', revokedAt: null });
    expect(familyRevokeCall.data.revokedAt).toEqual(expect.any(Date));
  });

  it('refuses switching to a tenant without membership', async () => {
    const { service, prisma } = createService();
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(service.switchTenant('user-1', 'tenant-2')).rejects.toThrow(
      'User is not a member of this tenant',
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not disclose whether an email exists during password reset request', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.requestPasswordReset(' Missing@example.com ')).resolves.toEqual({
      message: 'Si cette adresse existe, un lien de réinitialisation a été envoyé.',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'missing@example.com' } });
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('creates a short-lived hashed password reset token for an existing user', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(user);
    process.env.WEB_URL = 'https://app.example.com';

    const result = await service.requestPasswordReset('JANE@EXAMPLE.COM');

    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    const resetCreateCall = (prisma.passwordResetToken.create.mock.calls as unknown[][])[0]?.[0] as {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    };
    expect(resetCreateCall.data.userId).toBe('user-1');
    expect(resetCreateCall.data.tokenHash).toEqual(expect.any(String));
    expect(resetCreateCall.data.expiresAt).toEqual(expect.any(Date));
    expect(result.resetUrl).toMatch(/^https:\/\/app\.example\.com\/reset-password\?token=/);
  });

  it('rejects an expired or already-used password reset token', async () => {
    const { service, prisma } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.resetPassword('used-token', 'new-password')).rejects.toThrow('Invalid or expired password reset token');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('updates the password and consumes a valid reset token', async () => {
    const { service, prisma } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.$transaction.mockResolvedValue([]);

    await expect(service.resetPassword('valid-token', 'new-password')).resolves.toEqual({
      message: 'Mot de passe modifié. Vous pouvez vous connecter.',
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
    const userUpdateCall = (prisma.user.update.mock.calls as unknown[][])[0]?.[0] as {
      where: { id: string };
      data: { password: string };
    };
    expect(userUpdateCall.where.id).toBe('user-1');
    expect(userUpdateCall.data.password).toEqual(expect.any(String));
    const tokenUpdateCall = (prisma.passwordResetToken.update.mock.calls as unknown[][])[0]?.[0] as {
      where: { id: string };
      data: { usedAt: Date };
    };
    expect(tokenUpdateCall.where.id).toBe('reset-1');
    expect(tokenUpdateCall.data.usedAt).toEqual(expect.any(Date));
    const sessionRevokeCall = (prisma.refreshTokenSession.updateMany.mock.calls as unknown[][])
      .find((call) => (call[0] as { where?: { userId?: string } }).where?.userId === 'user-1')?.[0] as {
        where: { userId: string; revokedAt: null };
        data: { revokedAt: Date };
      };
    expect(sessionRevokeCall.where).toEqual({ userId: 'user-1', revokedAt: null });
    expect(sessionRevokeCall.data.revokedAt).toEqual(expect.any(Date));
  });
});