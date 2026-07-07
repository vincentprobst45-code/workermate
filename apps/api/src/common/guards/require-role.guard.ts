import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import type { AuthenticatedRequest } from '../types/auth-request';

@Injectable()
export class RequireRoleGuard implements CanActivate {
  private readonly logger = new Logger(RequireRoleGuard.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production';

  constructor(private requiredRoles: TenantRole[]) {}

  private debug(message: string) {
    if (this.isDebugEnabled) {
      this.logger.debug(message);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    this.debug('Checking role permissions');
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const membership = request.membership;

    this.debug(`Required roles: ${this.requiredRoles.join(', ')}`);
    this.debug(`Membership present: ${Boolean(membership)}`);
    
    if (!membership) {
      this.logger.warn('Membership missing on request context');
      throw new ForbiddenException(
        `This action requires one of these roles: ${this.requiredRoles.join(', ')}`,
      );
    }

    const hasRequiredRole = this.requiredRoles.includes(membership.role);
    this.debug(`User role=${membership.role}, authorized=${hasRequiredRole}`);

    if (!hasRequiredRole) {
      this.logger.warn(`Forbidden role ${membership.role}; expected one of: ${this.requiredRoles.join(', ')}`);
      throw new ForbiddenException(
        `This action requires one of these roles: ${this.requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
