'use client';

import { useState } from 'react';
import AddNotificationForm from '../components/AddNotificationForm';
import NotificationsList from '../components/NotificationsList';
import { ProtectedRoute } from '../protected-route';

export default function NotificationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-zinc-50 px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.2fr)]">
          <AddNotificationForm onCreated={() => setRefreshKey((current) => current + 1)} />
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h1 className="text-xl font-semibold text-zinc-900">Mes notifications</h1>
              <span className="text-sm text-zinc-500">Actualiser via la page</span>
            </div>
            <div key={refreshKey}>
              <NotificationsList />
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
