'use client';

import type { Customer } from './CustomersList';

type CustomersDetailsProps = {
  customer: Customer;
  onClose: () => void;
};

function valueOrDash(value?: string | null): string {
  return value?.trim() || '-';
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

export default function CustomersDetails({ customer, onClose }: CustomersDetailsProps) {
  const fullName = [customer.firstName, customer.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');
  const displayName = fullName || valueOrDash(customer.company);
  const initials = [customer.firstName, customer.lastName, customer.company]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || '?';
  const addressLines = [
    customer.address?.street1,
    customer.address?.postalCode,
    customer.address?.city,
  ].filter((value): value is string => Boolean(value?.trim()));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-details-title"
      className="max-h-[90vh] w-[92vw] max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white sm:px-8">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-teal-400/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-400 text-xl font-bold text-slate-950 shadow-lg shadow-teal-950/40">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Fiche client</p>
              <h3 id="customer-details-title" className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{displayName}</h3>
              <p className="mt-1 truncate text-sm text-slate-300">{valueOrDash(customer.company)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">Client actif</span>
            <button type="button" aria-label="Fermer la fiche client" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:bg-slate-800" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <span>ID client: {customer.id}</span>
          <span>Créé le {formatDate(customer.createdAt)}</span>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Identité</h4>
              <span className="text-xs text-slate-400">Profil</span>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div><p className="text-xs text-slate-500">Prénom</p><p className="mt-1 font-medium text-slate-900">{valueOrDash(customer.firstName)}</p></div>
              <div><p className="text-xs text-slate-500">Nom</p><p className="mt-1 font-medium text-slate-900">{valueOrDash(customer.lastName)}</p></div>
              <div><p className="text-xs text-slate-500">Entreprise</p><p className="mt-1 font-medium text-slate-900">{valueOrDash(customer.company)}</p></div>
              <div><p className="text-xs text-slate-500">SIRET</p><p className="mt-1 font-medium text-slate-900">{valueOrDash(customer.siret)}</p></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Coordonnées</h4>
              <span className="text-xs text-slate-400">Contact</span>
            </div>
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-slate-500">Email</p>{customer.email ? <a className="mt-1 block truncate font-medium text-teal-700 hover:text-teal-900" href={`mailto:${customer.email}`}>{customer.email}</a> : <p className="mt-1 font-medium text-slate-900">-</p>}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Téléphone</p><p className="mt-1 font-medium text-slate-900">{valueOrDash(customer.phone)}</p></div>
                <div><p className="text-xs text-slate-500">Mobile</p><p className="mt-1 font-medium text-slate-900">{valueOrDash(customer.mobile)}</p></div>
              </div>
              <div><p className="text-xs text-slate-500">N° de TVA</p><p className="mt-1 font-medium text-slate-900">{valueOrDash(customer.vatNumber)}</p></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Adresse de facturation</h4>
            <div className="rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-800">
              <p className="font-medium">{addressLines[0] || '-'}</p>
              <p>{addressLines.slice(1).join(' ') || '-'}</p>
            </div>
            <p className="mt-3 text-xs text-slate-400">Identifiant adresse: {valueOrDash(customer.addressId)}</p>
          </div>

          <div className="rounded-xl border border-teal-100 bg-teal-50 p-5 shadow-sm">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">Compte</h4>
            <p className="text-xs text-teal-700">Créé par</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-900">{valueOrDash(customer.createdById)}</p>
            <p className="mt-4 text-xs text-teal-700">Tenant</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-900">{customer.tenantId}</p>
          </div>
        </section>

        <section className="rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-900">Notes internes</h4>
            <span className="text-xs text-amber-700">Privé</span>
          </div>
          <p className="min-h-10 whitespace-pre-wrap text-sm leading-6 text-slate-700">{valueOrDash(customer.notes)}</p>
        </section>

        <footer className="flex justify-end border-t border-slate-200 pt-5">
          <button type="button" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700" onClick={onClose}>
            Fermer la fiche
          </button>
        </footer>
      </div>
    </div>
  );
}
