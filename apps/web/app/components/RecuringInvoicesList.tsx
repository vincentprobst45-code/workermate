'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

type RecurringInvoiceStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

interface RecurringInvoice {
  id: string;
  name: string;
  status: RecurringInvoiceStatus;
  recurrenceUnit: string;
  interval: number;
  nextOccurrenceDate: string;
  currency: string;
  customer?: { firstName?: string | null; lastName?: string | null; company?: string | null } | null;
  paymentAccount?: { name?: string | null } | null;
  items?: Array<{ quantity: number; unitPrice: number }>;
}

interface RecuringInvoicesListProps {
  refreshKey?: number;
}

const STATUS_LABELS: Record<RecurringInvoiceStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'En pause',
  ENDED: 'Terminée',
};

const STATUS_STYLES: Record<RecurringInvoiceStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PAUSED: 'bg-amber-50 text-amber-700',
  ENDED: 'bg-slate-100 text-slate-600',
};

const UNIT_LABELS: Record<string, string> = {
  DAY: 'jour',
  WEEK: 'semaine',
  MONTH: 'mois',
  YEAR: 'an',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

function getCustomerName(customer: RecurringInvoice['customer']) {
  return customer?.company?.trim() || [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || '-';
}

function getSubtotal(invoice: RecurringInvoice) {
  return (invoice.items ?? []).reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
}

export default function RecuringInvoicesList({ refreshKey = 0 }: RecuringInvoicesListProps) {
  const api = useApiClient();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecurringInvoices() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/recurring-invoices');
        if (!response.ok) throw new Error('Erreur');
        const data = await response.json();
        if (!cancelled) setRecurringInvoices(data);
      } catch {
        if (!cancelled) setError('Impossible de charger les factures récurrentes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRecurringInvoices();
    return () => { cancelled = true; };
  }, [api, refreshKey]);

  async function updateStatus(id: string, status: RecurringInvoiceStatus) {
    setUpdatingId(id);
    setError('');
    try {
      const response = await api.post(`/recurring-invoices/${id}/status/${status}`, {});
      if (!response.ok) throw new Error('Erreur');
      const updated = await response.json();
      setRecurringInvoices((current) => current.map((invoice) => invoice.id === id ? { ...invoice, ...updated } : invoice));
    } catch {
      setError('Impossible de modifier le statut de la facture récurrente.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <div className="mt-8 space-y-3" aria-label="Chargement des factures récurrentes" role="status"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /><p className="text-sm text-slate-500">Chargement des factures récurrentes...</p></div>;
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Planification</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Factures récurrentes</h3>
          <p className="mt-1 text-sm text-slate-500">{recurringInvoices.length} récurrence{recurringInvoices.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {recurringInvoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">Aucune facture récurrente configurée.</div>
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nom</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fréquence</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Prochaine échéance</th><th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Montant HT</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody className="divide-y divide-slate-100">{recurringInvoices.map((invoice) => <tr key={invoice.id}><td className="px-4 py-3 font-semibold text-slate-900">{invoice.name}</td><td className="px-4 py-3 text-slate-700">{getCustomerName(invoice.customer)}</td><td className="px-4 py-3 text-slate-600">Tous les {invoice.interval} {UNIT_LABELS[invoice.recurrenceUnit] || invoice.recurrenceUnit.toLowerCase()}{invoice.interval > 1 ? 's' : ''}</td><td className="px-4 py-3 text-slate-600">{formatDate(invoice.nextOccurrenceDate)}</td><td className="px-4 py-3 text-right font-semibold text-slate-900">{formatMoney(getSubtotal(invoice), invoice.currency)}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[invoice.status]}`}>{STATUS_LABELS[invoice.status]}</span></td><td className="px-4 py-3 text-right"><StatusActions invoice={invoice} updatingId={updatingId} onUpdate={updateStatus} /></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-3 sm:hidden">{recurringInvoices.map((invoice) => <article key={invoice.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="truncate font-semibold text-slate-900">{invoice.name}</h4><p className="mt-1 text-sm text-slate-600">{getCustomerName(invoice.customer)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[invoice.status]}`}>{STATUS_LABELS[invoice.status]}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Fréquence</dt><dd className="font-medium text-slate-800">Tous les {invoice.interval} {UNIT_LABELS[invoice.recurrenceUnit] || invoice.recurrenceUnit.toLowerCase()}{invoice.interval > 1 ? 's' : ''}</dd></div><div><dt className="text-slate-500">Prochaine échéance</dt><dd className="font-medium text-slate-800">{formatDate(invoice.nextOccurrenceDate)}</dd></div><div><dt className="text-slate-500">Montant HT</dt><dd className="font-semibold text-slate-900">{formatMoney(getSubtotal(invoice), invoice.currency)}</dd></div><div><dt className="text-slate-500">Compte</dt><dd className="truncate font-medium text-slate-800">{invoice.paymentAccount?.name || 'Compte principal'}</dd></div></dl><div className="mt-4 border-t border-slate-100 pt-3"><StatusActions invoice={invoice} updatingId={updatingId} onUpdate={updateStatus} /></div></article>)}</section>
        </>
      )}
    </section>
  );
}

function StatusActions({ invoice, updatingId, onUpdate }: { invoice: RecurringInvoice; updatingId: string | null; onUpdate: (id: string, status: RecurringInvoiceStatus) => void }) {
  if (invoice.status === 'ENDED') return <span className="text-xs text-slate-400">Aucune action</span>;
  const nextStatus: RecurringInvoiceStatus = invoice.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  return <button type="button" disabled={updatingId === invoice.id} onClick={() => void onUpdate(invoice.id, nextStatus)} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50">{updatingId === invoice.id ? 'Mise à jour...' : nextStatus === 'PAUSED' ? 'Mettre en pause' : 'Réactiver'}</button>;
}