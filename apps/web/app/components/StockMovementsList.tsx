'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';
import { useApiClient } from '../api-client';

type StockMovementReason = 'OPENING_BALANCE' | 'PURCHASE' | 'CONSUMPTION' | 'SUPPLIER_RETURN' | 'RETURN_TO_STOCK' | 'ADJUSTMENT' | 'REVERSAL';

type StockMovement = {
  id: string;
  direction: 'IN' | 'OUT';
  reason: StockMovementReason;
  quantity: number;
  unitCode: string;
  totalCost?: number | null;
  occurredAt: string;
  stockItem: {
    catalogItem: { id: string; title: string; reference?: string | null; unitLabel?: string | null };
  };
};

type DirectionFilter = 'all' | 'IN' | 'OUT';

const REASON_LABELS: Record<StockMovementReason, string> = {
  OPENING_BALANCE: 'Stock initial',
  PURCHASE: 'Achat',
  CONSUMPTION: 'Consommation chantier',
  SUPPLIER_RETURN: 'Retour fournisseur',
  RETURN_TO_STOCK: 'Retour en stock',
  ADJUSTMENT: 'Ajustement manuel',
  REVERSAL: 'Annulation',
};

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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StockMovementsList() {
  const api = useApiClient();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState<DirectionFilter>('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await api.get('/stock/movements');
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!cancelled) setMovements(data);
      } catch {
        if (!cancelled) setError('Impossible de charger l’historique des mouvements.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [api]);

  const filteredMovements = useMemo(
    () => direction === 'all' ? movements : movements.filter((movement) => movement.direction === direction),
    [movements, direction],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-stone-400" />
          <h2 className="text-sm font-bold text-stone-900">Historique des mouvements</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="movement-direction" className="text-stone-500">Filtrer</label>
          <select
            id="movement-direction"
            value={direction}
            onChange={(event) => setDirection(event.target.value as DirectionFilter)}
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
          >
            <option value="all">Tous les mouvements</option>
            <option value="IN">Entrées</option>
            <option value="OUT">Sorties</option>
          </select>
        </div>
      </div>

      <div className="max-h-[28rem] overflow-y-auto overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Mouvement</th>
              <th className="px-4 py-3">Quantité</th>
              <th className="px-4 py-3">Coût</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && Array.from({ length: 4 }, (_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-stone-200" /></td>
                <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-stone-200" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-stone-200" /></td>
                <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-stone-200" /></td>
                <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-stone-200" /></td>
              </tr>
            ))}
            {!loading && filteredMovements.map((movement) => {
              const unit = movement.stockItem.catalogItem.unitLabel || movement.unitCode;
              const isIn = movement.direction === 'IN';
              return (
                <tr key={movement.id} className="transition hover:bg-stone-50">
                  <td className="whitespace-nowrap px-4 py-3 text-stone-600">{formatDate(movement.occurredAt)}</td>
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link href={`/catalogitem?item=${movement.stockItem.catalogItem.id}`} className="hover:text-emerald-700 hover:underline">
                      {movement.stockItem.catalogItem.title}
                    </Link>
                    <div className="text-xs font-normal text-stone-500">{movement.stockItem.catalogItem.reference || unit}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                      {isIn ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                      {REASON_LABELS[movement.reason] ?? movement.reason}
                    </span>
                  </td>
                  <td className={`px-4 py-3 tabular-nums font-semibold ${isIn ? 'text-emerald-700' : 'text-orange-700'}`}>
                    {isIn ? '+' : '-'}{formatQuantity(toNumber(movement.quantity))} {unit}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-stone-600">
                    {movement.totalCost == null ? '—' : formatMoney(toNumber(movement.totalCost))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && !error && !movements.length && (
        <p className="p-6 text-center text-sm text-stone-500">Aucun mouvement de stock enregistré.</p>
      )}
      {!loading && !error && movements.length > 0 && !filteredMovements.length && (
        <p className="p-6 text-center text-sm text-stone-500">Aucun mouvement pour ce filtre.</p>
      )}
      {error && <p className="p-6 text-sm text-red-600">{error}</p>}
    </div>
  );
}
