'use client';

import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { ProjectProfitability } from './project-profitability.types';
import { formatProfitabilityCurrency } from './ProjectProfitabilitySynthesisCollapse';

export default function ProjectsProfitabilityOverview({ projects }: { projects: ProjectProfitability[] }) {
  const totals = projects.reduce((acc, project) => ({
    accepted: acc.accepted + project.summary.acceptedRevenue,
    billed: acc.billed + project.summary.billedRevenue,
    consumed: acc.consumed + project.summary.totalConsumed,
    margin: acc.margin + project.summary.realizedMargin,
  }), { accepted: 0, billed: 0, consumed: 0, margin: 0 });

  const cards = [
    { label: 'CA accepté', value: totals.accepted, icon: Wallet, className: 'text-indigo-700 bg-indigo-50' },
    { label: 'CA facturé', value: totals.billed, icon: TrendingUp, className: 'text-sky-700 bg-sky-50' },
    { label: 'Coûts consommés', value: totals.consumed, icon: TrendingDown, className: 'text-amber-700 bg-amber-50' },
    { label: 'Marge réalisée', value: totals.margin, icon: TrendingUp, className: totals.margin >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50' },
  ];

  return <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Vue d’ensemble de la rentabilité"><h2 className="sr-only">Vue d’ensemble de la rentabilité</h2>{cards.map(({ label, value, icon: Icon, className }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span><span className={`rounded-lg p-2 ${className}`}><Icon className="h-4 w-4" aria-hidden="true" /></span></div><p className="mt-3 text-xl font-bold text-slate-900">{formatProfitabilityCurrency(value)}</p></div>)}</section>;
}
