import type { Membership, Tenant, User } from '@prisma/client';
import type { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  membership?: Membership;
  tenant?: Tenant;
}

export interface TenantScopedRequest extends AuthenticatedRequest {
  user: User;
  membership: Membership;
  tenant: Tenant;
}

export function requireTenantContext(req: AuthenticatedRequest): TenantScopedRequest {
  if (!req.user || !req.membership || !req.tenant) {
    throw new UnauthorizedException('Missing authentication or tenant context on request');
  }

  return req as TenantScopedRequest;
}
