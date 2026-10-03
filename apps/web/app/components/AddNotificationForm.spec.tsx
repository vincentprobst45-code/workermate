import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddNotificationForm from './AddNotificationForm';
import { AuthProvider } from '../auth.context';
import type { Session } from '../lib/auth.types';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const session: Session = {
  user: { id: 'user-1', email: 'user@example.com', firstname: 'Jane', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' }],
  activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' },
};

function renderForm(onCreated = vi.fn()) {
  return { onCreated, ...render(<AuthProvider session={session}><AddNotificationForm onCreated={onCreated} /></AuthProvider>) };
}

describe('AddNotificationForm', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('loads and displays available recipients', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([{ id: 'user-2', firstname: 'John', lastname: 'Doe', email: 'john@example.com' }]),
    });

    renderForm();

    expect(await screen.findByText(/John Doe/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/notifications/recipients', expect.objectContaining({ method: 'GET' }));
  });

  it('requires a recipient and a nonblank message', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue([{ id: 'user-2', email: 'john@example.com' }]) });
    renderForm();
    await screen.findByRole('checkbox');

    fireEvent.submit(screen.getByRole('button', { name: 'Envoyer la notification' }));
    expect(await screen.findByText('Sélectionnez au moins un destinataire.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByLabelText('Message *'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Envoyer la notification' }));
    expect(await screen.findByText('Le message est obligatoire.')).toBeInTheDocument();
  });

  it('submits trimmed values, resets the form, and notifies the parent', async () => {
    const onCreated = vi.fn();
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue([{ id: 'user-2', email: 'john@example.com' }]) })
      .mockResolvedValueOnce({ ok: true, status: 201 });
    renderForm(onCreated);
    await screen.findByRole('checkbox');

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: '  Titre  ' } });
    fireEvent.change(screen.getByLabelText('Message *'), { target: { value: '  Bonjour  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la notification' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:4000/notifications');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      recipientIds: ['user-2'],
      type: 'USER_MESSAGE',
      title: 'Titre',
      message: 'Bonjour',
    });
    expect(screen.getByLabelText('Titre')).toHaveValue('');
    expect(screen.getByLabelText('Message *')).toHaveValue('');
    expect(screen.getByText('Notification envoyée.')).toBeInTheDocument();
  });

  it('shows recipient loading and submission errors', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: vi.fn() });
    renderForm();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(await screen.findByText('Erreur lors de la récupération des destinataires.')).toBeInTheDocument();
  });
});
