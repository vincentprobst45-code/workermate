import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma.service';
import type { AuthenticatedRequest } from '../types/auth-request';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      throw new UnauthorizedException('Missing authentication context on request');
    }

    const tenantId =
      (req.headers['x-tenant-id'] as string | undefined) ??
      authReq.user.activeTenantId ??
      undefined;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context required');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: authReq.user.id,
          tenantId,
        },
      },
      include: { tenant: true },
    });

    if (!membership) {
      this.logger.warn(`Access denied: userId=${authReq.user.id} tenantId=${tenantId}`);
      throw new UnauthorizedException('Access denied to this tenant');
    }

    authReq.membership = membership;
    authReq.tenant = membership.tenant;
    next();
  }
}
