'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth.context';
import { useApiClient } from '../api-client';
import SupplierInvoiceDetails from './SupplierInvoiceDetails';

export type SupplierInvoiceItem = {
  id: string;
  title: string;
  description?: string | null;
  quantity: number | string;
  unitCode?: string | null;
  unitLabel?: string | null;
  unitPrice?: number | string | null;
  taxExclusiveAmount: number | string;
  vatRate?: number | string | null;
  vatAmount?: number | string;
  deductibleVatAmount?: number | string;
  taxInclusiveAmount: number | string;
};

export type SupplierInvoice = {
  id: string;
  supplierInvoiceNumber: string;
  kind?: 'INVOICE' | 'CREDIT_NOTE';
  issueDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  settlementStatus: 'UNSETTLED' | 'PARTIALLY_SETTLED' | 'SETTLED';
  taxExclusiveAmount: number | string;
  vatAmount: number | string;
  taxInclusiveAmount: number | string;
  openAmount: number | string;
  dueDate?: string | null;
  receivedDate?: string | null;
  settledAmount?: number | string;
  deductibleVatAmount?: number | string;
  currency?: string;
  allowanceTotal?: number | string;
  chargeTotal?: number | string;
  notes?: string | null;
  internalNotes?: string | null;
  supplier: { id: string; name: string };
  items: SupplierInvoiceItem[];
  vatBreakdowns?: Array<{ vatCategory: string; vatRate?: number | string | null; taxableAmount: number | string; vatAmount: number | string; deductibleVatAmount: number | string }>;
};

const statusLabels: Record<SupplierInvoice['status'], string> = {
  DRAFT: 'Brouillon',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
};

const settlementLabels: Record<SupplierInvoice['settlementStatus'], string> = {
  UNSETTLED: 'À régler',
  PARTIALLY_SETTLED: 'Partiellement réglée',
  SETTLED: 'Réglée',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function formatAmount(value: number | string) {
  return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function isOverdue(invoice: SupplierInvoice, today: number) {
  return Boolean(invoice.dueDate && invoice.settlementStatus !== 'SETTLED' && new Date(invoice.dueDate).getTime() < today);
}

export default function SupplierInvoicesList({ refreshKey = 0, initialInvoiceId, initialInvoiceMode = 'view', syncUrl = false }: { refreshKey?: number; initialInvoiceId?: string; initialInvoiceMode?: 'view' | 'edit'; syncUrl?: boolean }) {
  const { activeTenant } = useAuth();
  const api = useApiClient();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | SupplierInvoice['settlementStatus']>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [today] = useState(() => Date.now());
  const appliedInitialInvoiceId = useRef<string | null>(null);
  const supplierInvoicesQueryKey = ['supplier-invoices', activeTenant?.tenantId, refreshKey];
  const supplierInvoicesQuery = useQuery({
    queryKey: supplierInvoicesQueryKey,
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const response = await api.get('/supplier-invoices');
      if (!response.ok) throw new Error('Impossible de charger les factures fournisseurs.');
      return await response.json() as SupplierInvoice[];
    },
  });
  const invoices = useMemo(() => supplierInvoicesQuery.data ?? [], [supplierInvoicesQuery.data]);
  const loading = supplierInvoicesQuery.isPending;
  const error = supplierInvoicesQuery.error?.message ?? '';

  const updateInvoiceUrl = useCallback((invoiceId?: string, mode: 'view' | 'edit' = 'view', replace = false) => {
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    if (invoiceId) {
      url.searchParams.set('supplierInvoice', invoiceId);
      if (mode === 'edit') url.searchParams.set('edit', '1');
      else url.searchParams.delete('edit');
    } else {
      url.searchParams.delete('supplierInvoice');
      url.searchParams.delete('edit');
    }
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  }, [syncUrl]);

  useEffect(() => {
    if (!syncUrl) return;
    if (!initialInvoiceId) {
      appliedInitialInvoiceId.current = null;
      return;
    }
    if (appliedInitialInvoiceId.current === initialInvoiceId) return;
    const invoice = invoices.find((item) => item.id === initialInvoiceId);
    if (!invoice) return;
    const timeoutId = window.setTimeout(() => {
      appliedInitialInvoiceId.current = initialInvoiceId;
      setSelectedInvoice(invoice);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [initialInvoiceId, invoices, syncUrl]);

  useEffect(() => {
    if (!syncUrl) return;
    const handleHistoryChange = () => {
      const invoiceId = new URL(window.location.href).searchParams.get('supplierInvoice');
      setSelectedInvoice(invoices.find((item) => item.id === invoiceId) ?? null);
    };
    window.addEventListener('popstate', handleHistoryChange);
    return () => window.removeEventListener('popstate', handleHistoryChange);
  }, [invoices, syncUrl]);

  useEffect(() => {
    if (!syncUrl || !selectedInvoice || appliedInitialInvoiceId.current === selectedInvoice.id) return;
    updateInvoiceUrl(selectedInvoice.id);
    appliedInitialInvoiceId.current = selectedInvoice.id;
  }, [selectedInvoice, syncUrl, updateInvoiceUrl]);

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const normalized = query.trim().toLowerCase();
    const matchesQuery = !normalized || invoice.supplierInvoiceNumber.toLowerCase().includes(normalized) || invoice.supplier.name.toLowerCase().includes(normalized);
    const matchesStatus = statusFilter === 'ALL'
      || (statusFilter === 'OVERDUE' ? isOverdue(invoice, today) : invoice.settlementStatus === statusFilter);
    return matchesQuery && matchesStatus;
  }), [invoices, query, statusFilter, today]);

  const summary = useMemo(() => ({
    total: invoices.reduce((total, invoice) => total + Number(invoice.taxInclusiveAmount || 0), 0),
    open: invoices.reduce((total, invoice) => total + Number(invoice.openAmount || 0), 0),
    overdue: invoices.filter((invoice) => isOverdue(invoice, today)).reduce((total, invoice) => total + Number(invoice.openAmount || 0), 0),
    overdueCount: invoices.filter((invoice) => isOverdue(invoice, today)).length,
  }), [invoices, today]);

  return <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
      <div><h2 className="font-semibold text-stone-900">Factures fournisseurs</h2><p className="text-sm text-stone-500">{filtered.length} document{filtered.length === 1 ? '' : 's'}</p></div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="N° ou fournisseur..." aria-label="Rechercher une facture" className="rounded-md border border-stone-300 px-3 py-2 text-sm" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filtrer les règlements" className="rounded-md border border-stone-300 px-3 py-2 text-sm"><option value="ALL">Tous les règlements</option><option value="OVERDUE">En retard</option><option value="UNSETTLED">À régler</option><option value="PARTIALLY_SETTLED">Partiellement réglées</option><option value="SETTLED">Réglées</option></select></div>
    </div>
    <div className="grid gap-3 border-b border-stone-100 p-5 sm:grid-cols-3"><div><p className="text-xs font-semibold uppercase text-stone-500">Total TTC</p><p className="mt-1 font-bold text-stone-900">{formatAmount(summary.total)}</p></div><div><p className="text-xs font-semibold uppercase text-amber-700">Reste à régler</p><p className="mt-1 font-bold text-amber-900">{formatAmount(summary.open)}</p></div><div><p className="text-xs font-semibold uppercase text-red-700">En retard</p><p className="mt-1 font-bold text-red-900">{formatAmount(summary.overdue)} · {summary.overdueCount}</p></div></div>
    {loading && <div className="p-5 text-sm text-stone-500">Chargement des factures...</div>}
    {loading && invoices.length > 0 && <div className="border-t border-stone-100 px-5 py-2 text-xs text-stone-500">Actualisation en cours…</div>}
    {error && <div className="flex items-center justify-between gap-4 p-5"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={() => { void supplierInvoicesQuery.refetch(); }} className="text-sm font-semibold text-red-700 underline">Réessayer</button></div>}
    {!loading && !error && !filtered.length && <div className="p-5 text-sm text-stone-500"><p>{query || statusFilter !== 'ALL' ? 'Aucune facture ne correspond aux filtres.' : 'Aucune facture fournisseur enregistrée.'}</p>{(query || statusFilter !== 'ALL') && <button type="button" onClick={() => { setQuery(''); setStatusFilter('ALL'); }} className="mt-2 font-semibold text-blue-700 underline">Réinitialiser les filtres</button>}</div>}
    {!error && filtered.length > 0 && <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">Document</th><th className="px-5 py-3">Fournisseur</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3 text-right">TTC</th><th className="px-5 py-3 text-right">Ouvert</th><th className="px-5 py-3 text-right">Échéance</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-stone-100">{filtered.map((invoice) => <tr key={invoice.id} className={isOverdue(invoice, today) ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-stone-50'}><td className="px-5 py-3"><p className="font-semibold text-stone-900">{invoice.supplierInvoiceNumber}</p><p className="text-xs text-stone-500">{formatDate(invoice.issueDate)} · {invoice.items.length} ligne{invoice.items.length === 1 ? '' : 's'}</p></td><td className="px-5 py-3 text-stone-700">{invoice.supplier.name}</td><td className="px-5 py-3"><span className="font-medium text-stone-700">{statusLabels[invoice.status]}</span><p className={isOverdue(invoice, today) ? 'text-xs font-semibold text-red-700' : 'text-xs text-stone-500'}>{isOverdue(invoice, today) ? 'En retard' : settlementLabels[invoice.settlementStatus]}</p></td><td className="px-5 py-3 text-right font-semibold text-stone-900">{formatAmount(invoice.taxInclusiveAmount)}</td><td className="px-5 py-3 text-right text-stone-600">{formatAmount(invoice.openAmount)}</td><td className={isOverdue(invoice, today) ? 'px-5 py-3 text-right font-semibold text-red-700' : 'px-5 py-3 text-right text-stone-600'}>{invoice.dueDate ? formatDate(invoice.dueDate) : 'Non renseignée'}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => setSelectedInvoice(invoice)} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" aria-label={`Ouvrir la facture ${invoice.supplierInvoiceNumber}`}>Ouvrir</button></td></tr>)}</tbody></table></div>}
    {selectedInvoice && <SupplierInvoiceDetails invoice={selectedInvoice} initialEditing={initialInvoiceMode === 'edit'} onEdit={() => updateInvoiceUrl(selectedInvoice.id, 'edit')} onClose={() => { setSelectedInvoice(null); updateInvoiceUrl(undefined, 'view', true); }} onUpdated={() => { setSelectedInvoice(null); void supplierInvoicesQuery.refetch(); updateInvoiceUrl(undefined, 'view', true); }} />}
  </section>;
}
