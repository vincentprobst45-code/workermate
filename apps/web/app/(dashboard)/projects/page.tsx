'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../auth.context';
import { useApiClient } from '../../api-client';
import EasyAddProjectForm from '../../components/EasyAddProjectForm';
import { type Project } from '../../components/AddProjectForm';
import ProjectsList from '../../components/ProjectsList';
import ProjectDetailsContainer from '../../components/projects/ProjectDetailsContainer';
import ProjectsProfitabilityOverview from '../../components/ProjectsProfitabilityOverview';
import ProjectsProfitabilityTable from '../../components/ProjectsProfitabilityTable';
import type { ProjectProfitability } from '../../components/project-profitability.types';
import { ProtectedRoute } from '../../protected-route';

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const { activeTenant } = useAuth();
  const api = useApiClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [projectFormWasOpened, setProjectFormWasOpened] = useState(false);
  const queryClient = useQueryClient();
  const projectsQueryKey = ['projects', activeTenant?.tenantId];
  const profitabilityQueryKey = ['projects-profitability', activeTenant?.tenantId];
  const dashboardQueryKey = ['dashboard', activeTenant?.tenantId];
  const projectsQuery = useQuery({
    queryKey: projectsQueryKey,
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const response = await api.get('/projects');
      if (!response.ok) throw new Error('Erreur lors de la rÃ©cupÃ©ration des projets');
      return await response.json() as Project[];
    },
  });
  const profitabilityQuery = useQuery({
    queryKey: profitabilityQueryKey,
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const response = await api.get('/projects/profitability');
      if (!response.ok) throw new Error('Erreur lors de la rÃ©cupÃ©ration de la rentabilitÃ© des projets');
      return await response.json() as ProjectProfitability[];
    },
  });
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const profitabilityProjects = profitabilityQuery.data ?? [];
  const loading = projectsQuery.isPending;
  const profitabilityLoading = profitabilityQuery.isPending;
  const profitabilityError = profitabilityQuery.error?.message ?? '';
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/projects/${id}`);
      if (!response.ok) throw new Error('La suppression du projet a Ã©chouÃ©.');
      return id;
    },
    onSuccess: async (id) => {
      queryClient.setQueryData<Project[]>(projectsQueryKey, (currentProjects) => currentProjects?.filter((project) => project.id !== id));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profitabilityQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
      ]);
      setError('');
      setSuccess('Projet supprimÃ© avec succÃ¨s');
    },
    onError: () => {
      setError('La suppression du projet a Ã©chouÃ©. VÃ©rifiez votre connexion et rÃ©essayez.');
    },
  });

  function updateCreateUrl(open: boolean, replace = false) {
    const url = new URL(window.location.href);
    if (open) url.searchParams.set('create', 'project');
    else url.searchParams.delete('create');
    window.history[replace ? 'replaceState' : 'pushState']({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    function syncCreateFormFromUrl() {
      const shouldOpen = new URLSearchParams(window.location.search).get('create') === 'project';
      if (shouldOpen) {
        setShowAddProjectForm(true);
        setProjectFormWasOpened(true);
      } else if (!window.location.search.includes('project=')) {
        setShowAddProjectForm(false);
        setProjectFormWasOpened(false);
      }
    }

    syncCreateFormFromUrl();
    window.addEventListener('popstate', syncCreateFormFromUrl);
    return () => window.removeEventListener('popstate', syncCreateFormFromUrl);
  }, [searchParams]);

  useEffect(() => {
    function syncSelectedProjectFromUrl() {
      const projectId = new URLSearchParams(window.location.search).get('project');
      setSelectedProject(projectId ? projects.find((project) => project.id === projectId) ?? null : null);
    }

    syncSelectedProjectFromUrl();
    window.addEventListener('popstate', syncSelectedProjectFromUrl);
    return () => window.removeEventListener('popstate', syncSelectedProjectFromUrl);
  }, [projects]);

  function closeSelectedProject() {
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    url.searchParams.delete('tab');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setSelectedProject(null);
  }

  function selectProject(project: Project | null) {
    const url = new URL(window.location.href);
    if (project) {
      url.searchParams.set('project', project.id);
      url.searchParams.delete('create');
    } else {
      url.searchParams.delete('project');
    }
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setSelectedProject(project);
  }

  async function handleDelete(id: string) {
    await deleteProjectMutation.mutateAsync(id);
    if (selectedProject?.id === id) closeSelectedProject();
  }

  const activeSelectedProject = selectedProject
    ? projects.find((project) => project.id === selectedProject.id) ?? selectedProject
    : null;

  if (activeSelectedProject) {
    return (
      <ProtectedRoute>
        <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/dashboard"
                className="font-medium text-slate-600 transition hover:text-indigo-600 hover:underline"
              >
                Accueil
              </Link>
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <button
                type="button"
                onClick={closeSelectedProject}
                className="font-medium text-slate-600 transition hover:text-indigo-600 hover:underline"
              >
                Projets
              </button>
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="font-semibold text-slate-900" aria-current="page">
                {activeSelectedProject.reference}
                {activeSelectedProject.title ? ` â€” ${activeSelectedProject.title}` : ''}
              </span>
            </nav>

            <button
              type="button"
              onClick={closeSelectedProject}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Retour</span>
            </button>
          </div>

          <ProjectDetailsContainer
            project={activeSelectedProject}
              onClose={closeSelectedProject}
          />
        </main>
      </ProtectedRoute>
    );
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
              updateCreateUrl(!showAddProjectForm);
            }}
          >
            {showAddProjectForm ? 'Fermer le formulaire' : 'Nouveau projet'}
          </button>
        </div>

        {(error || projectsQuery.isError) && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error || 'Erreur lors de la rÃ©cupÃ©ration des projets'}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {projectFormWasOpened && !showAddProjectForm && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-800">
            <span>Un brouillon de projet est en attente â€” vos informations sont conservÃ©es.</span>
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
                  updateCreateUrl(false, true);
                }}
              >
                Recommencer
              </button>
            </div>
          </div>
        )}

        {projectFormWasOpened && (
          <EasyAddProjectForm
            show={showAddProjectForm}
            onCreated={(data) => {
              queryClient.setQueryData<Project[]>(projectsQueryKey, (currentProjects) => [data, ...(currentProjects ?? [])]);
              void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
              setShowAddProjectForm(false);
              selectProject(data);
              setError('');
              setSuccess('Projet ajoutÃ© avec succÃ¨s');
            }}
          />
        )}

        {loading ? (
          <div className="space-y-3" aria-label="Chargement des projets" role="status">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="hidden h-16 animate-pulse rounded-lg bg-slate-100 sm:block" />
            <div className="h-28 animate-pulse rounded-lg bg-slate-100 sm:hidden" />
            <p className="text-sm text-slate-500">Chargement des projets...</p>
          </div>
        ) : (
          <>
            <ProjectsList
              projects={projects}
              onDelete={handleDelete}
              handleSelectedProject={selectProject}
            />
            <div className="mt-10 border-t border-slate-200 pt-8">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Pilotage</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Tableau de bord de rentabilitÃ©</h2>
              </div>
              {profitabilityLoading && <p className="text-sm text-slate-500">Chargement de la rentabilitÃ©...</p>}
              {profitabilityError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{profitabilityError}</p>}
              {!profitabilityLoading && !profitabilityError && <><ProjectsProfitabilityOverview projects={profitabilityProjects} /><ProjectsProfitabilityTable projects={profitabilityProjects} /></>}
            </div>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
