'use client';

import { ProjectStatus } from '@prisma/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Search, X } from 'lucide-react';
import type { Project } from './AddProjectForm';
import ProjectDetailsContainer from './projects/ProjectDetailsContainer';

type SortBy = 'createdAtDesc' | 'createdAtAsc' | 'titleAsc' | 'titleDesc' | 'customerAsc' | 'customerDesc';
type StatusFilter = 'ALL' | ProjectStatus;

interface ProjectsListProps {
  projects: Project[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  handleSelectedProject?: ((project: Project | null) => void | Promise<void>) | null;
}

const focusRingClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';
const buttonClass = `rounded-lg px-3 py-2 text-sm font-semibold transition ${focusRingClass}`;

function formatCustomerNames(project: Project): string {
  const primary = project.customers.find((link) => link.isPrimary) ?? project.customers[0];
  if (!primary) {
    return 'Aucun client';
  }

  const label = [primary.customer.firstName, primary.customer.lastName, primary.customer.company]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim())
      .join(' ') || 'Client sans nom';
  const otherCount = Math.max(0, project.customers.length - 1);
  return otherCount > 0 ? `${label} +${otherCount} autre${otherCount > 1 ? 's' : ''}` : label;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_META: Record<ProjectStatus, { label: string; className: string }> = {
  OPEN: { label: 'Ouvert', className: 'bg-sky-50 text-sky-700' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Terminé', className: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Annulé', className: 'bg-stone-100 text-stone-600' },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <span className="font-semibold text-slate-700">{value}</span> {label}
    </span>
  );
}

function getProjectUrl(projectId?: string): string {
  const url = new URL(window.location.href);
  if (projectId) {
    url.searchParams.set('project', projectId);
  } else {
    url.searchParams.delete('project');
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

function Pagination({ currentPage, totalPages, onChange }: { currentPage: number; totalPages: number; onChange: (page: number) => void }) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1].filter((page) => page >= 1 && page <= totalPages));
  const items: Array<number | 'ellipsis'> = [];
  [...pages].sort((a, b) => a - b).forEach((page, index, allPages) => {
    if (index > 0 && page - allPages[index - 1] > 1) items.push('ellipsis');
    items.push(page);
  });

  return (
    <nav aria-label="Pagination des projets" className="mt-5 flex flex-wrap items-center justify-center gap-2">
      <button type="button" aria-label="Page précédente" className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`} onClick={() => onChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Précédent</button>
      {items.map((item, index) => item === 'ellipsis' ? (
        <span key={`ellipsis-${index}`} className="px-1 text-slate-400" aria-hidden="true">…</span>
      ) : (
        <button type="button" key={item} className={`${buttonClass} border ${item === currentPage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`} onClick={() => onChange(item)} aria-current={item === currentPage ? 'page' : undefined} aria-label={`Page ${item}`}>{item}</button>
      ))}
      <button type="button" aria-label="Page suivante" className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`} onClick={() => onChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Suivant</button>
    </nav>
  );
}

export default function ProjectsList({ projects, onDelete, handleSelectedProject = null }: ProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectsPerPage, setProjectsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAtDesc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState('');
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);

  const filteredAndSortedProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr');
    const filtered = projects.filter((project) =>
      (statusFilter === 'ALL' || project.status === statusFilter) &&
      (!normalizedSearch || [project.reference, project.title, ...project.customers.flatMap((link) => [link.customer.firstName, link.customer.lastName, link.customer.company])]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('fr').includes(normalizedSearch))),
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === 'createdAtDesc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'createdAtAsc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'titleAsc' || sortBy === 'titleDesc') {
        const comparison = a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
        return sortBy === 'titleAsc' ? comparison : -comparison;
      }
      const comparison = formatCustomerNames(a).localeCompare(formatCustomerNames(b), 'fr', { sensitivity: 'base' });
      return sortBy === 'customerAsc' ? comparison : -comparison;
    });
  }, [projects, searchTerm, sortBy, statusFilter]);

  const statusCounts = useMemo(() => ({
    ALL: projects.length,
    OPEN: projects.filter((project) => project.status === 'OPEN').length,
    IN_PROGRESS: projects.filter((project) => project.status === 'IN_PROGRESS').length,
    COMPLETED: projects.filter((project) => project.status === 'COMPLETED').length,
    CANCELLED: projects.filter((project) => project.status === 'CANCELLED').length,
  }), [projects]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProjects.length / projectsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const firstItemIndex = (effectiveCurrentPage - 1) * projectsPerPage;
  const currentProjects = filteredAndSortedProjects.slice(
    firstItemIndex,
    firstItemIndex + projectsPerPage,
  );

  function openProject(project: Project) {
    if (handleSelectedProject) {
      void handleSelectedProject(project);
    } else {
      window.history.pushState({}, '', getProjectUrl(project.id));
      setSelectedProject(project);
    }
  }

  function closeProject() {
    if (handleSelectedProject) {
      void handleSelectedProject(null);
    } else {
      window.history.pushState({}, '', getProjectUrl());
      setSelectedProject(null);
    }
  }

  async function confirmDelete() {
    if (!projectToDelete || !onDelete) return;
    setDeletingProjectId(projectToDelete.id);
    setDeletionError('');
    try {
      await onDelete(projectToDelete.id);
      setProjectToDelete(null);
      deleteTriggerRef.current?.focus();
    } catch {
      setDeletionError('La suppression a échoué. Le projet est toujours présent.');
    } finally {
      setDeletingProjectId(null);
    }
  }

  useEffect(() => {
    if (!projectToDelete) return;
    deleteCancelButtonRef.current?.focus();
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deletingProjectId) {
        setProjectToDelete(null);
        deleteTriggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [projectToDelete, deletingProjectId]);

  const hasRowActions = Boolean(onDelete);

  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/"
              className="font-medium text-slate-600 transition hover:text-indigo-600 hover:underline"
            >
              Accueil
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <button
              type="button"
              onClick={closeProject}
              className={`font-medium text-slate-600 transition hover:text-indigo-600 hover:underline ${focusRingClass}`}
            >
              Projets
            </button>
            <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className="font-semibold text-slate-900" aria-current="page">
              {selectedProject.reference}
              {selectedProject.title ? ` — ${selectedProject.title}` : ''}
            </span>
          </nav>

          <button
            type="button"
            onClick={closeProject}
            className={`${buttonClass} inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Retour</span>
          </button>
        </div>

        <ProjectDetailsContainer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <label className="relative block">
            <span className="sr-only">Rechercher un projet</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Rechercher par référence, projet ou client" className={`w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 ${focusRingClass}`} />
          </label>
          <label htmlFor="projects-sort" className="flex flex-col gap-1 text-sm text-slate-500"><span>Trier par</span><select
          id="projects-sort"
          className={`rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 ${focusRingClass}`}
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as SortBy);
            setCurrentPage(1);
          }}
        >
          <option value="createdAtDesc">Plus récents</option>
          <option value="createdAtAsc">Plus anciens</option>
          <option value="titleAsc">Titre: A → Z</option>
          <option value="titleDesc">Titre: Z → A</option>
          <option value="customerAsc">Nom du client: A → Z</option>
          <option value="customerDesc">Nom du client: Z → A</option>
        </select></label>

          <label htmlFor="projects-per-page" className="flex flex-col gap-1 text-sm text-slate-500"><span>Projets par page</span><select
          id="projects-per-page"
          className={`rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 ${focusRingClass}`}
          value={projectsPerPage}
          onChange={(event) => {
            setProjectsPerPage(Number(event.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select></label>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les projets par statut">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
            <button type="button" key={status} onClick={() => { setStatusFilter(status); setCurrentPage(1); }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${statusFilter === status ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} aria-pressed={statusFilter === status}>
              {status === 'ALL' ? 'Tous' : STATUS_META[status].label} <span className="ml-1 text-slate-400">{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop / tablet: table */}
      <section className="hidden overflow-hidden border-y border-slate-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><span className="sr-only">Ouvrir</span></th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Référence</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Projet</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client(s)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Activité</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Créé le</th>
                {hasRowActions && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentProjects.map((project) => (
                <tr
                  key={project.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3"><button type="button" onClick={() => openProject(project)} className={`${buttonClass} bg-indigo-600 text-xs text-white hover:bg-indigo-700`} aria-label={`Ouvrir le projet ${project.reference}`}>Ouvrir</button></td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{project.reference}</td>
                  <td className="max-w-[14rem] truncate px-4 py-3 text-slate-700">{project.title}</td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-slate-500">{formatCustomerNames(project)}</td>
                  <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <CountStat label="devis" value={project._count?.quotes ?? 0} />
                      <CountStat label="chantiers" value={project._count?.workOrders ?? 0} />
                      <CountStat label="factures" value={project._count?.invoices ?? 0} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(project.createdAt)}</td>
                  {hasRowActions && (
                    <td className="px-4 py-3 text-right">
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteTriggerRef.current = event.currentTarget;
                            setProjectToDelete(project);
                          }}
                          className={`${buttonClass} bg-red-600 text-xs text-white hover:bg-red-700 focus-visible:ring-red-600`}
                          aria-label={`Supprimer le projet ${project.reference}`}
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mobile: stacked cards */}
      <section className="grid gap-3 sm:hidden">
        {currentProjects.map((project) => (
          <article
            key={project.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{project.reference}</p>
                <p className="mt-0.5 truncate text-sm text-slate-600">{project.title}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-2 truncate text-sm text-slate-500">{formatCustomerNames(project)}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3">
              <CountStat label="devis" value={project._count?.quotes ?? 0} />
              <CountStat label="chantiers" value={project._count?.workOrders ?? 0} />
              <CountStat label="factures" value={project._count?.invoices ?? 0} />
            </div>
            <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
              <span>Créé le {formatDate(project.createdAt)}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openProject(project)} className={`${buttonClass} bg-indigo-600 text-xs text-white hover:bg-indigo-700`} aria-label={`Ouvrir le projet ${project.reference}`}>Ouvrir</button>
                {onDelete && (
                  <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteTriggerRef.current = event.currentTarget;
                    setProjectToDelete(project);
                  }}
                  className={`${buttonClass} bg-red-600 text-xs text-white hover:bg-red-700 focus-visible:ring-red-600`}
                  aria-label={`Supprimer le projet ${project.reference}`}
                  >Supprimer</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {filteredAndSortedProjects.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <p className="font-semibold text-slate-800">{projects.length === 0 ? 'Aucun projet' : 'Aucun résultat'}</p>
          <p className="mt-1 text-sm text-slate-500">{projects.length === 0 ? 'Créez votre premier projet pour commencer.' : 'Modifiez votre recherche ou réinitialisez les filtres.'}</p>
          {projects.length > 0 && (searchTerm || statusFilter !== 'ALL') && (
            <button type="button" className={`${buttonClass} mt-3 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`} onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setCurrentPage(1); }}>Réinitialiser les filtres</button>
          )}
        </div>
      )}

      {filteredAndSortedProjects.length > 0 && (
        <>
          <p className="mt-5 text-center text-xs text-slate-500">{firstItemIndex + 1}–{firstItemIndex + currentProjects.length} sur {filteredAndSortedProjects.length} projet{filteredAndSortedProjects.length > 1 ? 's' : ''}</p>
          <Pagination currentPage={effectiveCurrentPage} totalPages={totalPages} onChange={setCurrentPage} />
        </>
      )}

      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingProjectId) setProjectToDelete(null); }}>
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-project-title" aria-describedby="delete-project-description">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-project-title" className="text-lg font-bold text-slate-900">Supprimer ce projet ?</h2>
                <p id="delete-project-description" className="mt-2 text-sm text-slate-600">Le projet <strong>{projectToDelete.reference}</strong> et ses associations seront supprimés. Cette action est irréversible.</p>
              </div>
              <button type="button" className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${focusRingClass}`} onClick={() => setProjectToDelete(null)} aria-label="Fermer la confirmation" disabled={Boolean(deletingProjectId)}><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            {deletionError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{deletionError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button ref={deleteCancelButtonRef} type="button" className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`} onClick={() => { setProjectToDelete(null); deleteTriggerRef.current?.focus(); }} disabled={Boolean(deletingProjectId)}>Annuler</button>
              <button type="button" className={`${buttonClass} min-w-28 bg-red-600 text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60`} onClick={() => void confirmDelete()} disabled={Boolean(deletingProjectId)}>{deletingProjectId ? 'Suppression...' : 'Supprimer définitivement'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
