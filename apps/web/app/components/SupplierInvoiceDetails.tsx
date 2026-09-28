'use client';

import { useEffect, useState } from 'react';
import AddSupplierInvoiceForm from './AddSupplierInvoiceForm';
import type { Supplier } from './AddSupplierForm';
import type { SupplierInvoice } from './SupplierInvoicesList';

type SupplierInvoiceDetailsProps = {
  invoice: SupplierInvoice;
  onClose: () => void;
  onUpdated?: () => void;
  initialEditing?: boolean;
  onEdit?: () => void;
};

function formatDate(value?: string | null) {
  if (!value) return 'Non renseignée';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

function formatAmount(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function formatQuantity(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 });
}

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

export default function SupplierInvoiceDetails({ invoice, onClose, onUpdated, initialEditing = false, onEdit }: SupplierInvoiceDetailsProps) {
  const [editing, setEditing] = useState(initialEditing);
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const supplier: Supplier = { id: invoice.supplier.id, name: invoice.supplier.name };

  return (
    <>
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-invoice-details-title"
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Facture fournisseur</p>
            <h2 id="supplier-invoice-details-title" className="mt-1 text-2xl font-bold text-stone-900">{invoice.supplierInvoiceNumber}</h2>
            <p className="mt-1 text-sm text-stone-500">{invoice.supplier.name}</p>
          </div>
          <div className="flex items-start gap-3"><button type="button" onClick={() => { setEditing(true); onEdit?.(); }} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Modifier</button><button type="button" onClick={onClose} aria-label="Fermer le détail de la facture fournisseur" className="text-2xl leading-none text-stone-400 hover:text-stone-700">×</button></div>
        </header>

        <div className="grid gap-3 border-b border-stone-200 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs font-semibold uppercase text-stone-500">Statut</p><p className="mt-1 font-semibold text-stone-900">{statusLabels[invoice.status]}</p></div>
          <div><p className="text-xs font-semibold uppercase text-stone-500">Règlement</p><p className="mt-1 font-semibold text-stone-900">{settlementLabels[invoice.settlementStatus]}</p></div>
          <div><p className="text-xs font-semibold uppercase text-stone-500">Date d&apos;émission</p><p className="mt-1 font-semibold text-stone-900">{formatDate(invoice.issueDate)}</p></div>
          <div><p className="text-xs font-semibold uppercase text-stone-500">Échéance</p><p className="mt-1 font-semibold text-stone-900">{formatDate(invoice.dueDate)}</p></div>
        </div>

        <div className="grid gap-3 border-b border-stone-200 p-6 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-50 p-4"><p className="text-xs font-semibold uppercase text-stone-500">Total HT</p><p className="mt-1 text-xl font-bold text-stone-900">{formatAmount(invoice.taxExclusiveAmount)}</p></div>
          <div className="rounded-lg bg-stone-50 p-4"><p className="text-xs font-semibold uppercase text-stone-500">TVA</p><p className="mt-1 text-xl font-bold text-stone-900">{formatAmount(invoice.vatAmount)}</p></div>
          <div className="rounded-lg bg-blue-50 p-4"><p className="text-xs font-semibold uppercase text-blue-700">Total TTC</p><p className="mt-1 text-xl font-bold text-blue-900">{formatAmount(invoice.taxInclusiveAmount)}</p></div>
        </div>

        <div className="p-6">
          <h3 className="font-semibold text-stone-900">Lignes de facture</h3>
          {invoice.items.length ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-stone-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Désignation</th><th className="px-4 py-3">Quantité</th><th className="px-4 py-3 text-right">Prix unitaire HT</th><th className="px-4 py-3 text-right">Total HT</th><th className="px-4 py-3 text-right">Total TTC</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {invoice.items.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-medium text-stone-900">{item.title}</p>{item.description && <p className="mt-1 text-xs text-stone-500">{item.description}</p>}</td><td className="px-4 py-3 text-stone-600">{formatQuantity(item.quantity)}{item.unitLabel ? ` ${item.unitLabel}` : ''}</td><td className="px-4 py-3 text-right text-stone-600">{formatAmount(item.unitPrice)}</td><td className="px-4 py-3 text-right font-medium text-stone-900">{formatAmount(item.taxExclusiveAmount)}</td><td className="px-4 py-3 text-right font-medium text-stone-900">{formatAmount(item.taxInclusiveAmount)}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-3 rounded-lg bg-stone-50 p-4 text-sm text-stone-600">Aucune ligne détaillée n&apos;est enregistrée.</p>}
        </div>

        <footer className="flex justify-end border-t border-stone-200 p-6"><button type="button" onClick={onClose} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Fermer</button></footer>
      </section>
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => setEditing(false)}><section role="dialog" aria-modal="true" aria-labelledby="edit-supplier-invoice-title" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-stone-200 p-5"><h2 id="edit-supplier-invoice-title" className="text-xl font-bold text-stone-900">Modifier la facture fournisseur</h2><button type="button" onClick={() => setEditing(false)} className="text-2xl leading-none text-stone-400 hover:text-stone-700" aria-label="Fermer la modification">×</button></div><div className="p-5"><AddSupplierInvoiceForm supplier={supplier} initialInvoice={invoice} onCreated={() => undefined} onUpdated={() => { setEditing(false); onUpdated?.(); }} /></div></section></div>}
    </>
  );
}
