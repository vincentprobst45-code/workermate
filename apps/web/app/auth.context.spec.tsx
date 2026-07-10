import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
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
    expect(result.current).toEqual(EMPTY_SESSION);
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
});
