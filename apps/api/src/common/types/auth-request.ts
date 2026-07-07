import type { Membership, Tenant, User } from '@prisma/client';
import type { Request } from 'express';

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
