'use client';

import { useAuth } from '../auth.context';
import UserDetails from '../components/UserDetails';
import { ProtectedRoute } from '../protected-route';

export default function UserPage() {
  const { user, activeTenant, tenants } = useAuth();

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-zinc-50 px-5 py-8 sm:px-8">
        {user ? (
          <UserDetails user={user} activeTenant={activeTenant} tenants={tenants} />
        ) : (
          <p className="text-sm text-zinc-600">Chargement du compte...</p>
        )}
      </main>
    </ProtectedRoute>
  );
}
