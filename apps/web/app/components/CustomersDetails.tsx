'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink, Mail, MapPin, Phone, Smartphone, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Customer } from './CustomersList';

type CustomersDetailsProps = {
  customer: Customer;
  onClose: () => void;
  onEdit?: (customer: Customer) => void;
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

function toMapHref(lines: string[]): string | null {
  const address = lines.filter(Boolean).join(', ');
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
}

function Field({ label, value, href, icon: Icon }: { label: string; value: ReactNode; href?: string | null; icon?: typeof Mail }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true" />}
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="mt-0.5 min-w-0 text-sm font-medium text-slate-900">
          {href ? (
            <a className="break-words text-indigo-700 underline-offset-2 hover:text-indigo-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" href={href}>
              {value}
            </a>
          ) : (
            <span className="break-words">{value}</span>
          )}
        </dd>
      </div>
    </div>
  );
}

export default function CustomersDetails({ customer, onClose, onEdit }: CustomersDetailsProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
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
  const mapHref = toMapHref(addressLines);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-details-title"
      ref={dialogRef}
      tabIndex={-1}
      className="flex max-h-[90vh] w-[94vw] max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 bg-slate-900 px-5 py-4 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Client</p>
            <h3 id="customer-details-title" className="truncate text-lg font-semibold tracking-tight text-white">
              {displayName}
            </h3>
            {customer.company && fullName && <p className="truncate text-xs text-slate-300">{customer.company}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Fermer la fiche client"
            ref={closeButtonRef}
            className="rounded-lg border border-slate-600 p-2 text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="overflow-y-auto px-5 py-5 sm:px-6">
        <section aria-labelledby="customer-contact-title">
          <h4 id="customer-contact-title" className="sr-only">Coordonnées</h4>
          <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Email" value={valueOrDash(customer.email)} href={customer.email ? `mailto:${customer.email}` : undefined} icon={Mail} />
            <Field label="Téléphone" value={valueOrDash(customer.phone)} href={phoneHref} icon={Phone} />
            <Field label="Mobile" value={valueOrDash(customer.mobile)} href={mobileHref} icon={Smartphone} />
            {(customer.siret || customer.vatNumber) && <Field label="Identifiants" value={[customer.siret && `SIRET ${customer.siret}`, customer.vatNumber && `TVA ${customer.vatNumber}`].filter(Boolean).join(' · ')} />}
          </dl>
        </section>

        {(addressLines.length > 0 || customer.notes?.trim()) && <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {addressLines.length > 0 && <section className="flex min-w-0 gap-2.5" aria-labelledby="customer-address-title">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true" />
              <div className="min-w-0">
                <h4 id="customer-address-title" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Adresse</h4>
                <p className="mt-0.5 text-sm leading-5 text-slate-700">{addressLines.join(', ')}</p>
                {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Voir la carte <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
              </div>
            </section>}
            {customer.notes?.trim() && <section className="min-w-0" aria-labelledby="customer-notes-title">
              <h4 id="customer-notes-title" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Note interne</h4>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-5 text-slate-700">{customer.notes}</p>
            </section>}
          </div>
        </div>}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 sm:px-6">
        <p className="text-[11px] text-slate-400">Client depuis le {formatDate(customer.createdAt)}</p>
        <div className="flex flex-wrap justify-end gap-2">
          {onEdit && <button type="button" className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" onClick={() => onEdit(customer)}>Modifier</button>}
          <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={onClose}>Fermer</button>
        </div>
      </footer>
    </div>
  );
}
