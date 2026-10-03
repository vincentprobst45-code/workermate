import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../../prisma.service';
import { AuthenticationMiddleware } from './authentication.middleware';
import { ACCESS_TOKEN_COOKIE } from '../../auth/auth.constants';

describe('AuthenticationMiddleware', () => {
  function createMiddleware() {
    const jwt = { verify: jest.fn() };
    const prisma = { user: { findUnique: jest.fn() } };
    return {
      middleware: new AuthenticationMiddleware(jwt as unknown as JwtService, prisma as unknown as PrismaService),
      jwt,
      prisma,
    };
  }

  it('allows public auth and health routes without a token', async () => {
    const { middleware, jwt } = createMiddleware();
    const next = jest.fn();

    await middleware.use({ path: '/auth/login', method: 'POST' } as never, {} as never, next);
    await middleware.use({ path: '/health/ready', method: 'GET' } as never, {} as never, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('rejects protected routes without a token', async () => {
    const { middleware } = createMiddleware();

    await expect(middleware.use({ path: '/customers', method: 'GET', headers: {}, cookies: {} } as never, {} as never, jest.fn())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('authenticates a bearer token and attaches the user', async () => {
    const { middleware, jwt, prisma } = createMiddleware();
    const user = { id: 'user-1', email: 'jane@example.com' };
    jwt.verify.mockReturnValue({ sub: 'user-1' });
    prisma.user.findUnique.mockResolvedValue(user);
    const request = { path: '/customers', method: 'GET', headers: { authorization: 'Bearer access-token' }, cookies: {} } as never;
    const next = jest.fn();

    await middleware.use(request, {} as never, next);

    expect(jwt.verify).toHaveBeenCalledWith('access-token');
    expect(request.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('accepts the access token cookie and rejects an invalid token', async () => {
    const { middleware, jwt, prisma } = createMiddleware();
    jwt.verify.mockReturnValue({ sub: 'user-1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    const next = jest.fn();

    await middleware.use({ path: '/customers', method: 'GET', headers: {}, cookies: { [ACCESS_TOKEN_COOKIE]: 'cookie-token' } } as never, {} as never, next);
    expect(jwt.verify).toHaveBeenCalledWith('cookie-token');

    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    await expect(middleware.use({ path: '/customers', method: 'GET', headers: {}, cookies: {} } as never, {} as never, jest.fn())).rejects.toBeInstanceOf(UnauthorizedException);
  });
});