'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../../api-client';
import type { WorkLog } from './AddWorklogForm';
import AddWorkLogItemForm, { type WorkLogItem } from './AddWorkLogItemForm';

type WorkLogWithItems = WorkLog & {
  items: WorkLogItem[];
};

type WorkLogsListProps = {
  workOrderId: string;
  refreshKey: number;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

function formatMinutes(value?: number): string {
  if (value === undefined || value === null) return '-';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours} h ${minutes.toString().padStart(2, '0')}` : `${minutes} min`;
}

function formatMoney(value: number): string {
  return Number(value || 0).toFixed(2);
}

export default function WorkLogsList({ workOrderId, refreshKey }: WorkLogsListProps) {
  const api = useApiClient();
  const [workLogs, setWorkLogs] = useState<WorkLogWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workLogForNewItem, setWorkLogForNewItem] = useState<WorkLog | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkLogs() {
      setLoading(true);
      try {
        const response = await api.get(`/worklogs?workOrderId=${encodeURIComponent(workOrderId)}`);
        if (!response.ok) throw new Error('Erreur');
        const data: WorkLogWithItems[] = await response.json();
        if (!cancelled) { setWorkLogs(data); setError(''); }
      } catch {
        if (!cancelled) { setWorkLogs([]); setError('Erreur lors de la récupération des fiches de suivi.'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadWorkLogs();
    return () => { cancelled = true; };
  }, [api, refreshKey, workOrderId]);

  if (loading) return <p className="text-sm text-zinc-600">Chargement des fiches de suivi...</p>;
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!workLogs.length) return <p className="text-sm text-zinc-600">Aucune fiche de suivi.</p>;

  return <>
    <div className="space-y-3">
      {workLogs.map((workLog) => (
        <article key={workLog.id} className="border-l-2 border-zinc-300 pl-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-zinc-900">{workLog.title || 'Fiche de suivi'}</p>
              <p className="text-xs text-zinc-500">{formatDate(workLog.date)} | Prévu: {formatMinutes(workLog.timePlannedMinutes)} | Passé: {formatMinutes(workLog.timeSpentMinutes)}</p>
            </div>
            <button type="button" className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100" onClick={() => setWorkLogForNewItem(workLog)}>Ajouter une étape</button>
          </div>
          {workLog.description && <p className="mt-1 whitespace-pre-wrap text-zinc-600">{workLog.description}</p>}
          {workLog.items.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="border border-zinc-200 px-2 py-1">Titre</th><th className="border border-zinc-200 px-2 py-1">Description</th><th className="border border-zinc-200 px-2 py-1">Quantité</th><th className="border border-zinc-200 px-2 py-1">Unité</th><th className="border border-zinc-200 px-2 py-1">Coût unitaire</th><th className="border border-zinc-200 px-2 py-1">TVA achat</th><th className="border border-zinc-200 px-2 py-1">Coût total</th></tr></thead>
                <tbody>{workLog.items.map((item) => <tr key={item.id} className="bg-white"><td className="border border-zinc-200 px-2 py-1 font-medium text-zinc-900">{item.title}</td><td className="border border-zinc-200 px-2 py-1 text-zinc-600">{item.description || '-'}</td><td className="border border-zinc-200 px-2 py-1">{item.quantity}</td><td className="border border-zinc-200 px-2 py-1">{item.unitLabel || item.unitCode || item.unit || '-'}</td><td className="border border-zinc-200 px-2 py-1">{formatMoney(item.unitCost)}</td><td className="border border-zinc-200 px-2 py-1">{item.purchaseVatRate === undefined || item.purchaseVatRate === null ? '-' : `${formatMoney(item.purchaseVatRate)} %`}</td><td className="border border-zinc-200 px-2 py-1">{formatMoney(item.totalCost)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </article>
      ))}
    </div>
    {workLogForNewItem && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setWorkLogForNewItem(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between gap-3"><h4 className="text-lg font-semibold text-zinc-900">Ajouter une étape</h4><button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => setWorkLogForNewItem(null)}>Fermer</button></div><AddWorkLogItemForm workLogId={workLogForNewItem.id} workOrderId={workOrderId} onCreated={(item) => { setWorkLogs((current) => current.map((workLog) => workLog.id === workLogForNewItem.id ? { ...workLog, items: [...workLog.items, item] } : workLog)); setWorkLogForNewItem(null); }} /></div></div>}
  </>;
}