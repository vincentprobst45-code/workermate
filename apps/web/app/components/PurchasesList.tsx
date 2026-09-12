'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

type Purchase = {
  id: string;
  purchaseDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  supplierName?: string | null;
  taxExclusiveAmount?: number | string | null;
  vatAmount?: number | string | null;
  taxInclusiveAmount: number | string;
  effectiveCostAmount: number | string;
  supplier?: { name: string } | null;
  items: Array<{ id: string; title: string; quantity: number | string; catalogItem?: { title: string } | null }>;
};

const statusLabels: Record<Purchase['status'], string> = { DRAFT: 'Brouillon', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé' };

function formatDate(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)); }
function formatAmount(value: number | string | null | undefined) { return `${Number(value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`; }

export default function PurchasesList({ refreshKey = 0 }: { refreshKey?: number }) {
  const api = useApiClient();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/purchases').then(async (response) => {
      if (!response.ok) throw new Error();
      const data: Purchase[] = await response.json();
      if (!cancelled) { setPurchases(data); setError(''); }
    }).catch(() => {
      if (!cancelled) setError('Impossible de charger les achats.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [api, refreshKey]);

  return <section className="mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4"><div><h2 className="font-semibold text-stone-900">Achats enregistrés</h2><p className="text-sm text-stone-500">{purchases.length} achat{purchases.length === 1 ? '' : 's'}</p></div></div>
    {loading && <p className="p-5 text-sm text-stone-500">Chargement des achats...</p>}
    {error && <p className="p-5 text-sm text-red-600">{error}</p>}
    {!loading && !error && !purchases.length && <p className="p-5 text-sm text-stone-500">Aucun achat enregistré.</p>}
    {!loading && !error && purchases.length > 0 && <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">Achat</th><th className="px-5 py-3">Fournisseur</th><th className="px-5 py-3">Lignes</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3 text-right">TTC</th><th className="px-5 py-3 text-right">Coût effectif</th></tr></thead><tbody className="divide-y divide-stone-100">{purchases.map((purchase) => <tr key={purchase.id} className="hover:bg-stone-50"><td className="px-5 py-3"><p className="font-semibold text-stone-900">{formatDate(purchase.purchaseDate)}</p><p className="text-xs text-stone-500">{purchase.id.slice(-8)}</p></td><td className="px-5 py-3 text-stone-700">{purchase.supplier?.name || purchase.supplierName || 'Sans fournisseur'}</td><td className="max-w-xs px-5 py-3 text-stone-600">{purchase.items.length ? purchase.items.map((item) => `${item.title} × ${Number(item.quantity).toLocaleString('fr-FR')}`).join(', ') : 'Aucune ligne'}</td><td className="px-5 py-3 text-stone-700">{statusLabels[purchase.status]}</td><td className="px-5 py-3 text-right font-semibold text-stone-900">{formatAmount(purchase.taxInclusiveAmount)}</td><td className="px-5 py-3 text-right text-stone-600">{formatAmount(purchase.effectiveCostAmount)}</td></tr>)}</tbody></table></div>}
  </section>;
}
