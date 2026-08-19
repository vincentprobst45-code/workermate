'use client';

import type { AuthUser, Session, TenantMembership } from '../lib/auth.types';

type UserDetailsProps = {
  user: AuthUser;
  activeTenant: TenantMembership | null;
  tenants: TenantMembership[];
};

function valueOrDash(value?: string | null): string {
  return value?.trim() || '-';
}

export default function UserDetails({ user, activeTenant, tenants }: UserDetailsProps) {
  return (
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <header className="border-b border-zinc-200 bg-zinc-50 px-6 py-5">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Compte utilisateur</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          {[user.firstname, user.lastname].filter(Boolean).join(' ') || user.email}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
      </header>

      <div className="space-y-5 p-6">
        <section className="rounded-lg border border-zinc-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">Identité</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm"><span className="text-zinc-500">Prénom</span><br /><strong>{valueOrDash(user.firstname)}</strong></p>
            <p className="text-sm"><span className="text-zinc-500">Nom</span><br /><strong>{valueOrDash(user.lastname)}</strong></p>
            <p className="text-sm sm:col-span-2"><span className="text-zinc-500">Email</span><br /><strong>{user.email}</strong></p>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">Tenant actif</h2>
          {activeTenant ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="text-sm"><span className="text-zinc-500">Entreprise</span><br /><strong>{activeTenant.tenantName}</strong></p>
              <p className="text-sm"><span className="text-zinc-500">Rôle</span><br /><strong>{activeTenant.role}</strong></p>
              <p className="text-sm sm:col-span-2"><span className="text-zinc-500">Identifiant</span><br /><strong className="break-all">{activeTenant.tenantId}</strong></p>
            </div>
          ) : <p className="text-sm text-zinc-600">Aucun tenant actif.</p>}
        </section>

        <section className="rounded-lg border border-zinc-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">Accès</h2>
          {tenants.length ? (
            <ul className="divide-y divide-zinc-200">
              {tenants.map((tenant) => (
                <li key={tenant.tenantId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>{tenant.tenantName}</span>
                  <span className="text-zinc-500">{tenant.role}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-zinc-600">Aucun accès d’entreprise.</p>}
        </section>
      </div>
    </section>
  );
}
