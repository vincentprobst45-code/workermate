import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationsList from './NotificationsList';
import { AuthProvider } from '../auth.context';
import type { Session } from '../lib/auth.types';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const session: Session = {
  user: { id: 'user-1', email: 'user@example.com', firstname: 'Jane', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' }],
  activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' },
};

function renderNotificationsList() {
  return render(
    <AuthProvider session={session}>
      <NotificationsList />
    </AuthProvider>,
  );
}

describe('NotificationsList', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('accepts a membership invitation and marks the notification as read', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([
          {
            id: 'notification-1',
            type: 'MEMBERSHIP_INVITE',
            title: 'Invitation',
            message: 'Rejoignez Acme',
            readAt: null,
            createdAt: '2026-08-20T10:00:00.000Z',
            sender: null,
            actions: [
              {
                id: 'action-1',
                label: 'Accepter l’invitation',
                type: 'ACCEPT_MEMBERSHIP_INVITATION',
                targetId: 'invitation-1',
              },
            ],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    renderNotificationsList();

    const actionButton = await screen.findByRole('button', { name: 'Accepter l’invitation' });
    fireEvent.click(actionButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:4000/memberships/accept-invite');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      invitationId: 'invitation-1',
    });
    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:4000/notifications/notification-1/read');
  });

  it('rejects a membership invitation and marks the notification as read', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([
          {
            id: 'notification-2',
            type: 'MEMBERSHIP_INVITE',
            title: 'Invitation',
            message: 'Rejoignez Acme',
            readAt: null,
            createdAt: '2026-08-20T10:00:00.000Z',
            sender: null,
            actions: [
              {
                id: 'action-2',
                label: 'Refuser l’invitation',
                type: 'REJECT_MEMBERSHIP_INVITATION',
                targetId: 'invitation-2',
              },
            ],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    renderNotificationsList();
    fireEvent.click(await screen.findByRole('button', { name: 'Refuser l’invitation' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:4000/memberships/reject-invite');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      invitationId: 'invitation-2',
    });
    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:4000/notifications/notification-2/read');
  });

  it('shows unread notifications by default and all notifications after selecting Voir Tout', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([
        {
          id: 'unread-1',
          type: 'SYSTEM',
          title: 'Non lue',
          message: 'Message non lu',
          readAt: null,
          createdAt: '2026-08-20T10:00:00.000Z',
          sender: null,
          actions: [],
        },
        {
          id: 'read-1',
          type: 'SYSTEM',
          title: 'Déjà lue',
          message: 'Message déjà lu',
          readAt: '2026-08-19T10:00:00.000Z',
          createdAt: '2026-08-19T10:00:00.000Z',
          sender: null,
          actions: [],
        },
      ]),
    });

    renderNotificationsList();

    expect(await screen.findByText('Message non lu')).toBeInTheDocument();
    expect(screen.queryByText('Message déjà lu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Non lues' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Voir Tout' }));

    expect(await screen.findByText('Message déjà lu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voir Tout' })).toHaveAttribute('aria-pressed', 'true');
  });
});
