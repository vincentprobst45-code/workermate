import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider } from './auth.context';
import { useApiClient } from './api-client';
import { EMPTY_SESSION } from './lib/session';
import type { Session } from './lib/auth.types';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const sessionWithTenant: Session = {
  user: { id: 'u1', email: 'a@b.com', firstname: 'John', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-abc', tenantName: 'Acme', role: 'OWNER' }],
  activeTenant: { tenantId: 'tenant-abc', tenantName: 'Acme', role: 'OWNER' },
};

function makeWrapper(session: Session) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider session={session}>{children}</AuthProvider>;
  }
  return Wrapper;
}

describe('useApiClient', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('adds X-Tenant-ID header when activeTenant is present', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: makeWrapper(sessionWithTenant),
    });
    await result.current.get('/customers');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/customers',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Tenant-ID': 'tenant-abc' }),
      }),
    );
  });

  it('does not add X-Tenant-ID when there is no activeTenant', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: makeWrapper(EMPTY_SESSION),
    });
    await result.current.get('/public');

    const callHeaders = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(callHeaders['X-Tenant-ID']).toBeUndefined();
  });

  it('uses the correct HTTP method for each helper', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: makeWrapper(sessionWithTenant),
    });

    await result.current.get('/res');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'GET' });

    await result.current.post('/res', { name: 'x' });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST' });

    await result.current.put('/res/1', { name: 'y' });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'PUT' });

    await result.current.delete('/res/1');
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: 'DELETE' });
  });

  it('retries the original request after a successful token refresh on 401', async () => {
    fetchMock
      .mockResolvedValueOnce({ status: 401, ok: false })  // original → 401
      .mockResolvedValueOnce({ ok: true })                  // /auth/refresh → ok
      .mockResolvedValueOnce({ status: 200, ok: true });   // retry → 200

    const { result } = renderHook(() => useApiClient(), {
      wrapper: makeWrapper(sessionWithTenant),
    });
    const res = await result.current.get('/protected');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((res as { status: number }).status).toBe(200);
  });

  it('throws when the refresh request fails after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce({ status: 401, ok: false })  // original → 401
      .mockResolvedValueOnce({ ok: false });               // /auth/refresh → not ok

    const { result } = renderHook(() => useApiClient(), {
      wrapper: makeWrapper(sessionWithTenant),
    });

    await expect(result.current.get('/protected')).rejects.toThrow(
      'Session expired, please login again',
    );
  });

  it('passes credentials: include on every request', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true });

    const { result } = renderHook(() => useApiClient(), {
      wrapper: makeWrapper(sessionWithTenant),
    });
    await result.current.post('/orders', { qty: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
