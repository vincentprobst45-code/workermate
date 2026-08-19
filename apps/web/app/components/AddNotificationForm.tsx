'use client';

import { NotificationType } from '@prisma/client';
import { type FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

export type NotificationRecipient = {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
};

type AddNotificationFormProps = {
  onCreated?: () => void;
};

const notificationTypes: Array<{ value: NotificationType; label: string }> = [
  { value: 'USER_MESSAGE', label: 'Message utilisateur' },
  { value: 'SYSTEM', label: 'Système' },
  { value: 'PROJECT', label: 'Projet' },
  { value: 'QUOTE', label: 'Devis' },
  { value: 'INVOICE', label: 'Facture' },
  { value: 'CALENDAR', label: 'Planning' },
  { value: 'OTHER', label: 'Autre' },
];

function recipientName(recipient: NotificationRecipient): string {
  return [recipient.firstname, recipient.lastname].filter(Boolean).join(' ') || recipient.email;
}

export default function AddNotificationForm({ onCreated }: AddNotificationFormProps) {
  const api = useApiClient();
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [type, setType] = useState<NotificationType>('USER_MESSAGE');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadRecipients() {
      try {
        const response = await api.get('/notifications/recipients');
        if (!response.ok) throw new Error('Erreur');
        const data: NotificationRecipient[] = await response.json();
        if (!cancelled) setRecipients(data);
      } catch {
        if (!cancelled) setError('Erreur lors de la récupération des destinataires.');
      } finally {
        if (!cancelled) setLoadingRecipients(false);
      }
    }
    void loadRecipients();
    return () => { cancelled = true; };
  }, [api]);

  function toggleRecipient(id: string) {
    setSelectedRecipientIds((current) => current.includes(id)
      ? current.filter((recipientId) => recipientId !== id)
      : [...current, id]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedRecipientIds.length) {
      setError('Sélectionnez au moins un destinataire.');
      return;
    }
    if (!message.trim()) {
      setError('Le message est obligatoire.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/notifications', {
        recipientIds: selectedRecipientIds,
        type,
        title: title.trim() || undefined,
        message: message.trim(),
      });
      if (!response.ok) throw new Error('Erreur');
      setSelectedRecipientIds([]);
      setTitle('');
      setMessage('');
      setSuccess('Notification envoyée.');
      onCreated?.();
    } catch {
      setError('Erreur lors de l’envoi de la notification.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Envoyer une notification</h2>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
      <label className="flex flex-col gap-1.5 text-sm"><span className="font-medium text-zinc-700">Type</span><select className="rounded-md border border-zinc-300 px-3 py-2" value={type} onChange={(event) => setType(event.target.value as NotificationType)}>{notificationTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <fieldset className="space-y-2"><legend className="text-sm font-medium text-zinc-700">Destinataires</legend>{loadingRecipients ? <p className="text-sm text-zinc-500">Chargement...</p> : recipients.length ? <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-zinc-200 p-3">{recipients.map((recipient) => <label key={recipient.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedRecipientIds.includes(recipient.id)} onChange={() => toggleRecipient(recipient.id)} /><span>{recipientName(recipient)} <span className="text-zinc-500">({recipient.email})</span></span></label>)}</div> : <p className="text-sm text-zinc-500">Aucun autre utilisateur dans ce tenant.</p>}</fieldset>
      <label className="flex flex-col gap-1.5 text-sm"><span className="font-medium text-zinc-700">Titre</span><input className="rounded-md border border-zinc-300 px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label className="flex flex-col gap-1.5 text-sm"><span className="font-medium text-zinc-700">Message *</span><textarea className="min-h-28 rounded-md border border-zinc-300 px-3 py-2" value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
      <button type="submit" disabled={submitting || loadingRecipients} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Envoi...' : 'Envoyer la notification'}</button>
    </form>
  );
}
