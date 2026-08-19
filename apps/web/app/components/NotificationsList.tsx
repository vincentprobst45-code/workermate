'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

export type ReceivedNotification = {
  id: string;
  type: string;
  title?: string | null;
  message: string;
  readAt?: string | null;
  createdAt: string;
  sender?: { id: string; firstname?: string | null; lastname?: string | null; email: string } | null;
  actions: Array<{ id: string; label: string; type: string; targetId?: string | null }>;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

function senderName(notification: ReceivedNotification): string {
  if (!notification.sender) return 'Système';
  return [notification.sender.firstname, notification.sender.lastname].filter(Boolean).join(' ') || notification.sender.email;
}

export default function NotificationsList() {
  const api = useApiClient();
  const [notifications, setNotifications] = useState<ReceivedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (!response.ok) throw new Error('Erreur');
      setNotifications(await response.json() as ReceivedNotification[]);
      setError('');
    } catch {
      setError('Erreur lors de la récupération des notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [api]);

  async function markAsRead(notification: ReceivedNotification) {
    if (notification.readAt) return;
    try {
      const response = await api.put(`/notifications/${notification.id}/read`);
      if (!response.ok) throw new Error('Erreur');
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch {
      setError('Erreur lors du marquage de la notification.');
    }
  }

  if (loading) return <p className="text-sm text-zinc-600">Chargement des notifications...</p>;
  if (error && !notifications.length) return <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!notifications.length) return <p className="text-sm text-zinc-600">Aucune notification reçue.</p>;

  return <div className="space-y-3">{notifications.map((notification) => <article key={notification.id} className={`rounded-lg border p-4 ${notification.readAt ? 'border-zinc-200 bg-white' : 'border-blue-200 bg-blue-50'}`}><button type="button" className="w-full text-left" onClick={() => void markAsRead(notification)}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-zinc-900">{notification.title || 'Notification'}</h3><p className="mt-1 text-xs text-zinc-500">De {senderName(notification)} · {formatDate(notification.createdAt)}</p></div>{!notification.readAt && <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">Non lue</span>}</div><p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{notification.message}</p></button>{notification.actions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{notification.actions.map((action) => <button key={action.id} type="button" className="rounded border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-100" onClick={() => void markAsRead(notification)}>{action.label}</button>)}</div>}</article>)}</div>;
}
