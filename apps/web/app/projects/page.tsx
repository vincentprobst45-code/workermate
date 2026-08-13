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
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold">Gestion des Projets</h2>

        {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

        <button
          className="mx-4 my-2 rounded-sm border-2 border-double border-gray-700 bg-blue-400 px-3 py-2 text-xl text-white shadow-md hover:bg-blue-600 active:bg-blue-900"
          onClick={() => {
            setShowAddProjectForm(!showAddProjectForm);
            setProjectFormWasOpened(true);
          }}
        >
          {showAddProjectForm ? 'Fermer' : projectFormWasOpened ? 'Ouvrir' : 'Ajouter un projet'}
        </button>

        {projectFormWasOpened && (
          <button
            className="float-right mx-4 my-2 rounded-sm border-2 border-double border-gray-700 bg-red-400 px-3 py-2 text-xl text-white shadow-md hover:bg-red-600 active:bg-red-900"
            onClick={() => {
              setShowAddProjectForm(false);
              setProjectFormWasOpened(false);
            }}
          >
            Effacer le formulaire
          </button>
        )}

        {projectFormWasOpened && (
          <div>
            {!showAddProjectForm && (
              <button
                onClick={() => {
                  setShowAddProjectForm(true);
                }}
                className="pointer border-2 p-2 text-center"
              >
                Formulaire en pause...
              </button>
            )}
            <AddProjectForm
              show={showAddProjectForm}
              onCreated={(data) => {
                setProjects((currentProjects) => [data, ...currentProjects]);
                setError('');
                setSuccess('Projet ajouté avec succès');
              }}
            />
          </div>
        )}

        {loading ? <p>Chargement...</p> : <ProjectsList projects={projects} onDelete={handleDelete} />}
      </main>
    </ProtectedRoute>
  );
}
