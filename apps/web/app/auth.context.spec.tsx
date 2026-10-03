import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth.context';
import { EMPTY_SESSION } from './lib/session';
import type { Session } from './lib/auth.types';

const fullSession: Session = {
  user: { id: 'u1', email: 'john@example.com', firstname: 'John', lastname: 'Doe' },
  tenants: [{ tenantId: 't1', tenantName: 'Acme', role: 'OWNER' }],
  activeTenant: { tenantId: 't1', tenantName: 'Acme', role: 'OWNER' },
};

describe('useAuth', () => {
  it('returns EMPTY_SESSION when used without an AuthProvider', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toMatchObject(EMPTY_SESSION);
    expect(result.current.switchTenant).toEqual(expect.any(Function));
  });

  it('returns the session injected via AuthProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider session={fullSession}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.id).toBe('u1');
    expect(result.current.user?.email).toBe('john@example.com');
    expect(result.current.activeTenant?.tenantId).toBe('t1');
    expect(result.current.tenants).toHaveLength(1);
  });

  it('default session has null user and no tenants', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.tenants).toHaveLength(0);
    expect(result.current.activeTenant).toBeNull();
  });

  it('updates reflected when provider session changes', () => {
    const partialSession: Session = {
      user: { id: 'u2', email: 'jane@example.com' },
      tenants: [],
      activeTenant: null,
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider session={partialSession}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.email).toBe('jane@example.com');
    expect(result.current.activeTenant).toBeNull();
  });

  it('switches tenant through the API and keeps the available tenant list', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: fullSession.user,
        tenants: [fullSession.tenants[0]],
        activeTenant: fullSession.activeTenant,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const availableTenants = [
      ...fullSession.tenants,
      { tenantId: 'tenant-2', tenantName: 'Second Co', role: 'MEMBER' as const },
    ];
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider session={{ ...fullSession, tenants: availableTenants }}>
        {children}
      </AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.switchTenant('t1', availableTenants);
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/auth/switch-tenant', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ tenantId: 't1' }),
    }));
    expect(result.current.activeTenant?.tenantId).toBe('t1');
    expect(result.current.tenants).toEqual(availableTenants);
  });

  it('surfaces the API error when tenant switching fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Access denied' }),
    }));
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <AuthProvider session={fullSession}>{children}</AuthProvider>
      ),
    });

    await expect(result.current.switchTenant('tenant-9')).rejects.toThrow('Access denied (HTTP 403)');
  });
});
