import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import type { Prisma, User } from '@prisma/client';
import type { JwtPayload } from '../common/types/auth-request';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './auth.constants';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const hashBuffer = Buffer.from(hashHex, 'hex');
  if (hashBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(hashBuffer, derivedKey);
}

interface SessionTenant {
  tenantId: string;
  tenantName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface SessionData {
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
  tenants: SessionTenant[];
  activeTenant: SessionTenant;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenMaxAge: number;
  refreshTokenMaxAge: number;
}

export interface AuthResult {
  tokens: AuthTokens;
  session: SessionData;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}



  private readonly logger = new Logger(AuthService.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production';

  private debug(message: string) {
    if (this.isDebugEnabled) {
      this.logger.debug(message);
    }
  }

  private buildSession(user: User, tenants: SessionTenant[]): SessionData {
    if (!tenants.length) {
      throw new Error('User has no tenant membership');
    }

    const activeTenant =
      tenants.find((tenant) => tenant.tenantId === user.activeTenantId) ?? tenants[0];

    if (!activeTenant) {
      throw new Error('Unable to resolve active tenant');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname ?? '',
        lastname: user.lastname ?? '',
      },
      tenants,
      activeTenant,
    };
  }

  private buildTokens(session: SessionData): AuthTokens {
    const accessToken = this.jwtService.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        user: session.user,
        activeTenant: {
          id: session.activeTenant.tenantId,
          name: session.activeTenant.tenantName,
          role: session.activeTenant.role,
        },
      },
      {
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: session.user.id,
      },
      {
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      accessTokenMaxAge: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenMaxAge: REFRESH_TOKEN_TTL_SECONDS,
    };
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { tenant: true },
    });

    const tenants: SessionTenant[] = memberships.map((m) => ({
      tenantId: m.tenant.id,
      tenantName: m.tenant.name,
      role: m.role,
    }));

    const session = this.buildSession(user, tenants);
    const tokens = this.buildTokens(session);

    return { tokens, session };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const { email, password, firstname, lastname } = dto;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email déjà utilisé');
    }

    const hashed = await hashPassword(password);

    // create tenant, user and membership in a transaction
    const currentYear = new Date().getFullYear();
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenant = await tx.tenant.create({ 
        data: { 
          name: 'Mon Entreprise',
          invoiceNumberPrefix: 'FAC',
          quoteNumberYear: currentYear,
          invoiceNumberYear: currentYear,
          defaultPaymentTerms: 'Paiement sous 30 jours.',
          defaultInvoiceNotes: 'Merci pour votre confiance.',
        } 
      });
      const user = await tx.user.create({ data: { email, password: hashed, firstname, lastname, activeTenantId: tenant.id } });
      await tx.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: 'OWNER' } });
      return { user };
    });

    return this.buildAuthResult(result.user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {

    // this.debug(`Incoming request ${req.method} ${req.path}`);
    this.debug('Go validateUser');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const hashed = user.password;
    if (!hashed) return null;
    const match = await verifyPassword(password, hashed);
    if (!match) return null;
    return user;
  }

  async login(user: User): Promise<AuthResult> {
    return this.buildAuthResult(user);
  }

  async switchTenant(userId: string, tenantId: string): Promise<AuthResult> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!membership) {
      throw new Error('User is not a member of this tenant');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { activeTenantId: tenantId },
    });

    return this.buildAuthResult(user);
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      if (!payload.sub) {
        throw new Error('Invalid refresh payload');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new Error('User not found');

      return this.buildAuthResult(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async requestPasswordReset(email: string): Promise<{ message: string; resetUrl?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    const message = 'Si cette adresse existe, un lien de réinitialisation a été envoyé.';

    if (!user) {
      return { message };
    }
    
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${process.env.WEB_URL ?? 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(rawToken)}`;
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Password reset URL for ${normalizedEmail}: ${resetUrl}`);
      return { message, resetUrl };
    }

    return { message };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
      throw new Error('Invalid or expired password reset token');
    }

    const hashedPassword = await hashPassword(password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId, id: { not: resetToken.id } } }),
    ]);

    return { message: 'Mot de passe modifié. Vous pouvez vous connecter.' };
  }
}
