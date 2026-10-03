import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';
import type { AuthResult } from './auth.service';

describe('AuthController', () => {
  const session = {
    user: { id: 'user-1', email: 'jane@example.com', firstname: 'Jane', lastname: 'Doe' },
    tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' as const }],
    activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' as const },
  };
  const authResult: AuthResult = {
    session,
    tokens: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenMaxAge: 900,
      refreshTokenMaxAge: 604800,
    },
  };

  function createController() {
    const authService = {
      register: jest.fn().mockResolvedValue(authResult),
      validateUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
      login: jest.fn().mockResolvedValue(authResult),
      refreshAccessToken: jest.fn().mockResolvedValue(authResult),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
      switchTenant: jest.fn().mockResolvedValue(authResult),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
    };
    const cookieMock = jest.fn();
    const clearCookieMock = jest.fn();
    const response = { cookie: cookieMock, clearCookie: clearCookieMock } as unknown as Response;
    return { controller: new AuthController(authService as never), authService, response, cookieMock, clearCookieMock };
  }

  it('sets httpOnly auth cookies after login', async () => {
    const { controller, response, cookieMock } = createController();

    await expect(controller.login({ email: 'jane@example.com', password: 'password' }, response)).resolves.toEqual(session);

    expect(cookieMock).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, 'access-token', expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 900000 }));
    expect(cookieMock).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, 'refresh-token', expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 604800000 }));
  });

  it('returns unauthorized for invalid login credentials', async () => {
    const { controller, authService, response, cookieMock } = createController();
    authService.validateUser.mockResolvedValue(null);

    await expect(controller.login({ email: 'jane@example.com', password: 'wrong' }, response)).rejects.toMatchObject({ status: 401 });
    expect(cookieMock).not.toHaveBeenCalled();
  });

  it('prefers the refresh cookie and renews auth cookies', async () => {
    const { controller, authService, response, cookieMock } = createController();
    const request = { cookies: { [REFRESH_TOKEN_COOKIE]: 'cookie-refresh' } } as unknown as Request;

    await controller.refresh(request, {}, response);

    expect(authService.refreshAccessToken).toHaveBeenCalledWith('cookie-refresh');
    expect(cookieMock).toHaveBeenCalledTimes(2);
  });

  it('rejects refresh when no token is available', async () => {
    const { controller, authService, response } = createController();

    await expect(controller.refresh({ cookies: {} } as unknown as Request, {}, response)).rejects.toMatchObject({ status: 401 });
    expect(authService.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('switches tenant only through the authenticated user context', async () => {
    const { controller, authService, response, cookieMock } = createController();
    const request = { user: { id: 'user-1' } } as never;

    await expect(controller.switchTenant(request, { tenantId: 'tenant-2' }, response)).resolves.toEqual(session);

    expect(authService.switchTenant).toHaveBeenCalledWith('user-1', 'tenant-2');
    expect(cookieMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a tenant switch without a tenant id', async () => {
    const { controller, authService, response } = createController();

    await expect(controller.switchTenant({ user: { id: 'user-1' } } as never, {}, response)).rejects.toMatchObject({ status: 403 });
    expect(authService.switchTenant).not.toHaveBeenCalled();
  });

  it('revokes the refresh token and clears both auth cookies on logout', async () => {
    const { controller, authService, response, clearCookieMock } = createController();
    const request = { cookies: { [REFRESH_TOKEN_COOKIE]: 'refresh-token' } } as unknown as Request;

    await expect(controller.logout(request, response)).resolves.toEqual({ success: true });
    expect(authService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(clearCookieMock).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, expect.objectContaining({ httpOnly: true, path: '/' }));
    expect(clearCookieMock).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, expect.objectContaining({ httpOnly: true, path: '/' }));
  });
});