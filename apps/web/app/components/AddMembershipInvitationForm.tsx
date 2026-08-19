'use client';

import { type FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

type AddMembershipInvitationFormProps = {
  onCreated?: () => void;
};

export default function AddMembershipInvitationForm({ onCreated }: AddMembershipInvitationFormProps) {
  const api = useApiClient();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await api.post('/memberships/invitations', { email: email.trim() });
      if (!response.ok) {
        let message = `Erreur HTTP ${response.status}`;
        try {
          const body = await response.json() as { message?: string | string[] };
          message = Array.isArray(body.message) ? body.message.join(', ') : body.message || message;
        } catch {
          // Keep the HTTP status when the API response is not JSON.
        }
        throw new Error(message);
      }
      setEmail('');
      setSuccess('Invitation envoyée.');
      onCreated?.();
    } catch (invitationError) {
      setError(invitationError instanceof Error ? invitationError.message : 'Erreur lors de l’envoi de l’invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Inviter un utilisateur</h2>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <button type="submit" disabled={submitting} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {submitting ? 'Envoi...' : 'Envoyer l’invitation'}
      </button>
    </form>
  );
}
