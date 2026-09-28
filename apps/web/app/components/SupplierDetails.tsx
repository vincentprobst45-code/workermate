'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApiClient } from '../api-client';
import type { Supplier } from './AddSupplierForm';

type SupplierInvoiceSummary = {
  id: string;
  supplierInvoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  settlementStatus: 'UNSETTLED' | 'PARTIALLY_SETTLED' | 'SETTLED';
  taxInclusiveAmount: number | string;
  openAmount: number | string;
};

type SupplierDetailsData = Supplier & {
  legalName?: string | null;
  siretNumber?: string | null;
  vatNumber?: string | null;
  contactName?: string | null;
  street1?: string | null;
  street2?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  invoices?: SupplierInvoiceSummary[];
};

const statusLabels: Record<SupplierInvoiceSummary['settlementStatus'], string> = {
  UNSETTLED: 'À régler',
  PARTIALLY_SETTLED: 'Partiellement réglée',
  SETTLED: 'Réglée',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function formatAmount(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function isOverdue(invoice: SupplierInvoiceSummary) {
  return Boolean(invoice.dueDate && invoice.settlementStatus !== 'SETTLED' && new Date(invoice.dueDate).getTime() < Date.now());
}

export default function SupplierDetails({ supplier, onClose, onAddInvoice }: { supplier: Supplier | null; onClose: () => void; onAddInvoice: (supplier: Supplier) => void }) {
  const api = useApiClient();
  const [details, setDetails] = useState<SupplierDetailsData | null>(null);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!supplier) return;
    let active = true;
    api.get(`/suppliers/${supplier.id}`).then(async (response) => {
      if (!response.ok) throw new Error();
      if (active) {
        setDetails(await response.json());
        setError('');
      }
    }).catch(() => {
      if (active) setError('Impossible de charger le détail du fournisseur.');
    });
    return () => { active = false; };
  }, [api, retryKey, supplier]);

  const currentDetails = details?.id === supplier?.id ? details : null;
  const current: SupplierDetailsData | null = currentDetails ?? supplier;
  const invoices = useMemo(() => currentDetails?.invoices ?? [], [currentDetails?.invoices]);
  const financials = useMemo(() => ({
    openAmount: invoices.reduce((total, invoice) => total + Number(invoice.openAmount || 0), 0),
    overdueAmount: invoices.filter(isOverdue).reduce((total, invoice) => total + Number(invoice.openAmount || 0), 0),
    overdueCount: invoices.filter(isOverdue).length,
  }), [invoices]);

  if (!supplier || !current) return null;
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="supplier-details-title" className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-stone-200 p-6"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Fournisseur</p><h2 id="supplier-details-title" className="mt-1 text-2xl font-bold text-stone-900">{current.name}</h2><p className="text-sm text-stone-500">{current.legalName || 'Raison sociale non renseignée'} · {current.reference || 'Sans référence'}</p></div><button type="button" onClick={onClose} aria-label="Fermer le détail fournisseur" className="text-2xl leading-none text-stone-400 hover:text-stone-700">×</button></div>
      <div className="flex flex-wrap gap-2 border-b border-stone-100 px-6 py-4"><button type="button" onClick={() => onAddInvoice(supplier)} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Ajouter une facture</button><button type="button" onClick={onClose} className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Fermer</button></div>
      {error && <div className="mx-6 mt-5 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-3"><p className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="text-sm font-semibold text-red-700 underline">Réessayer</button></div>}
      <div className="grid gap-3 p-6 sm:grid-cols-3"><div className="rounded-lg bg-stone-50 p-3"><p className="text-xs font-semibold uppercase text-stone-500">Factures récentes</p><p className="mt-1 text-xl font-bold text-stone-900">{currentDetails ? invoices.length : '—'}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs font-semibold uppercase text-amber-700">Solde ouvert</p><p className="mt-1 text-xl font-bold text-amber-900">{currentDetails ? formatAmount(financials.openAmount) : '—'}</p></div><div className="rounded-lg bg-red-50 p-3"><p className="text-xs font-semibold uppercase text-red-700">En retard</p><p className="mt-1 text-xl font-bold text-red-900">{currentDetails ? `${formatAmount(financials.overdueAmount)} · ${financials.overdueCount}` : '—'}</p></div></div>
      <div className="grid gap-4 border-t border-stone-200 px-6 py-5 sm:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase text-stone-500">Contact</h3><p className="mt-1 text-sm text-stone-700">{current.contactName || 'Contact non renseigné'}</p><p className="text-sm text-stone-700">{current.email || 'Aucun email'}</p><p className="text-sm text-stone-700">{current.phone || 'Aucun téléphone'}</p></div><div><h3 className="text-xs font-semibold uppercase text-stone-500">Identification</h3><p className="mt-1 text-sm text-stone-700">SIRET : {current.siretNumber || 'Non renseigné'}</p><p className="text-sm text-stone-700">TVA : {current.vatNumber || 'Non renseignée'}</p></div><div className="sm:col-span-2"><h3 className="text-xs font-semibold uppercase text-stone-500">Adresse</h3><p className="mt-1 text-sm text-stone-700">{[current.street1, current.street2].filter(Boolean).join(' ') || 'Rue non renseignée'}</p><p className="text-sm text-stone-700">{[current.postalCode, current.city, current.countryCode].filter(Boolean).join(' ') || 'Adresse incomplète'}</p></div></div>
      <div className="border-t border-stone-200 p-6"><div className="flex items-center justify-between"><h3 className="font-semibold text-stone-800">Factures récentes</h3>{!currentDetails && <span className="text-sm text-stone-500">Chargement…</span>}</div>{currentDetails && !invoices.length && <p className="mt-3 rounded-md bg-stone-50 p-4 text-sm text-stone-600">Aucune facture pour ce fournisseur.</p>}{currentDetails && invoices.length > 0 && <ul className="mt-3 divide-y divide-stone-100">{invoices.map((invoice) => <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-semibold text-stone-900">{invoice.supplierInvoiceNumber}</p><p className="text-xs text-stone-500">{formatDate(invoice.issueDate)} · {invoice.dueDate ? `Échéance ${formatDate(invoice.dueDate)}` : 'Sans échéance'}</p></div><div className="text-right"><p className={isOverdue(invoice) ? 'font-semibold text-red-700' : 'font-semibold text-stone-900'}>{formatAmount(invoice.openAmount)} ouvert</p><p className={isOverdue(invoice) ? 'text-xs font-semibold text-red-600' : 'text-xs text-stone-500'}>{isOverdue(invoice) ? 'En retard' : statusLabels[invoice.settlementStatus]}</p></div></li>)}</ul>}</div>
    </section>
  </div>;
}
