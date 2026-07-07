import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

@Injectable()
export class RequireRoleGuard implements CanActivate {
  constructor(private requiredRoles: TenantRole[]) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('\n[RequireRoleGuard] Checking role permissions...');
    const request = context.switchToHttp().getRequest();
    const membership = request.membership;

    console.log(`[RequireRoleGuard] Required roles: ${this.requiredRoles.join(', ')}`);
    console.log(`[RequireRoleGuard] User membership: ${membership ? '✅ Present' : '❌ MISSING'}`);
    
    if (!membership) {
      console.log(`[RequireRoleGuard] ❌ No membership found on request!`);
      throw new ForbiddenException(
        `This action requires one of these roles: ${this.requiredRoles.join(', ')}`,
      );
    }

    console.log(`[RequireRoleGuard] User role: ${membership.role}`);
    const hasRequiredRole = this.requiredRoles.includes(membership.role);
    console.log(`[RequireRoleGuard] Role check: ${hasRequiredRole ? '✅ PASS' : '❌ FAIL'}`);

    if (!hasRequiredRole) {
      console.log(`[RequireRoleGuard] ❌ User role "${membership.role}" not in required roles`);
      throw new ForbiddenException(
        `This action requires one of these roles: ${this.requiredRoles.join(', ')}`,
      );
    }

    console.log('[RequireRoleGuard] ✅ Authorization check passed\n');
    return true;
  }
}

export function RequireRole(...roles: TenantRole[]) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      const originalMethod = descriptor.value;
      descriptor.value = function(...args: any[]) {
        return originalMethod.apply(this, args);
      };
    }
  };
}
