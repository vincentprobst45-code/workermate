'use client';

import { useEffect, useRef, useState } from 'react';
import { useApiClient } from '../../api-client';
import AddWorkLogItemForm, { type WorkLogItem } from './AddWorkLogItemForm';
import AddWorklogForm, { type WorkLog } from './AddWorklogForm';

type WorkLogWithItems = WorkLog & {
  items: WorkLogItem[];
};

type WorkLogsListProps = {
  workOrderId: string;
  refreshKey: number;
  onCountChange?: (count: number) => void;
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

export default function WorkLogsList({ workOrderId, refreshKey, onCountChange }: WorkLogsListProps) {
  const api = useApiClient();
  const [workLogs, setWorkLogs] = useState<WorkLogWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workLogForNewItem, setWorkLogForNewItem] = useState<WorkLog | null>(null);
  const [workLogForEdit, setWorkLogForEdit] = useState<WorkLog | null>(null);
  const [itemForEdit, setItemForEdit] = useState<{ workLog: WorkLogWithItems; item: WorkLogItem } | null>(null);
  const onCountChangeRef = useRef(onCountChange);

  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  useEffect(() => {
    if (!workLogForNewItem && !workLogForEdit && !itemForEdit) return;
    function handleKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') { setWorkLogForNewItem(null); setWorkLogForEdit(null); setItemForEdit(null); } }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemForEdit, workLogForEdit, workLogForNewItem]);

  async function deleteWorkLog(workLog: WorkLogWithItems) {
    if (!window.confirm('Supprimer cette fiche de suivi ?')) return;
    const response = await api.delete(`/worklogs/${workLog.id}`);
    if (!response.ok) { setError('Impossible de supprimer la fiche de suivi.'); return; }
    setWorkLogs((current) => current.filter((item) => item.id !== workLog.id));
  }

  async function deleteItem(workLog: WorkLogWithItems, item: WorkLogItem) {
    if (!window.confirm('Supprimer cette étape ?')) return;
    const response = await api.delete(`/worklogs/${workLog.id}/items/${item.id}`);
    if (!response.ok) { setError('Impossible de supprimer l’étape.'); return; }
    setWorkLogs((current) => current.map((entry) => entry.id === workLog.id ? { ...entry, items: entry.items.filter((value) => value.id !== item.id) } : entry));
  }

  useEffect(() => {
    let cancelled = false;
    async function loadWorkLogs() {
      setLoading(true);
      try {
        const response = await api.get(`/worklogs?workOrderId=${encodeURIComponent(workOrderId)}`);
        if (!response.ok) throw new Error('Erreur');
        const data: WorkLogWithItems[] = await response.json();
        if (!cancelled) { setWorkLogs(data); onCountChangeRef.current?.(data.length); setError(''); }
      } catch {
        if (!cancelled) { setWorkLogs([]); onCountChangeRef.current?.(0); setError('Erreur lors de la récupération des fiches de suivi.'); }
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
            <div className="flex shrink-0 gap-2">
              <button type="button" className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100" onClick={() => setWorkLogForEdit(workLog)}>Modifier</button>
              <button type="button" className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => void deleteWorkLog(workLog)}>Supprimer</button>
              <button type="button" className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100" onClick={() => setWorkLogForNewItem(workLog)}>Ajouter une étape</button>
            </div>
          </div>
          {workLog.description && <p className="mt-1 whitespace-pre-wrap text-zinc-600">{workLog.description}</p>}
          {workLog.items.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700"><tr><th className="border border-zinc-200 px-2 py-1">Titre</th><th className="border border-zinc-200 px-2 py-1">Description</th><th className="border border-zinc-200 px-2 py-1">Quantité</th><th className="border border-zinc-200 px-2 py-1">Unité</th><th className="border border-zinc-200 px-2 py-1">Coût unitaire</th><th className="border border-zinc-200 px-2 py-1">TVA achat</th><th className="border border-zinc-200 px-2 py-1">Coût total</th><th className="border border-zinc-200 px-2 py-1">Actions</th></tr></thead>
                <tbody>{workLog.items.map((item) => <tr key={item.id} className="bg-white"><td className="border border-zinc-200 px-2 py-1 font-medium text-zinc-900">{item.title}</td><td className="border border-zinc-200 px-2 py-1 text-zinc-600">{item.description || '-'}</td><td className="border border-zinc-200 px-2 py-1">{item.quantity}</td><td className="border border-zinc-200 px-2 py-1">{item.unitLabel || item.unitCode || item.unit || '-'}</td><td className="border border-zinc-200 px-2 py-1">{formatMoney(item.unitCost)}</td><td className="border border-zinc-200 px-2 py-1">{item.purchaseVatRate === undefined || item.purchaseVatRate === null ? '-' : `${formatMoney(item.purchaseVatRate)} %`}</td><td className="border border-zinc-200 px-2 py-1">{formatMoney(item.totalCost)}</td><td className="border border-zinc-200 px-2 py-1"><div className="flex gap-1"><button type="button" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100" onClick={() => setItemForEdit({ workLog, item })}>Modifier</button><button type="button" className="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50" onClick={() => void deleteItem(workLog, item)}>Supprimer</button></div></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </article>
      ))}
    </div>
    {workLogForNewItem && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setWorkLogForNewItem(null)}><div role="dialog" aria-modal="true" aria-labelledby="new-worklog-item-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between gap-3"><h4 id="new-worklog-item-title" className="text-lg font-semibold text-zinc-900">Ajouter une étape</h4><button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => setWorkLogForNewItem(null)}>Fermer</button></div><AddWorkLogItemForm workLogId={workLogForNewItem.id} workOrderId={workOrderId} onCreated={(item) => { setWorkLogs((current) => current.map((workLog) => workLog.id === workLogForNewItem.id ? { ...workLog, items: [...workLog.items, item] } : workLog)); setWorkLogForNewItem(null); }} /></div></div>}
    {workLogForEdit && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setWorkLogForEdit(null)}><div role="dialog" aria-modal="true" aria-labelledby="edit-worklog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h4 id="edit-worklog-title" className="text-lg font-semibold text-zinc-900">Modifier la fiche de suivi</h4><button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => setWorkLogForEdit(null)}>Fermer</button></div><AddWorklogForm projectId="" workOrderId={workOrderId} initialWorkLog={workLogForEdit} onCreated={() => undefined} onUpdated={(updated) => { setWorkLogs((current) => current.map((entry) => entry.id === updated.id ? { ...entry, ...updated } : entry)); setWorkLogForEdit(null); }} /></div></div>}
    {itemForEdit && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => setItemForEdit(null)}><div role="dialog" aria-modal="true" aria-labelledby="edit-worklog-item-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h4 id="edit-worklog-item-title" className="text-lg font-semibold text-zinc-900">Modifier l’étape</h4><button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => setItemForEdit(null)}>Fermer</button></div><AddWorkLogItemForm workLogId={itemForEdit.workLog.id} workOrderId={workOrderId} initialItem={itemForEdit.item} onCreated={() => undefined} onUpdated={(updated) => { setWorkLogs((current) => current.map((entry) => entry.id === itemForEdit.workLog.id ? { ...entry, items: entry.items.map((item) => item.id === updated.id ? updated : item) } : entry)); setItemForEdit(null); }} /></div></div>}
  </>;
}