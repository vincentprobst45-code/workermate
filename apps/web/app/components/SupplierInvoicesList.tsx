'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

type SupplierInvoice = {
  id: string;
  supplierInvoiceNumber: string;
  issueDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  settlementStatus: 'UNSETTLED' | 'PARTIALLY_SETTLED' | 'SETTLED';
  taxExclusiveAmount: number | string;
  vatAmount: number | string;
  taxInclusiveAmount: number | string;
  openAmount: number | string;
  supplier: { id: string; name: string };
  items: Array<{ id: string }>;
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

export default function SupplierInvoicesList({ refreshKey = 0 }: { refreshKey?: number }) {
  const api = useApiClient();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/supplier-invoices').then(async (response) => {
      if (!response.ok) throw new Error();
      const data: SupplierInvoice[] = await response.json();
      if (!cancelled) { setInvoices(data); setError(''); }
    }).catch(() => {
      if (!cancelled) setError('Impossible de charger les factures fournisseurs.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [api, refreshKey]);

  return <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
      <div><h2 className="font-semibold text-stone-900">Factures fournisseurs</h2><p className="text-sm text-stone-500">{invoices.length} document{invoices.length === 1 ? '' : 's'}</p></div>
    </div>
    {loading && <p className="p-5 text-sm text-stone-500">Chargement des factures...</p>}
    {error && <p className="p-5 text-sm text-red-600">{error}</p>}
    {!loading && !error && !invoices.length && <p className="p-5 text-sm text-stone-500">Aucune facture fournisseur enregistrée.</p>}
    {!loading && !error && invoices.length > 0 && <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">Document</th><th className="px-5 py-3">Fournisseur</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3 text-right">TTC</th><th className="px-5 py-3 text-right">Ouvert</th></tr></thead><tbody className="divide-y divide-stone-100">{invoices.map((invoice) => <tr key={invoice.id} className="hover:bg-stone-50"><td className="px-5 py-3"><p className="font-semibold text-stone-900">{invoice.supplierInvoiceNumber}</p><p className="text-xs text-stone-500">{formatDate(invoice.issueDate)} · {invoice.items.length} ligne{invoice.items.length === 1 ? '' : 's'}</p></td><td className="px-5 py-3 text-stone-700">{invoice.supplier.name}</td><td className="px-5 py-3"><span className="font-medium text-stone-700">{statusLabels[invoice.status]}</span><p className="text-xs text-stone-500">{settlementLabels[invoice.settlementStatus]}</p></td><td className="px-5 py-3 text-right font-semibold text-stone-900">{formatAmount(invoice.taxInclusiveAmount)}</td><td className="px-5 py-3 text-right text-stone-600">{formatAmount(invoice.openAmount)}</td></tr>)}</tbody></table></div>}
  </section>;
}
