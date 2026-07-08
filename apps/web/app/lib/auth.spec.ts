import { describe, it, expect, vi, beforeEach } from 'vitest';

const cookieGetMock = vi.fn();
const verifyMock = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: cookieGetMock,
  }),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: verifyMock,
  },
}));

describe('getSession', () => {
  beforeEach(() => {
    cookieGetMock.mockReset();
    verifyMock.mockReset();
  });

  it('returns EMPTY_SESSION when access token cookie is missing', async () => {
    cookieGetMock.mockReturnValue(undefined);

    const { getSession } = await import('./auth');
    const session = await getSession();

    expect(session).toEqual({
      user: null,
      tenants: [],
      activeTenant: null,
    });
  });

  it('maps decoded JWT payload to session shape', async () => {
    cookieGetMock.mockReturnValue({ value: 'token-123' });
    verifyMock.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
      },
      activeTenant: {
        id: 'tenant-1',
        name: 'Acme',
        role: 'OWNER',
      },
    });

    const { getSession } = await import('./auth');
    const session = await getSession();

    expect(session).toEqual({
      user: {
        id: 'user-1',
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
      },
      tenants: [
        {
          tenantId: 'tenant-1',
          tenantName: 'Acme',
          role: 'OWNER',
        },
      ],
      activeTenant: {
        tenantId: 'tenant-1',
        tenantName: 'Acme',
        role: 'OWNER',
      },
    });
  });
});
