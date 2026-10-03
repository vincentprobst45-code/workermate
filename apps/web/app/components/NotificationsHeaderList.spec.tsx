import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import NotificationsHeaderList from './NotificationsHeaderList';
import { AuthProvider } from '../auth.context';
import type { Session } from '../lib/auth.types';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => <a {...props}>{children}</a>,
}));

const session: Session = {
  user: { id: 'user-1', email: 'user@example.com', firstname: 'Jane', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' }],
  activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' },
};

describe('NotificationsHeaderList', () => {
  beforeEach(() => fetchMock.mockReset());

  it('renders nothing when closed', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue([]) });
    render(<AuthProvider session={session}><NotificationsHeaderList open={false} onUnreadCountChange={vi.fn()} /></AuthProvider>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows recent notifications and reports the unread count', async () => {
    const onUnreadCountChange = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([
        { id: 'unread-1', title: 'Nouveau message', message: 'Bonjour', readAt: null, createdAt: '2026-08-20T10:00:00.000Z' },
        { id: 'read-1', title: 'Ancien message', message: 'Déjà lu', readAt: '2026-08-19T10:00:00.000Z', createdAt: '2026-08-19T10:00:00.000Z' },
      ]),
    });

    render(<AuthProvider session={session}><NotificationsHeaderList open onUnreadCountChange={onUnreadCountChange} /></AuthProvider>);

    expect(await screen.findByText('Nouveau message')).toBeInTheDocument();
    expect(screen.getByText('Déjà lu')).toBeInTheDocument();
    expect(onUnreadCountChange).toHaveBeenCalledWith(1);
  });

  it('marks an unread notification as read and updates the count', async () => {
    const onUnreadCountChange = vi.fn();
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue([{ id: 'notification-1', message: 'Bonjour', readAt: null, createdAt: '2026-08-20T10:00:00.000Z' }]) })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    render(<AuthProvider session={session}><NotificationsHeaderList open onUnreadCountChange={onUnreadCountChange} /></AuthProvider>);
    fireEvent.click(await screen.findByRole('button', { name: /Notification.*Bonjour/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:4000/notifications/notification-1/read');
    expect(onUnreadCountChange).toHaveBeenLastCalledWith(0);
  });

  it('shows loading, empty, and error states', async () => {
    let resolveRequest!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
    render(<AuthProvider session={session}><NotificationsHeaderList open onUnreadCountChange={vi.fn()} /></AuthProvider>);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();

    resolveRequest({ ok: false, status: 500 } as Response);
    expect(await screen.findByText('Notifications indisponibles.')).toBeInTheDocument();
  });
});
