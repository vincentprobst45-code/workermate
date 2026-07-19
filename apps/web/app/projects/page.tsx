'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { ProtectedRoute } from '../protected-route';

interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}


export default function ProjectsPage() {
  const api = useApiClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '' });

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const res = await api.get('/projects');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        if (!cancelled) {
          setProjects(data);
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des chantiers');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [api]);

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post('/projects', newProject);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setProjects([data, ...projects]);
      setNewProject({ title: '', description: '' });
    } catch {
      setError('Erreur lors de l\'ajout');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;
    try {
      const res = await api.delete(`/projects/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setProjects(projects.filter((p) => p.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6">Gestion des Chantiers</h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleAddProject} className="mb-8 p-5 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-4">Ajouter un chantier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Titre du chantier"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              required
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
          </div>
          <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
            Ajouter
          </button>
        </form>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{project.title}</p>
                  {project.description && <p className="text-sm text-slate-600">{project.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
