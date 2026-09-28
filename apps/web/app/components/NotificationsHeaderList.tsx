'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, Check, LoaderCircle } from 'lucide-react';
import { useApiClient } from '../api-client';

type HeaderNotification = {
  id: string;
  title?: string | null;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

type NotificationsHeaderListProps = {
  open: boolean;
  onUnreadCountChange: (count: number) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function NotificationsHeaderList({ open, onUnreadCountChange }: NotificationsHeaderListProps) {
  const api = useApiClient();
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const response = await api.get('/notifications');
        if (!response.ok) throw new Error('Impossible de charger les notifications.');
        const data = await response.json() as HeaderNotification[];
        if (cancelled) return;
        setNotifications(data);
        onUnreadCountChange(data.filter((notification) => !notification.readAt).length);
        setError('');
      } catch {
        if (!cancelled) setError('Notifications indisponibles.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotifications();
    return () => { cancelled = true; };
  }, [api, onUnreadCountChange]);

  async function markAsRead(notification: HeaderNotification) {
    if (notification.readAt) return;
    const response = await api.put(`/notifications/${notification.id}/read`);
    if (!response.ok) return;
    const unreadAfterUpdate = notifications.filter((item) => !item.readAt && item.id !== notification.id).length;
    setNotifications((current) => current.map((item) => item.id === notification.id
      ? { ...item, readAt: new Date().toISOString() }
      : item));
    onUnreadCountChange(unreadAfterUpdate);
  }

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10" role="dialog" aria-label="Notifications récentes">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-slate-500" aria-hidden="true" /><h2 className="text-sm font-semibold text-slate-900">Notifications</h2></div>
        <Link href="/notifications" className="text-xs font-semibold text-indigo-700 hover:text-indigo-900" onClick={() => onUnreadCountChange(0)}>Tout voir</Link>
      </div>
      {loading && <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement...</div>}
      {!loading && error && <p className="px-4 py-5 text-sm text-rose-700">{error}</p>}
      {!loading && !error && !notifications.length && <p className="px-4 py-6 text-sm text-slate-500">Aucune notification récente.</p>}
      {!loading && !error && notifications.length > 0 && <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{notifications.slice(0, 5).map((notification) => <li key={notification.id}><button type="button" className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none" onClick={() => void markAsRead(notification)}><span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${notification.readAt ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-700'}`}>{notification.readAt ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Bell className="h-3.5 w-3.5" aria-hidden="true" />}</span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><strong className={`truncate text-sm ${notification.readAt ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{notification.title || 'Notification'}</strong><time className="shrink-0 text-[11px] text-slate-400" dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time></span><span className="mt-1 block truncate text-xs text-slate-500">{notification.message}</span></span></button></li>)}</ul>}
    </div>
  );
}
