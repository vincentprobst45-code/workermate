'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, PackageSearch, Search } from 'lucide-react';
import { useApiClient } from '../api-client';

type Stock = {
  id: string;
  quantityOnHand: number;
  averageUnitCost?: number | null;
  catalogItem: { id: string; title: string; unitCode: string; unitLabel?: string | null; reference?: string | null; isActive?: boolean };
};

type SortBy = 'nameAsc' | 'nameDesc' | 'quantityAsc' | 'quantityDesc' | 'valueDesc';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);
}

function stockStatus(item: Stock) {
  const quantity = toNumber(item.quantityOnHand);
  // Negative quantity is an allowed-but-abnormal state (consumption recorded before its purchase).
  if (quantity < 0) return { label: 'Anomalie', className: 'bg-red-50 text-red-700' };
  if (quantity === 0) return { label: 'Épuisé', className: 'bg-amber-50 text-amber-700' };
  if (item.catalogItem.isActive === false) return { label: 'Inactif', className: 'bg-stone-100 text-stone-500' };
  return { label: 'En stock', className: 'bg-emerald-50 text-emerald-700' };
}

export default function StocksList() {
  const api = useApiClient();
  const [items, setItems] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('nameAsc');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await api.get('/stock');
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setError('Impossible de charger le stock.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [api]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) =>
        item.catalogItem.title.toLowerCase().includes(normalizedQuery) ||
        (item.catalogItem.reference || '').toLowerCase().includes(normalizedQuery),
      )
    : items;

  const sortedItems = useMemo(() => [...filteredItems].sort((a, b) => {
    if (sortBy === 'nameAsc') return a.catalogItem.title.localeCompare(b.catalogItem.title, 'fr', { sensitivity: 'base' });
    if (sortBy === 'nameDesc') return b.catalogItem.title.localeCompare(a.catalogItem.title, 'fr', { sensitivity: 'base' });
    if (sortBy === 'quantityAsc') return toNumber(a.quantityOnHand) - toNumber(b.quantityOnHand);
    if (sortBy === 'quantityDesc') return toNumber(b.quantityOnHand) - toNumber(a.quantityOnHand);
    const aValue = toNumber(a.quantityOnHand) * toNumber(a.averageUnitCost);
    const bValue = toNumber(b.quantityOnHand) * toNumber(b.averageUnitCost);
    return bValue - aValue;
  }), [filteredItems, sortBy]);

  const totalValue = items.reduce((sum, item) => item.averageUnitCost == null ? sum : sum + toNumber(item.quantityOnHand) * toNumber(item.averageUnitCost), 0);
  const hasAnyCost = items.some((item) => item.averageUnitCost != null);
  const attentionCount = items.filter((item) => toNumber(item.quantityOnHand) <= 0).length;

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Articles suivis</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{items.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Valeur du stock</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{hasAnyCost ? formatMoney(totalValue) : '—'}</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${attentionCount ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${attentionCount ? 'text-amber-600' : 'text-stone-400'}`}>À surveiller</p>
          <p className={`mt-1 text-2xl font-bold ${attentionCount ? 'text-amber-700' : 'text-stone-900'}`}>{attentionCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article, une référence..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="stock-sort" className="text-stone-500">Trier</label>
          <select
            id="stock-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
          >
            <option value="nameAsc">Nom: A - Z</option>
            <option value="nameDesc">Nom: Z - A</option>
            <option value="quantityDesc">Quantité: plus élevée</option>
            <option value="quantityAsc">Quantité: plus faible</option>
            <option value="valueDesc">Valeur: plus élevée</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Coût moyen</th>
                <th className="px-4 py-3">Valeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && Array.from({ length: 4 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-stone-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-stone-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-stone-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-stone-200" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-stone-200" /></td>
                </tr>
              ))}
              {!loading && sortedItems.map((item) => {
                const status = stockStatus(item);
                const unit = item.catalogItem.unitLabel || item.catalogItem.unitCode;
                const value = item.averageUnitCost == null ? null : toNumber(item.quantityOnHand) * toNumber(item.averageUnitCost);
                return (
                  <tr key={item.id} className="transition hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      <Link href={`/catalogitem?item=${item.catalogItem.id}`} className="hover:text-emerald-700 hover:underline">
                        {item.catalogItem.title}
                      </Link>
                      <div className="text-xs font-normal text-stone-500">{item.catalogItem.reference || unit}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                        {status.label === 'Anomalie' && <AlertTriangle className="h-3 w-3" />}
                        {status.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 tabular-nums ${toNumber(item.quantityOnHand) < 0 ? 'font-semibold text-red-600' : ''}`}>
                      {formatQuantity(toNumber(item.quantityOnHand))} {unit}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-600">
                      {item.averageUnitCost == null ? '—' : `${formatMoney(toNumber(item.averageUnitCost))} / ${unit}`}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-stone-900">
                      {value == null ? '—' : formatMoney(value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && !error && !items.length && (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <PackageSearch className="h-8 w-8 text-stone-300" />
            <p className="text-sm font-semibold text-stone-600">Aucun article en stock</p>
            <p className="text-xs text-stone-400">Le stock se remplit automatiquement lors de vos achats de matériel.</p>
          </div>
        )}
        {!loading && !error && items.length > 0 && !sortedItems.length && (
          <p className="p-6 text-center text-sm text-stone-500">Aucun article ne correspond à « {query} ».</p>
        )}
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
