import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<any> {
    const { email, password, firstname, lastname } = dto;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email déjà utilisé');
    }

    const hashed = await bcrypt.hash(password, 10);

    // create tenant, user and membership in a transaction
    const result = await this.prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({ data: { name: 'Mon Entreprise' } });
      const user = await tx.user.create({ data: { email, password: hashed, firstname, lastname } });
      await tx.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: 'OWNER' } });
      return { user, tenant };
    });

    const accessToken = this.jwtService.sign(
      { sub: result.user.id, email: result.user.email },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: result.user.id },
      { expiresIn: '7d' },
    );

    // Fetch all memberships for the new user
    const memberships = await this.prisma.membership.findMany({
      where: { userId: result.user.id },
      include: { tenant: true },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstname: result.user.firstname,
        lastname: result.user.lastname,
      },
      memberships: memberships.map((m) => ({
        tenantId: m.tenant.id,
        tenantName: m.tenant.name,
        role: m.role,
      })),
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = (await this.prisma.user.findUnique({ where: { email } })) as User | null;
    if (!user) return null;
    const hashed = (user as any).password as string | undefined;
    if (!hashed) return null;
    const match = await bcrypt.compare(password, hashed);
    if (!match) return null;
    return user;
  }

  async login(user: User): Promise<any> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { tenant: true },
    });

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
      memberships: memberships.map((m) => ({
        tenantId: m.tenant.id,
        tenantName: m.tenant.name,
        role: m.role,
      })),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new Error('User not found');

      const accessToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '15m' },
      );

      return { accessToken };
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  }
}
