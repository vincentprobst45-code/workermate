import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth-request';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authReq = req as AuthenticatedRequest;
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║         [TenantMiddleware] REQUEST START              ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`[TenantMiddleware] Path: ${req.path}`);
    console.log(`[TenantMiddleware] Method: ${req.method}`);
    
    // Skip auth/refresh endpoints
    if (req.path.includes('/auth/') || req.path === '/health') {
      console.log('[TenantMiddleware] ✅ Skipping middleware for auth endpoint');
      return next();
    }

    // Step 1: Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log(`\n[Step 1] Authorization header: ${authHeader ? '✅ Present' : '❌ MISSING'}`);
    if (authHeader) {
      console.log(`[Step 1]   Value: "${authHeader.substring(0, 20)}..."`);
    }

    const token = authHeader?.split(' ')[1];
    console.log(`[Step 1] Token extracted: ${token ? '✅ Yes' : '❌ NO - THIS WILL CAUSE 401'}`);

    if (!token) {
      console.log('[Step 1] ❌ ERROR: No bearer token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Step 2: Verify JWT token
      console.log('\n[Step 2] Verifying JWT token...');
      const payload = this.jwtService.verify<JwtPayload>(token);
      console.log(`[Step 2] ✅ Token valid. User ID: ${payload.sub}`);

      // Step 3: Fetch user from database
      console.log(`\n[Step 3] Fetching user from database (ID: ${payload.sub})...`);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        console.log(`[Step 3] ❌ User not found in database`);
        throw new UnauthorizedException('User not found');
      }
      console.log(`[Step 3] ✅ User found: ${user.email}`);

      // Step 4: Extract X-Tenant-ID header
      const tenantId = req.headers['x-tenant-id'] as string;
      console.log(`\n[Step 4] X-Tenant-ID header: ${tenantId ? '✅ ' + tenantId : '❌ MISSING - THIS WILL CAUSE 401'}`);

      if (!tenantId) {
        console.log('[Step 4] ❌ ERROR: X-Tenant-ID header not provided');
        throw new UnauthorizedException('X-Tenant-ID header required');
      }

      // Step 5: Verify membership
      console.log(`\n[Step 5] Checking membership: User ${user.id} in Tenant ${tenantId}...`);
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
        console.log(`[Step 5] ❌ No membership found. User is not member of this tenant`);
        throw new UnauthorizedException('Access denied to this tenant');
      }
      console.log(`[Step 5] ✅ Membership found. Role: ${membership.role}`);

      // Step 6: Attach to request object
      console.log(`\n[Step 6] Attaching user and membership to request object...`);
      authReq.user = user;
      authReq.membership = membership;
      authReq.tenant = membership.tenant;
      console.log('[Step 6] ✅ Attached successfully');

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║         [TenantMiddleware] ✅ SUCCESS - NEXT()         ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      
      next();
    } catch (err: unknown) {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║         [TenantMiddleware] ❌ ERROR                    ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      const errorType = err instanceof Error ? err.constructor.name : typeof err;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.log(`Error type: ${errorType}`);
      console.log(`Error message: ${errorMessage}`);
      console.log('');
      
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid token or tenant');
    }
  }
}
