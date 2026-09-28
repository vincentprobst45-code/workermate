'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import type { PurchaseInitialData } from './AddPurchaseForm';

type PurchaseItem = {
  id: string;
  title: string;
  type: 'MATERIAL' | 'SERVICE' | 'OTHER' | string;
  quantity: number | string;
  unitCode: string;
  unitLabel?: string | null;
  unitPrice?: number | string | null;
  vatRate?: number | string | null;
  taxExclusiveAmount?: number | string | null;
  vatAmount?: number | string | null;
  deductibleVatAmount?: number | string | null;
  taxInclusiveAmount: number | string;
  effectiveCostAmount: number | string;
  catalogItem?: { id: string; title: string; reference?: string | null } | null;
  stockMovements?: Array<{ id: string; direction: string; quantity: number | string; unitCode: string }>;
};

type PurchaseDetailsData = {
  id: string;
  supplierId?: string | null;
  purchaseDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  supplierName?: string | null;
  label?: string | null;
  currency?: string | null;
  taxExclusiveAmount?: number | string | null;
  vatAmount?: number | string | null;
  deductibleVatAmount?: number | string | null;
  taxInclusiveAmount: number | string;
  effectiveCostAmount: number | string;
  paidAt?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  supplier?: { name: string; reference?: string | null } | null;
  items: PurchaseItem[];
};

const statusLabels: Record<PurchaseDetailsData['status'], string> = { DRAFT: 'Brouillon', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé' };

function formatDate(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : 'Non renseignée';
}

function formatAmount(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function PurchaseDetails({ purchaseId, onClose, onRepurchase }: { purchaseId: string | null; onClose: () => void; onRepurchase: (purchase: PurchaseInitialData) => void }) {
  const api = useApiClient();
  const [purchase, setPurchase] = useState<PurchaseDetailsData | null>(null);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!purchaseId) return;
    let active = true;
    api.get(`/purchases/${purchaseId}`).then(async (response) => {
      if (!response.ok) throw new Error();
      const data: PurchaseDetailsData = await response.json();
      if (active) { setPurchase(data); setError(''); }
    }).catch(() => { if (active) setError('Impossible de charger le détail de cet achat.'); });
    return () => { active = false; };
  }, [api, purchaseId, retryKey]);

  if (!purchaseId) return null;
  const totalStockQuantity = purchase?.items.reduce((total, item) => total + (item.stockMovements ?? []).filter((movement) => movement.direction === 'IN').reduce((quantity, movement) => quantity + Number(movement.quantity), 0), 0) ?? 0;
  const paymentLabel = purchase?.paidAt ? `Payé le ${formatDate(purchase.paidAt)}` : purchase?.dueDate ? `Échéance ${formatDate(purchase.dueDate)}` : 'Paiement non renseigné';
  function repurchase() {
    if (!purchase) return;
    onRepurchase({ supplierId: purchase.supplier?.name ? purchase.supplierId : null, supplierName: purchase.supplier?.name ? null : purchase.supplierName, label: purchase.label, purchaseDate: purchase.purchaseDate, dueDate: purchase.dueDate, paidAt: purchase.paidAt, items: purchase.items.map((item) => ({ title: item.title, type: item.type === 'SERVICE' || item.type === 'OTHER' ? item.type : 'MATERIAL', quantity: item.quantity, unitCode: item.unitCode, unitPrice: item.unitPrice, vatRate: item.vatRate, vatAmount: item.vatAmount, deductibleVatAmount: item.deductibleVatAmount, addToStock: Boolean(item.stockMovements?.length), catalogItemId: item.catalogItem?.id || null })) });
  }

  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="purchase-details-title" className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-stone-200 p-6"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Détail achat</p><h2 id="purchase-details-title" className="mt-1 text-2xl font-bold text-stone-900">{purchase?.label || purchase?.supplierName || 'Achat'}</h2><p className="text-sm text-stone-500">{purchase ? `${formatDate(purchase.purchaseDate)} · ${statusLabels[purchase.status]}` : 'Chargement…'}</p></div><button type="button" onClick={onClose} aria-label="Fermer le détail achat" className="text-2xl leading-none text-stone-400 hover:text-stone-700">×</button></div>
      <div className="flex flex-wrap gap-2 border-b border-stone-100 px-6 py-4"><button type="button" onClick={repurchase} disabled={!purchase} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Racheter</button><button type="button" onClick={onClose} className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Fermer</button></div>
      {error && <div className="mx-6 mt-5 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-3"><p className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="text-sm font-semibold text-red-700 underline">Réessayer</button></div>}
      {!purchase && !error && <p className="p-6 text-sm text-stone-500">Chargement du détail…</p>}
      {purchase && <><div className="grid gap-3 p-6 sm:grid-cols-4"><div className="rounded-lg bg-stone-50 p-3"><p className="text-xs font-semibold uppercase text-stone-500">Total TTC</p><p className="mt-1 text-xl font-bold text-stone-900">{formatAmount(purchase.taxInclusiveAmount)}</p></div><div className="rounded-lg bg-stone-50 p-3"><p className="text-xs font-semibold uppercase text-stone-500">Total HT</p><p className="mt-1 text-xl font-bold text-stone-900">{formatAmount(purchase.taxExclusiveAmount)}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs font-semibold uppercase text-amber-700">TVA</p><p className="mt-1 text-xl font-bold text-amber-900">{formatAmount(purchase.vatAmount)}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs font-semibold uppercase text-emerald-700">Coût effectif</p><p className="mt-1 text-xl font-bold text-emerald-900">{formatAmount(purchase.effectiveCostAmount)}</p></div></div>
      <div className="grid gap-4 border-t border-stone-200 px-6 py-5 sm:grid-cols-3"><div><p className="text-xs font-semibold uppercase text-stone-500">Fournisseur</p><p className="mt-1 text-sm font-semibold text-stone-800">{purchase.supplier?.name || purchase.supplierName || 'Sans fournisseur'}</p><p className="text-xs text-stone-500">{purchase.supplier?.reference || 'Référence non renseignée'}</p></div><div><p className="text-xs font-semibold uppercase text-stone-500">Règlement</p><p className="mt-1 text-sm text-stone-700">{paymentLabel}</p></div><div><p className="text-xs font-semibold uppercase text-stone-500">Stock</p><p className="mt-1 text-sm text-stone-700">{totalStockQuantity ? `${totalStockQuantity.toLocaleString('fr-FR')} unité(s) entrées` : 'Aucun mouvement généré'}</p></div></div>
      <div className="border-t border-stone-200 p-6"><h3 className="font-semibold text-stone-800">Lignes d’achat</h3>{!purchase.items.length && <p className="mt-3 rounded-md bg-stone-50 p-4 text-sm text-stone-600">Aucune ligne détaillée.</p>}{purchase.items.length > 0 && <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-3 py-2">Article</th><th className="px-3 py-2 text-right">Quantité</th><th className="px-3 py-2 text-right">HT</th><th className="px-3 py-2 text-right">TVA</th><th className="px-3 py-2 text-right">TTC</th><th className="px-3 py-2">Stock</th></tr></thead><tbody className="divide-y divide-stone-100">{purchase.items.map((item) => <tr key={item.id}><td className="px-3 py-3"><p className="font-semibold text-stone-900">{item.title}</p><p className="text-xs text-stone-500">{item.catalogItem?.reference || item.type}</p></td><td className="px-3 py-3 text-right text-stone-700">{Number(item.quantity).toLocaleString('fr-FR')} {item.unitLabel || item.unitCode}</td><td className="px-3 py-3 text-right text-stone-700">{formatAmount(item.taxExclusiveAmount)}</td><td className="px-3 py-3 text-right text-stone-700">{formatAmount(item.vatAmount)}</td><td className="px-3 py-3 text-right font-semibold text-stone-900">{formatAmount(item.taxInclusiveAmount)}</td><td className="px-3 py-3 text-stone-600">{(item.stockMovements ?? []).length ? 'Entrée créée' : 'Hors stock'}</td></tr>)}</tbody></table></div>}</div>
      {purchase.notes && <div className="border-t border-stone-200 px-6 py-5"><h3 className="text-xs font-semibold uppercase text-stone-500">Notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{purchase.notes}</p></div>}</>}
    </section>
  </div>;
}
