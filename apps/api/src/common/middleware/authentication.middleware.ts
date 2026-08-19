import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth-request';
import { ACCESS_TOKEN_COOKIE } from '../../auth/auth.constants';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
	private readonly logger = new Logger(AuthenticationMiddleware.name);

	constructor(
		private readonly jwtService: JwtService,
		private readonly prisma: PrismaService,
	) {}

	async use(req: Request, _res: Response, next: NextFunction) {
		const authReq = req as AuthenticatedRequest;
		const publicRoutes = new Set([
			'/auth/login',
			'/auth/register',
			'/auth/refresh',
			'/auth/request-password-reset',
			'/auth/reset-password',
			'/auth/logout',
		]);

		if (publicRoutes.has(req.path) || req.path === '/health') {
			next();
			return;
		}

		const bearerToken = req.headers.authorization?.split(' ')[1];
		const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
		const token = bearerToken ?? cookieToken;

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			const payload = this.jwtService.verify<JwtPayload>(token);
			const userId = payload.sub ?? payload.user?.id;
			if (!userId) {
				throw new UnauthorizedException('Invalid access token payload');
			}

			const user = await this.prisma.user.findUnique({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException('User not found');
			}

			authReq.user = user;
			next();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Invalid access token';
			this.logger.warn(`Authentication failed for ${req.method} ${req.path}: ${message}`);
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException('Invalid access token');
		}
	}
}
