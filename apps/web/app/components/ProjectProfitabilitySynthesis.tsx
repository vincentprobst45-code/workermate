'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import ProjectProfitabilitySynthesisCollapse, { formatProfitabilityCurrency } from './ProjectProfitabilitySynthesisCollapse';
import type { ProjectProfitability, ProfitabilitySource } from './project-profitability.types';

const statusLabels: Record<string, string> = { OPEN: 'Ouvert', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé' };

function numberOf(source: ProfitabilitySource, key: string): number { return Number(source[key] ?? 0); }
function textOf(source: ProfitabilitySource, key: string, fallback = '-'): string { return String(source[key] ?? fallback); }

function Sources({ sources, amountKey = 'auto', empty = 'Aucune donnée source.' }: { sources: ProfitabilitySource[]; amountKey?: string; empty?: string }) {
  if (!sources.length) return <p>{empty}</p>;
  return <ul className="space-y-1">{sources.map((source, index) => { const resolvedAmountKey = amountKey === 'auto' ? ('totalCost' in source ? 'totalCost' : 'taxExclusiveAmount') : amountKey; return <li key={String(source.id ?? index)} className="flex justify-between gap-3"><span>{textOf(source, 'title', textOf(source, 'label', textOf(source, 'number', 'Élément')))}</span><strong>{formatProfitabilityCurrency(numberOf(source, resolvedAmountKey))}</strong></li>; })}</ul>;
}

type ProjectProfitabilitySynthesisProps = { projectId: string };

export default function ProjectProfitabilitySynthesis({ projectId }: ProjectProfitabilitySynthesisProps) {
  const api = useApiClient();
  const [data, setData] = useState<ProjectProfitability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await api.get(`/projects/${projectId}/profitability`);
        if (!response.ok) throw new Error('Erreur');
        const result = await response.json() as ProjectProfitability;
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError('Impossible de charger la rentabilité du projet.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [api, projectId]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Chargement de la rentabilité...</div>;
  if (error || !data) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Données indisponibles.'}</div>;

  const { project, summary, details } = data;
  const costRows = [
    ['Main-d’œuvre consommée', summary.laborConsumed, details.workLogItems.filter((item) => item.type === 'LABOR')],
    ['Matériel consommé', summary.materialConsumed, details.workLogItems.filter((item) => item.type === 'MATERIAL')],
    ['Autres dépenses imputées', summary.otherConsumed, [...details.workLogItems.filter((item) => ['TRAVEL', 'SERVICE', 'OTHER'].includes(String(item.type))), ...details.companyExpenses]],
  ] as const;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div><h3 className="font-bold text-slate-900">{project.title}</h3><p className="text-xs text-slate-500">{project.customerName ? `Client : ${project.customerName}` : 'Client non renseigné'} · Statut : {statusLabels[project.status] ?? project.status}</p></div>
          <span className="text-sm font-semibold text-indigo-700">Avancement : {Math.round(summary.progressPercent)} %</span>
        </div>
      </div>
      <div className="grid gap-4 p-3 lg:grid-cols-3">
        <div><p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">CA</p><ProjectProfitabilitySynthesisCollapse label="Devis accepté" value={formatProfitabilityCurrency(summary.acceptedRevenue)}><Sources sources={details.quotes} /></ProjectProfitabilitySynthesisCollapse><ProjectProfitabilitySynthesisCollapse label="Facturé" value={formatProfitabilityCurrency(summary.billedRevenue)}><Sources sources={details.invoices} /></ProjectProfitabilitySynthesisCollapse><ProjectProfitabilitySynthesisCollapse label="Encaissé" value={formatProfitabilityCurrency(summary.collectedRevenue)}><Sources sources={details.invoices.filter((invoice) => invoice.paymentStatus === 'PAID')} /></ProjectProfitabilitySynthesisCollapse></div>
        <div><p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Coûts</p>{costRows.map(([label, value, sources]) => <ProjectProfitabilitySynthesisCollapse key={label} label={label} value={formatProfitabilityCurrency(value)}><Sources sources={sources as ProfitabilitySource[]} /></ProjectProfitabilitySynthesisCollapse>)}<ProjectProfitabilitySynthesisCollapse label="Total des coûts consommés" value={formatProfitabilityCurrency(summary.totalConsumed)}><p>Main-d’œuvre + matériel + autres dépenses imputées.</p></ProjectProfitabilitySynthesisCollapse><ProjectProfitabilitySynthesisCollapse label="Achats affectés non consommés" value={formatProfitabilityCurrency(summary.assignedPurchasesNotConsumed)}><Sources sources={details.purchaseItems} amountKey="effectiveCostAmount" /></ProjectProfitabilitySynthesisCollapse><ProjectProfitabilitySynthesisCollapse label="Coût total prévisionnel restant" value={formatProfitabilityCurrency(summary.forecastRemaining)}><div><p>Coûts prévus des lignes de chantier : {formatProfitabilityCurrency(details.plannedItems.reduce((sum, item) => sum + (numberOf(item, 'quantity') / (numberOf(item, 'baseQuantity') || 1)) * numberOf(item, 'unitCost'), 0))}</p><p className="mt-1">Moins les coûts consommés enregistrés.</p></div></ProjectProfitabilitySynthesisCollapse></div>
        <div><p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Rentabilité</p><ProjectProfitabilitySynthesisCollapse label="Marge réalisée" value={formatProfitabilityCurrency(summary.realizedMargin)} tone={summary.realizedMargin >= 0 ? 'positive' : 'negative'}><p>CA facturé - total des coûts consommés.</p></ProjectProfitabilitySynthesisCollapse><ProjectProfitabilitySynthesisCollapse label="Taux de marge réalisée" value={summary.realizedMarginRate === null ? '-' : `${summary.realizedMarginRate.toFixed(1)} %`} tone={summary.realizedMarginRate === null || summary.realizedMarginRate >= 0 ? 'positive' : 'negative'}><p>Marge réalisée / CA facturé.</p></ProjectProfitabilitySynthesisCollapse><ProjectProfitabilitySynthesisCollapse label="Marge prévisionnelle" value={formatProfitabilityCurrency(summary.forecastMargin)} tone={summary.forecastMargin >= 0 ? 'positive' : 'negative'}><p>CA accepté - coûts consommés - coût prévisionnel restant.</p></ProjectProfitabilitySynthesisCollapse></div>
      </div>
    </section>
  );
}
