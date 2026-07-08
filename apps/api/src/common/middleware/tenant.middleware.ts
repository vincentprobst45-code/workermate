import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth-request';
import { ACCESS_TOKEN_COOKIE } from '../../auth/auth.constants';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production';

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private debug(message: string) {
    if (this.isDebugEnabled) {
      this.logger.debug(message);
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const authReq = req as AuthenticatedRequest;
    this.debug(`Incoming request ${req.method} ${req.path}`);
    
    // Skip auth/refresh endpoints
    if (req.path.includes('/auth/') || req.path === '/health') {
      this.debug('Skipping tenant middleware for auth/health endpoint');
      return next();
    }

    // Step 1: Extract token from Authorization header
    const authHeader = req.headers.authorization;
    this.debug(`Authorization header present: ${Boolean(authHeader)}`);
    if (authHeader) {
      this.debug(`Authorization header prefix: ${authHeader.substring(0, 20)}...`);
    }

    const bearerToken = authHeader?.split(' ')[1];
    const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    const token = bearerToken ?? cookieToken;
    this.debug(`Bearer token extracted: ${Boolean(token)}`);

    if (!token) {
      this.logger.warn('Missing bearer token');
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Step 2: Verify JWT token
      this.debug('Verifying JWT token');
      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub ?? payload.user?.id;
      if (!userId) {
        throw new UnauthorizedException('Invalid access token payload');
      }
      this.debug(`Token valid for userId=${userId}`);

      // Step 3: Fetch user from database
      this.debug(`Loading user from database id=${userId}`);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User not found for id=${userId}`);
        throw new UnauthorizedException('User not found');
      }
      this.debug(`User found email=${user.email}`);

      // Step 4: Extract X-Tenant-ID header
      const tenantIdFromHeader = req.headers['x-tenant-id'] as string | undefined;
      const tenantIdFromToken = payload.activeTenant?.id;
      const tenantId = tenantIdFromHeader ?? tenantIdFromToken;
      this.debug(`Tenant header present: ${Boolean(tenantId)}`);

      if (!tenantId) {
        this.logger.warn('Missing X-Tenant-ID header');
        throw new UnauthorizedException('X-Tenant-ID header required');
      }

      // Step 5: Verify membership
      this.debug(`Checking membership userId=${user.id} tenantId=${tenantId}`);
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId,
          },
        },
        include: { tenant: true },
      });

      if (!membership) {
        this.logger.warn(`Access denied: userId=${user.id} is not a member of tenantId=${tenantId}`);
        throw new UnauthorizedException('Access denied to this tenant');
      }
      this.debug(`Membership found role=${membership.role}`);

      // Step 6: Attach to request object
      authReq.user = user;
      authReq.membership = membership;
      authReq.tenant = membership.tenant;
      this.debug('Attached user/membership/tenant to request context');
      
      next();
    } catch (err: unknown) {
      const errorType = err instanceof Error ? err.constructor.name : typeof err;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Tenant middleware error type=${errorType} message=${errorMessage}`);
      
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid token or tenant');
    }
  }
}
