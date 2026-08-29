'use client';

import type { ReactNode } from 'react';
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
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// digits-only helper so labels like "01 02 03 04 05" stay clickable as tel: links
function toTelHref(value?: string | null): string | null {
  const digits = value?.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

function Field({ label, value, href }: { label: string; value: ReactNode; href?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-slate-900">
        {href ? (
          <a className="text-teal-700 underline-offset-2 hover:text-teal-900 hover:underline" href={href}>
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
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
  const phoneHref = toTelHref(customer.phone);
  const mobileHref = toTelHref(customer.mobile);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-details-title"
      className="flex max-h-[90vh] w-[94vw] max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-t-2xl bg-slate-900 px-5 py-5 text-white sm:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-400 text-lg font-bold text-slate-950">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Fiche client</p>
            <h3 id="customer-details-title" className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {displayName}
            </h3>
            {fullName && <p className="truncate text-sm text-slate-300">{valueOrDash(customer.company)}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Client actif</span>
          <button
            type="button"
            aria-label="Fermer la fiche client"
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </header>

      <div className="space-y-6 overflow-y-auto p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Coordonnées</h4>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field
                  label="Email"
                  value={valueOrDash(customer.email)}
                  href={customer.email ? `mailto:${customer.email}` : undefined}
                />
              </div>
              <Field label="Téléphone" value={valueOrDash(customer.phone)} href={phoneHref} />
              <Field label="Mobile" value={valueOrDash(customer.mobile)} href={mobileHref} />
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Identité &amp; informations légales</h4>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Prénom" value={valueOrDash(customer.firstName)} />
              <Field label="Nom" value={valueOrDash(customer.lastName)} />
              <Field label="Entreprise" value={valueOrDash(customer.company)} />
              <Field label="SIRET" value={valueOrDash(customer.siret)} />
              <div className="col-span-2">
                <Field label="N° de TVA" value={valueOrDash(customer.vatNumber)} />
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 p-5">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Adresse de facturation</h4>
          <div className="rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-800">
            <p className="font-medium">{addressLines[0] || '-'}</p>
            <p>{addressLines.slice(1).join(' ') || '-'}</p>
          </div>
          <p className="mt-3 text-xs text-slate-400">Identifiant adresse : {valueOrDash(customer.addressId)}</p>
        </section>

        <section className="rounded-xl border-l-4 border-slate-300 bg-slate-50 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Notes internes</h4>
            <span className="text-xs font-medium text-slate-400">Visible par l&apos;équipe uniquement</span>
          </div>
          <p className="min-h-10 whitespace-pre-wrap text-sm leading-6 text-slate-700">{valueOrDash(customer.notes)}</p>
        </section>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
          <div className="flex gap-1"><dt>ID client:</dt><dd className="break-all">{customer.id}</dd></div>
          <div className="flex gap-1"><dt>Créé le</dt><dd>{formatDate(customer.createdAt)}</dd></div>
          {customer.createdById && <div className="flex gap-1"><dt>Créé par:</dt><dd className="break-all">{customer.createdById}</dd></div>}
          <div className="flex gap-1"><dt>Tenant:</dt><dd className="break-all">{customer.tenantId}</dd></div>
        </dl>
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          onClick={onClose}
        >
          Fermer la fiche
        </button>
      </footer>
    </div>
  );
}
