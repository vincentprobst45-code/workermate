import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../../prisma.service';
import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
  function createMiddleware() {
    const prisma = { membership: { findUnique: jest.fn() } };
    return { middleware: new TenantMiddleware(prisma as unknown as PrismaService), prisma };
  }

  it('rejects requests without an authenticated user', async () => {
    const { middleware } = createMiddleware();

    await expect(middleware.use({ headers: {} } as never, {} as never, jest.fn())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resolves tenant from the header and attaches membership context', async () => {
    const { middleware, prisma } = createMiddleware();
    const membership = { userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER', tenant: { id: 'tenant-1' } };
    prisma.membership.findUnique.mockResolvedValue(membership);
    const request = { user: { id: 'user-1', activeTenantId: 'tenant-2' }, headers: { 'x-tenant-id': 'tenant-1' } } as never;
    const next = jest.fn();

    await middleware.use(request, {} as never, next);

    expect(prisma.membership.findUnique).toHaveBeenCalledWith({
      where: { userId_tenantId: { userId: 'user-1', tenantId: 'tenant-1' } },
      include: { tenant: true },
    });
    expect(request.membership).toBe(membership);
    expect(request.tenant).toBe(membership.tenant);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects a user who is not a member of the requested tenant', async () => {
    const { middleware, prisma } = createMiddleware();
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(middleware.use({ user: { id: 'user-1' }, headers: { 'x-tenant-id': 'tenant-9' } } as never, {} as never, jest.fn())).rejects.toBeInstanceOf(UnauthorizedException);
  });
});