'use client';

import Link from 'next/link';
import type { ProjectProfitability } from './project-profitability.types';
import { formatProfitabilityCurrency } from './ProjectProfitabilitySynthesisCollapse';

const statusLabels: Record<string, string> = { OPEN: 'Ouvert', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé' };

export default function ProjectsProfitabilityTable({ projects }: { projects: ProjectProfitability[] }) {
  if (!projects.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">Aucune donnée de rentabilité disponible.</div>;

  return <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-4 py-3"><h2 className="font-bold text-slate-900">Rentabilité par projet</h2><p className="mt-1 text-xs text-slate-500">Les montants sont exprimés en HT. Ouvrez un projet pour le détail des calculs.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Projet</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">CA accepté</th><th className="px-4 py-3 text-right">Coûts consommés</th><th className="px-4 py-3 text-right">Marge réalisée</th><th className="px-4 py-3 text-right">Avancement</th></tr></thead><tbody className="divide-y divide-slate-100">{projects.map(({ project, summary }) => <tr key={project.id} className="hover:bg-slate-50"><td className="px-4 py-3"><Link href={`/projects?project=${project.id}`} className="font-semibold text-indigo-700 hover:underline">{project.reference} · {project.title}</Link></td><td className="px-4 py-3 text-slate-600">{project.customerName ?? '-'}</td><td className="px-4 py-3 text-slate-600">{statusLabels[project.status] ?? project.status}</td><td className="px-4 py-3 text-right font-medium">{formatProfitabilityCurrency(summary.acceptedRevenue)}</td><td className="px-4 py-3 text-right">{formatProfitabilityCurrency(summary.totalConsumed)}</td><td className={`px-4 py-3 text-right font-semibold ${summary.realizedMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatProfitabilityCurrency(summary.realizedMargin)}</td><td className="px-4 py-3 text-right">{Math.round(summary.progressPercent)} %</td></tr>)}</tbody></table></div></section>;
}
