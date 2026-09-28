'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth.context';
import { useApiClient } from '../api-client';

type Purchase = {
  id: string;
  purchaseDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  supplierName?: string | null;
  label?: string | null;
  taxExclusiveAmount?: number | string | null;
  vatAmount?: number | string | null;
  taxInclusiveAmount: number | string;
  effectiveCostAmount: number | string;
  paidAt?: string | null;
  dueDate?: string | null;
  supplier?: { name: string } | null;
  items: Array<{ id: string; title: string; quantity: number | string; addToStock?: boolean }>;
};

const statusLabels: Record<Purchase['status'], string> = { DRAFT: 'Brouillon', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé' };
function formatDate(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)); }
function formatAmount(value: number | string | null | undefined) { return `${Number(value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`; }

export default function PurchasesList({ refreshKey = 0, onSelect }: { refreshKey?: number; onSelect: (purchaseId: string) => void }) {
  const { activeTenant } = useAuth();
  const api = useApiClient();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Purchase['status']>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'STOCK' | 'NO_STOCK'>('ALL');
  const purchasesQuery = useQuery({
    queryKey: ['purchases', activeTenant?.tenantId, refreshKey],
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const response = await api.get('/purchases');
      if (!response.ok) throw new Error('Impossible de charger les achats.');
      return await response.json() as Purchase[];
    },
  });
  const purchases = useMemo(() => purchasesQuery.data ?? [], [purchasesQuery.data]);
  const loading = purchasesQuery.isPending;
  const error = purchasesQuery.error?.message ?? '';

  const filtered = useMemo(() => purchases.filter((purchase) => {
    const normalized = query.trim().toLowerCase();
    const searchable = `${purchase.label || ''} ${purchase.supplier?.name || purchase.supplierName || ''} ${purchase.id}`.toLowerCase();
    const hasStock = purchase.items.some((item) => item.addToStock);
    return (!normalized || searchable.includes(normalized)) && (statusFilter === 'ALL' || purchase.status === statusFilter) && (stockFilter === 'ALL' || (stockFilter === 'STOCK' ? hasStock : !hasStock));
  }), [purchases, query, statusFilter, stockFilter]);

  const summary = useMemo(() => ({
    total: purchases.reduce((sum, purchase) => sum + Number(purchase.taxInclusiveAmount || 0), 0),
    effective: purchases.reduce((sum, purchase) => sum + Number(purchase.effectiveCostAmount || 0), 0),
    stockCount: purchases.filter((purchase) => purchase.items.some((item) => item.addToStock)).length,
    confirmed: purchases.filter((purchase) => purchase.status === 'CONFIRMED').length,
  }), [purchases]);

  return <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"><div className="border-b border-stone-100 px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-stone-900">Historique des achats</h2><p className="text-sm text-stone-500">{filtered.length} résultat{filtered.length === 1 ? '' : 's'}{loading && purchases.length ? ' · Actualisation…' : ''}</p></div><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher fournisseur, libellé…" aria-label="Rechercher un achat" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:w-64" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filtrer par statut" className="rounded-md border border-stone-300 px-3 py-2 text-sm"><option value="ALL">Tous les statuts</option><option value="CONFIRMED">Confirmés</option><option value="DRAFT">Brouillons</option><option value="CANCELLED">Annulés</option></select><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)} aria-label="Filtrer par stock" className="rounded-md border border-stone-300 px-3 py-2 text-sm"><option value="ALL">Tous les achats</option><option value="STOCK">Avec entrée stock</option><option value="NO_STOCK">Sans entrée stock</option></select></div></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><div className="rounded-lg bg-stone-50 p-3"><p className="text-xs font-semibold uppercase text-stone-500">Total TTC</p><p className="mt-1 font-bold text-stone-900">{formatAmount(summary.total)}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs font-semibold uppercase text-emerald-700">Coût effectif</p><p className="mt-1 font-bold text-emerald-900">{formatAmount(summary.effective)}</p></div><div className="rounded-lg bg-blue-50 p-3"><p className="text-xs font-semibold uppercase text-blue-700">Confirmés</p><p className="mt-1 font-bold text-blue-900">{summary.confirmed}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs font-semibold uppercase text-amber-700">Entrées stock</p><p className="mt-1 font-bold text-amber-900">{summary.stockCount}</p></div></div></div>
    {loading && !purchases.length && <div className="space-y-2 p-5"><div className="h-4 animate-pulse rounded bg-stone-100" /><div className="h-4 animate-pulse rounded bg-stone-100" /><div className="h-4 animate-pulse rounded bg-stone-100" /></div>}
    {loading && purchases.length > 0 && <p className="border-b border-stone-100 px-5 py-2 text-xs text-stone-500">Actualisation en cours…</p>}
    {error && <div className="flex items-center justify-between gap-4 p-6"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={() => { void purchasesQuery.refetch(); }} className="text-sm font-semibold text-blue-700 hover:underline">Réessayer</button></div>}
    {!loading && !error && !filtered.length && <div className="p-8 text-center"><p className="font-semibold text-stone-800">{query || statusFilter !== 'ALL' || stockFilter !== 'ALL' ? 'Aucun achat ne correspond aux filtres.' : 'Aucun achat enregistré.'}</p><p className="mt-1 text-sm text-stone-500">{query || statusFilter !== 'ALL' || stockFilter !== 'ALL' ? 'Modifiez les critères pour retrouver un achat.' : 'Votre historique apparaîtra ici après le premier enregistrement.'}</p>{(query || statusFilter !== 'ALL' || stockFilter !== 'ALL') && <button type="button" onClick={() => { setQuery(''); setStatusFilter('ALL'); setStockFilter('ALL'); }} className="mt-3 text-sm font-semibold text-blue-700 underline">Réinitialiser les filtres</button>}</div>}
    {!error && filtered.length > 0 && <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Achat</th><th className="px-4 py-3">Fournisseur</th><th className="px-4 py-3">Lignes</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">TTC</th><th className="px-4 py-3 text-right">Coût effectif</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-stone-100">{filtered.map((purchase) => <tr key={purchase.id} className="hover:bg-stone-50"><td className="px-4 py-3"><p className="font-semibold text-stone-900">{purchase.label || `Achat du ${formatDate(purchase.purchaseDate)}`}</p><p className="text-xs text-stone-500">{formatDate(purchase.purchaseDate)} · {purchase.id.slice(-8)}</p></td><td className="px-4 py-3 text-stone-700">{purchase.supplier?.name || purchase.supplierName || 'Sans fournisseur'}</td><td className="max-w-xs px-4 py-3 text-stone-600">{purchase.items.length ? `${purchase.items.length} ligne${purchase.items.length === 1 ? '' : 's'}${purchase.items.some((item) => item.addToStock) ? ' · stock' : ''}` : 'Aucune ligne'}</td><td className="px-4 py-3"><span className={purchase.status === 'CONFIRMED' ? 'font-semibold text-emerald-700' : purchase.status === 'CANCELLED' ? 'font-semibold text-red-700' : 'font-semibold text-amber-700'}>{statusLabels[purchase.status]}</span><p className="text-xs text-stone-500">{purchase.paidAt ? 'Payé' : purchase.dueDate ? `Échéance ${formatDate(purchase.dueDate)}` : 'Paiement non renseigné'}</p></td><td className="px-4 py-3 text-right font-semibold text-stone-900">{formatAmount(purchase.taxInclusiveAmount)}</td><td className="px-4 py-3 text-right text-stone-600">{formatAmount(purchase.effectiveCostAmount)}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => onSelect(purchase.id)} className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100">Voir le détail</button></td></tr>)}</tbody></table></div>}
  </section>;
}
