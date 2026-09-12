'use client';

export interface ForecastLine {
  sourceKey: string;
  date: string;
  amount: number;
  direction: 'INFLOW' | 'OUTFLOW';
  currency: string;
  label: string;
  sourceType: string;
  sourceId: string;
}

interface ForecastPoint {
  date: string;
  currency: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
  lines: ForecastLine[];
}

interface ForecastBudgetPointDetailsProps {
  point: ForecastPoint | null;
  onClose: () => void;
}

function money(value: number, currency: string) {
  const normalizedCurrency = currency?.trim().toUpperCase() || 'EUR';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: normalizedCurrency }).format(value);
}

export default function ForecastBudgetPointDetails({ point, onClose }: ForecastBudgetPointDetailsProps) {
  if (!point) return null;
  const lines = Array.isArray(point.lines) ? point.lines : [];
  return <aside className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm" aria-label="Détail du point de prévision">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Détail de projection</p><h3 className="mt-1 text-lg font-bold text-slate-900">{new Date(point.date).toLocaleDateString('fr-FR')} · {point.currency || 'EUR'}</h3></div><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600">Fermer</button></div>
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-500">Solde d’ouverture</p><p className="font-semibold">{money(point.openingBalance, point.currency)}</p></div><div><p className="text-slate-500">Solde de clôture</p><p className="font-semibold">{money(point.closingBalance, point.currency)}</p></div><div><p className="text-slate-500">Encaissements</p><p className="font-semibold text-emerald-700">{money(point.inflows, point.currency)}</p></div><div><p className="text-slate-500">Décaissements</p><p className="font-semibold text-red-700">{money(point.outflows, point.currency)}</p></div></div>
    <div className="mt-5 divide-y border-t"><p className="py-3 text-sm font-semibold text-slate-700">Sources ({lines.length})</p>{lines.length === 0 ? <p className="pb-2 text-sm text-slate-500">Aucun flux prévu à cette date.</p> : lines.map((line) => <div key={line.sourceKey} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{line.label}</p><p className="text-xs text-slate-500">{line.sourceType} · {line.sourceId}</p></div><p className={line.direction === 'INFLOW' ? 'whitespace-nowrap text-sm font-semibold text-emerald-700' : 'whitespace-nowrap text-sm font-semibold text-red-700'}>{line.direction === 'INFLOW' ? '+' : '-'}{money(line.amount, line.currency)}</p></div>)}</div>
  </aside>;
}
