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

  return (
    <div
      className="max-h-[90vh] w-[92vw] max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="border-b border-zinc-200 bg-zinc-50 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Fiche client</p>
            <h3 className="mt-1 text-2xl font-semibold text-zinc-900">{fullName || valueOrDash(customer.company)}</h3>
            {customer.company && <p className="mt-1 text-sm text-zinc-600">{customer.company}</p>}
          </div>
          <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100" onClick={onClose}>
            Fermer
          </button>
        </div>
      </header>

      <div className="space-y-5 p-6">
        <section className="rounded-lg border border-zinc-200 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">Identité</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm"><span className="text-zinc-500">Prénom</span><br /><strong>{valueOrDash(customer.firstName)}</strong></p>
            <p className="text-sm"><span className="text-zinc-500">Nom</span><br /><strong>{valueOrDash(customer.lastName)}</strong></p>
            <p className="text-sm"><span className="text-zinc-500">Entreprise</span><br /><strong>{valueOrDash(customer.company)}</strong></p>
            <p className="text-sm"><span className="text-zinc-500">SIRET</span><br /><strong>{valueOrDash(customer.siret)}</strong></p>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">Coordonnées</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm"><span className="text-zinc-500">Email</span><br /><strong>{valueOrDash(customer.email)}</strong></p>
            <p className="text-sm"><span className="text-zinc-500">Téléphone</span><br /><strong>{valueOrDash(customer.phone)}</strong></p>
            <p className="text-sm"><span className="text-zinc-500">Mobile</span><br /><strong>{valueOrDash(customer.mobile)}</strong></p>
            <p className="text-sm"><span className="text-zinc-500">TVA</span><br /><strong>{valueOrDash(customer.vatNumber)}</strong></p>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">Adresse</h4>
          <p className="text-sm text-zinc-800">{valueOrDash(customer.address?.street1)}</p>
          <p className="text-sm text-zinc-800">{[customer.address?.postalCode, customer.address?.city].filter(Boolean).join(' ') || '-'}</p>
          <p className="mt-2 text-xs text-zinc-500">Identifiant adresse: {valueOrDash(customer.addressId)}</p>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">Notes</h4>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{valueOrDash(customer.notes)}</p>
        </section>

        <footer className="grid gap-2 border-t border-zinc-200 pt-4 text-xs text-zinc-500 sm:grid-cols-2">
          <p>Identifiant client: {customer.id}</p>
          <p>Créé le: {formatDate(customer.createdAt)}</p>
          <p>Tenant: {customer.tenantId}</p>
          <p>Créé par: {valueOrDash(customer.createdById)}</p>
        </footer>
      </div>
    </div>
  );
}
