import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddMembershipInvitationForm from './AddMembershipInvitationForm';
import { AuthProvider } from '../auth.context';
import type { Session } from '../lib/auth.types';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const session: Session = {
  user: { id: 'user-1', email: 'owner@example.com', firstname: 'Jane', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' }],
  activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' },
};

function renderForm(onCreated = vi.fn()) {
  return { onCreated, ...render(<AuthProvider session={session}><AddMembershipInvitationForm onCreated={onCreated} /></AuthProvider>) };
}

describe('AddMembershipInvitationForm', () => {
  beforeEach(() => fetchMock.mockReset());

  it('sends a trimmed email, resets the form, and notifies the parent', async () => {
    const onCreated = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201 });
    renderForm(onCreated);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  invited@example.com  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer l’invitation' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/memberships/invitations', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'invited@example.com' }),
    }));
    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByText('Invitation envoyée.')).toBeInTheDocument();
  });

  it('displays the API error message and keeps the entered email', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: vi.fn().mockResolvedValue({ message: 'Une invitation est déjà en attente.' }),
    });
    renderForm();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer l’invitation' }));

    expect(await screen.findByText('Une invitation est déjà en attente.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('existing@example.com');
  });
});
