'use client';

import { ProjectStatus } from '@prisma/client';
import { type FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';
import type { Project } from './AddProjectForm';

type EasyAddProjectFormProps = {
  show: boolean;
  onCreated: (project: Project) => void;
};

type EasyProjectFormData = {
  title: string;
  description: string;
  notes: string;
};

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

function createEmptyForm(): EasyProjectFormData {
  return { title: '', description: '', notes: '' };
}

export default function EasyAddProjectForm({ show, onCreated }: EasyAddProjectFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState<EasyProjectFormData>(createEmptyForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const title = form.title.trim();
    if (!title) {
      setError('Le titre du projet est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post('/projects', {
        title,
        description: form.description.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: ProjectStatus.OPEN,
      });

      if (!response.ok) throw new Error('Erreur');

      const project: Project = await response.json();
      setForm(createEmptyForm());
      onCreated(project);
    } catch {
      setError('Impossible de créer le projet. Vérifiez votre connexion puis réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mb-8 space-y-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm sm:p-5 ${!show ? 'hidden' : ''}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Nouveau projet</p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">Démarrer un projet</h3>
        <p className="mt-1 text-sm text-slate-600">Les clients, chantiers et devis pourront être ajoutés ensuite.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Titre</span>
          <input
            className={inputClass}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Nom du projet"
            required
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            className={`${inputClass} min-h-24`}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description globale du projet"
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className={`${inputClass} min-h-24`}
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Notes internes"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Création...' : 'Créer le projet'}
        </button>
      </div>
    </form>
  );
}
