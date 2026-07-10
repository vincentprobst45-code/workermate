import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './auth.context';
import { ProtectedRoute } from './protected-route';
import { EMPTY_SESSION } from './lib/session';
import type { Session } from './lib/auth.types';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const loggedInSession: Session = {
  user: { id: 'u1', email: 'john@example.com', firstname: 'John', lastname: 'Doe' },
  tenants: [{ tenantId: 't1', tenantName: 'Acme', role: 'OWNER' }],
  activeTenant: { tenantId: 't1', tenantName: 'Acme', role: 'OWNER' },
};

function renderWith(session: Session, ui: React.ReactNode) {
  return render(<AuthProvider session={session}>{ui}</AuthProvider>);
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('shows checking state and redirects to /login when no user', () => {
    renderWith(
      EMPTY_SESSION,
      <ProtectedRoute><p>content</p></ProtectedRoute>,
    );

    expect(screen.getByText('Vérification...')).toBeTruthy();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('renders children when user is authenticated', () => {
    renderWith(
      loggedInSession,
      <ProtectedRoute><p>secret content</p></ProtectedRoute>,
    );

    expect(screen.getByText('secret content')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('redirects to / when user does not have a required role', () => {
    const memberSession: Session = {
      ...loggedInSession,
      activeTenant: { tenantId: 't1', tenantName: 'Acme', role: 'MEMBER' },
    };

    renderWith(
      memberSession,
      <ProtectedRoute requiredRole={['OWNER', 'ADMIN']}><p>admin only</p></ProtectedRoute>,
    );

    expect(pushMock).toHaveBeenCalledWith('/');
  });

  it('does not redirect when user has an allowed role', () => {
    const adminSession: Session = {
      ...loggedInSession,
      activeTenant: { tenantId: 't1', tenantName: 'Acme', role: 'ADMIN' },
    };

    renderWith(
      adminSession,
      <ProtectedRoute requiredRole={['OWNER', 'ADMIN']}><p>allowed</p></ProtectedRoute>,
    );

    expect(screen.getByText('allowed')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
