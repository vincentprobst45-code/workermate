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

function durationParts(minutes?: number) {
  const total = Math.max(0, minutes ?? 0);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export default function AddWorklogForm({ projectId, workOrderId, onCreated, initialWorkLog, onUpdated }: AddWorklogFormProps) {
  const api = useApiClient();
  const [date, setDate] = useState(initialWorkLog ? toDatetimeLocal(new Date(initialWorkLog.date)) : toDatetimeLocal(new Date()));
  const [title, setTitle] = useState(initialWorkLog?.title ?? '');
  const [description, setDescription] = useState(initialWorkLog?.description ?? '');
  const initialPlanned = durationParts(initialWorkLog?.timePlannedMinutes);
  const initialSpent = durationParts(initialWorkLog?.timeSpentMinutes);
  const [plannedHours, setPlannedHours] = useState<number | ''>(initialWorkLog?.timePlannedMinutes === undefined ? '' : initialPlanned.hours);
  const [plannedMinutes, setPlannedMinutes] = useState<number | ''>(initialWorkLog?.timePlannedMinutes === undefined ? '' : initialPlanned.minutes);
  const [spentHours, setSpentHours] = useState<number | ''>(initialWorkLog?.timeSpentMinutes === undefined ? '' : initialSpent.hours);
  const [spentMinutes, setSpentMinutes] = useState<number | ''>(initialWorkLog?.timeSpentMinutes === undefined ? '' : initialSpent.minutes);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function durationValue(hours: number | '', minutes: number | '') {
    if (hours === '' && minutes === '') return undefined;
    return Number(hours || 0) * 60 + Number(minutes || 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = initialWorkLog
        ? await api.put(`/worklogs/${initialWorkLog.id}`, {
          date, title: title.trim() || undefined, description: description.trim() || undefined,
           timePlannedMinutes: durationValue(plannedHours, plannedMinutes),
           timeSpentMinutes: durationValue(spentHours, spentMinutes),
        })
        : await api.post('/worklogs', {
        projectId,
        workOrderId,
        date,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        timePlannedMinutes: durationValue(plannedHours, plannedMinutes),
        timeSpentMinutes: durationValue(spentHours, spentMinutes),
        });
      if (!response.ok) throw new Error('Erreur');

      const workLog: WorkLog = await response.json();
      if (initialWorkLog) onUpdated?.(workLog); else onCreated(workLog);
      if (initialWorkLog) return;
      setDate(toDatetimeLocal(new Date()));
      setTitle('');
      setDescription('');
      setPlannedHours('');
      setPlannedMinutes('');
      setSpentHours('');
      setSpentMinutes('');
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
        <fieldset className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"><legend className="px-1 text-sm font-medium text-zinc-700">Durée prévue</legend><div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1 text-sm"><span>Heures</span><input min="0" type="number" className="rounded border border-zinc-300 bg-white px-3 py-2" value={plannedHours} onChange={(event) => setPlannedHours(Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber)} /></label><label className="flex flex-col gap-1 text-sm"><span>Minutes</span><input min="0" max="59" type="number" className="rounded border border-zinc-300 bg-white px-3 py-2" value={plannedMinutes} onChange={(event) => setPlannedMinutes(Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber)} /></label></div></fieldset>
        <fieldset className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"><legend className="px-1 text-sm font-medium text-zinc-700">Durée réalisée</legend><div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1 text-sm"><span>Heures</span><input min="0" type="number" className="rounded border border-zinc-300 bg-white px-3 py-2" value={spentHours} onChange={(event) => setSpentHours(Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber)} /></label><label className="flex flex-col gap-1 text-sm"><span>Minutes</span><input min="0" max="59" type="number" className="rounded border border-zinc-300 bg-white px-3 py-2" value={spentMinutes} onChange={(event) => setSpentMinutes(Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber)} /></label></div></fieldset>
      </div>
      <button type="submit" disabled={submitting} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Enregistrement...' : initialWorkLog ? 'Enregistrer les modifications' : 'Créer la fiche de suivi'}</button>
    </form>
  );
}