'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import AddProjectForm, { type Project } from '../components/AddProjectForm';
import ProjectsList from '../components/ProjectsList';
import { ProtectedRoute } from '../protected-route';

export default function ProjectsPage() {
  const api = useApiClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [projectFormWasOpened, setProjectFormWasOpened] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await api.get('/projects');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data: Project[] = await response.json();
        if (!cancelled) {
          setProjects(data);
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des projets');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [api]);

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) {
      return;
    }

    try {
      const response = await api.delete(`/projects/${id}`);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      setProjects((currentProjects) => currentProjects.filter((project) => project.id !== id));
      setError('');
      setSuccess('Projet supprimé avec succès');
    } catch {
      setError('Erreur lors de la suppression');
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Projets</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Gestion des projets</h2>
            <p className="mt-1 text-sm text-slate-500">
              {projects.length} projet{projects.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            onClick={() => {
              setShowAddProjectForm(!showAddProjectForm);
              setProjectFormWasOpened(true);
            }}
          >
            {showAddProjectForm ? 'Fermer le formulaire' : 'Nouveau projet'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {projectFormWasOpened && !showAddProjectForm && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-800">
            <span>Un brouillon de projet est en attente — vos informations sont conservées.</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                onClick={() => setShowAddProjectForm(true)}
              >
                Reprendre
              </button>
              <button
                type="button"
                className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-50"
                onClick={() => {
                  setShowAddProjectForm(false);
                  setProjectFormWasOpened(false);
                }}
              >
                Recommencer
              </button>
            </div>
          </div>
        )}

        {projectFormWasOpened && (
          <AddProjectForm
            show={showAddProjectForm}
            onCreated={(data) => {
              setProjects((currentProjects) => [data, ...currentProjects]);
              setError('');
              setSuccess('Projet ajouté avec succès');
            }}
          />
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Chargement des projets...</p>
        ) : (
          <ProjectsList projects={projects} onDelete={handleDelete} />
        )}
      </main>
    </ProtectedRoute>
  );
}
