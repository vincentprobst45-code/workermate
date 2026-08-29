'use client';

import { ProjectStatus } from '@prisma/client';
import { useMemo, useState } from 'react';
import type { Project } from './AddProjectForm';
import ProjectDetailsContainer from './projects/ProjectDetailsContainer';

type SortBy = 'createdAtDesc' | 'createdAtAsc' | 'referenceAsc' | 'referenceDesc';

interface ProjectsListProps {
  projects: Project[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  handleSelectedProject?: ((project: Project) => void | Promise<void>) | null;
}

function formatCustomerNames(project: Project): string {
  const labels = project.customers
    .map((link) => [link.customer.firstName, link.customer.lastName, link.customer.company]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim())
      .join(' '))
    .filter(Boolean);

  if (!labels.length) {
    return 'Aucun client';
  }

  return labels.join(', ');
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

export default function ProjectsList({ projects, onDelete, handleSelectedProject = null }: ProjectsListProps) {
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsPerPage, setProjectsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAtDesc');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter((project) =>
      statusFilter === 'ALL' ? true : project.status === statusFilter,
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === 'createdAtDesc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'createdAtAsc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'referenceAsc') {
        return a.reference.localeCompare(b.reference, 'fr', { sensitivity: 'base' });
      }
      return b.reference.localeCompare(a.reference, 'fr', { sensitivity: 'base' });
    });
  }, [projects, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProjects.length / projectsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const firstItemIndex = (effectiveCurrentPage - 1) * projectsPerPage;
  const currentProjects = filteredAndSortedProjects.slice(
    firstItemIndex,
    firstItemIndex + projectsPerPage,
  );
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  function openProject(project: Project) {
    if (handleSelectedProject) {
      void handleSelectedProject(project);
    } else {
      setShowProjectDetails(true);
      setSelectedProject(project);
    }
  }

  const hasRowActions = Boolean(onDelete);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3 text-sm">
        <label htmlFor="projects-sort" className="text-slate-500">Trier</label>
        <select
          id="projects-sort"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700"
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as SortBy);
            setCurrentPage(1);
          }}
        >
          <option value="createdAtDesc">Date d&apos;ajout: plus récent</option>
          <option value="createdAtAsc">Date d&apos;ajout: plus ancien</option>
          <option value="referenceAsc">Référence: A → Z</option>
          <option value="referenceDesc">Référence: Z → A</option>
        </select>

        <label htmlFor="projects-status" className="text-slate-500">Statut</label>
        <select
          id="projects-status"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as 'ALL' | ProjectStatus);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">Tous</option>
          <option value="OPEN">Ouvert</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Terminé</option>
          <option value="CANCELLED">Annulé</option>
        </select>

        <label htmlFor="projects-per-page" className="text-slate-500">Par page</label>
        <select
          id="projects-per-page"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700"
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
        </select>
      </div>

      {/* Desktop / tablet: table */}
      <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
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
                  tabIndex={0}
                  className="cursor-pointer transition hover:bg-indigo-50/60 focus-visible:bg-indigo-50/60 focus-visible:outline-none"
                  onClick={() => openProject(project)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openProject(project);
                    }
                  }}
                >
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
                            void onDelete(project.id);
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-800"
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
          <div
            key={project.id}
            role="button"
            tabIndex={0}
            onClick={() => openProject(project)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProject(project);
              }
            }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
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
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Créé le {formatDate(project.createdAt)}</span>
              {onDelete && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onDelete(project.id);
                  }}
                  className="font-medium text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {filteredAndSortedProjects.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">Aucun projet à afficher.</p>
      )}

      {filteredAndSortedProjects.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Précédent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded-lg border px-3 py-1.5 text-sm ${pageNumber === effectiveCurrentPage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {showProjectDetails && selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setShowProjectDetails(false);
            setSelectedProject(null);
          }}
        >
          <ProjectDetailsContainer
            project={selectedProject}
            onClose={() => {
              setShowProjectDetails(false);
              setSelectedProject(null);
            }}
          />
        </div>
      )}
    </>
  );
}
