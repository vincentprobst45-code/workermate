'use client';

import { type FormEvent, useState } from 'react';
import { useApiClient } from '../../api-client';

export type WorkLog = {
  id: string;
  projectId: string;
  workOrderId: string;
  date: string;
  title?: string;
  description?: string;
  timePlannedMinutes?: number;
  timeSpentMinutes?: number;
  createdAt: string;
};

type AddWorklogFormProps = {
  projectId: string;
  workOrderId: string;
  onCreated: (workLog: WorkLog) => void;
  initialWorkLog?: WorkLog;
  onUpdated?: (workLog: WorkLog) => void;
};

function toDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function AddWorklogForm({ projectId, workOrderId, onCreated, initialWorkLog, onUpdated }: AddWorklogFormProps) {
  const api = useApiClient();
  const [date, setDate] = useState(initialWorkLog ? toDatetimeLocal(new Date(initialWorkLog.date)) : toDatetimeLocal(new Date()));
  const [title, setTitle] = useState(initialWorkLog?.title ?? '');
  const [description, setDescription] = useState(initialWorkLog?.description ?? '');
  const [timePlannedMinutes, setTimePlannedMinutes] = useState<number | ''>(initialWorkLog?.timePlannedMinutes ?? '');
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number | ''>(initialWorkLog?.timeSpentMinutes ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = initialWorkLog
        ? await api.put(`/worklogs/${initialWorkLog.id}`, {
          date, title: title.trim() || undefined, description: description.trim() || undefined,
          timePlannedMinutes: timePlannedMinutes === '' ? undefined : timePlannedMinutes,
          timeSpentMinutes: timeSpentMinutes === '' ? undefined : timeSpentMinutes,
        })
        : await api.post('/worklogs', {
        projectId,
        workOrderId,
        date,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        timePlannedMinutes: timePlannedMinutes === '' ? undefined : timePlannedMinutes,
        timeSpentMinutes: timeSpentMinutes === '' ? undefined : timeSpentMinutes,
        });
      if (!response.ok) throw new Error('Erreur');

      const workLog: WorkLog = await response.json();
      if (initialWorkLog) onUpdated?.(workLog); else onCreated(workLog);
      if (initialWorkLog) return;
      setDate(toDatetimeLocal(new Date()));
      setTitle('');
      setDescription('');
      setTimePlannedMinutes('');
      setTimeSpentMinutes('');
    } catch {
      setError('Erreur lors de la création de la fiche de suivi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm"><span>Date</span><input required type="datetime-local" className="rounded border border-zinc-300 px-3 py-2" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Titre</span><input className="rounded border border-zinc-300 px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2"><span>Description</span><textarea className="min-h-24 rounded border border-zinc-300 px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Temps prévu (minutes)</span><input min="0" type="number" className="rounded border border-zinc-300 px-3 py-2" value={timePlannedMinutes} onChange={(event) => setTimePlannedMinutes(event.target.valueAsNumber || '')} /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Temps passé (minutes)</span><input min="0" type="number" className="rounded border border-zinc-300 px-3 py-2" value={timeSpentMinutes} onChange={(event) => setTimeSpentMinutes(event.target.valueAsNumber || '')} /></label>
      </div>
      <button type="submit" disabled={submitting} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Enregistrement...' : initialWorkLog ? 'Enregistrer les modifications' : 'Créer la fiche de suivi'}</button>
    </form>
  );
}