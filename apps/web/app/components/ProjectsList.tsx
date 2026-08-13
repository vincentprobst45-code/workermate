'use client';

import { ProjectStatus } from '@prisma/client';
import { useMemo, useState } from 'react';
import type { Project } from './AddProjectForm';

type SortBy = 'createdAtDesc' | 'createdAtAsc' | 'referenceAsc' | 'referenceDesc';

interface ProjectsListProps {
  projects: Project[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  handleSelectedProject?: ((project: Project) => void | Promise<void>) | null;
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('fr-FR');
}

function statusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'OPEN':
      return 'Ouvert';
    case 'IN_PROGRESS':
      return 'En cours';
    case 'COMPLETED':
      return 'Terminé';
    case 'CANCELLED':
      return 'Annulé';
    default:
      return status;
  }
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <label htmlFor="projects-sort" className="text-sm text-slate-700">Trier</label>
        <select
          id="projects-sort"
          className="rounded border bg-white px-2 py-1"
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

        <label htmlFor="projects-status" className="text-sm text-slate-700">Statut</label>
        <select
          id="projects-status"
          className="rounded border bg-white px-2 py-1"
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

        <label htmlFor="projects-per-page" className="text-sm text-slate-700">Projets par page</label>
        <select
          id="projects-per-page"
          className="rounded border bg-white px-2 py-1"
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

      <div className="grid gap-4">
        {currentProjects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between rounded-lg border-2 border-gray-700 bg-white p-4 shadow hover:bg-gray-100 active:bg-gray-400"
            onClick={() => {
              if (handleSelectedProject) {
                void handleSelectedProject(project);
              } else {
                setShowProjectDetails(true);
                setSelectedProject(project);
              }
            }}
          >
            <div>
              <p className="font-semibold">{project.reference} - {project.title}</p>
              <p className="text-sm text-slate-600">{statusLabel(project.status)}</p>
              <p className="text-xs text-slate-500">{formatCustomerNames(project)}</p>
            </div>
            {onDelete && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  void onDelete(project.id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Supprimer
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredAndSortedProjects.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Aucun projet à afficher.</p>
      )}

      {filteredAndSortedProjects.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            className="rounded border px-3 py-1 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Précédent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded border px-3 py-1 ${pageNumber === effectiveCurrentPage ? 'bg-slate-900 text-white' : 'bg-white'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded border px-3 py-1 disabled:opacity-50"
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
          <div
            className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-3 text-xl font-semibold">{selectedProject.reference} - {selectedProject.title}</h3>
            <p className="mb-2 text-sm text-slate-600">Statut: {statusLabel(selectedProject.status)}</p>
            <p className="mb-2 text-sm text-slate-600">Description: {selectedProject.description || '-'}</p>
            <p className="mb-4 text-sm text-slate-600">Notes: {selectedProject.notes || '-'}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded border bg-slate-50 p-3 text-sm">
                <p><strong>Clients:</strong> {selectedProject.customers.length}</p>
                <p><strong>Liste:</strong> {formatCustomerNames(selectedProject)}</p>
              </div>
              <div className="rounded border bg-slate-50 p-3 text-sm">
                <p><strong>Devis:</strong> {selectedProject._count?.quotes ?? 0}</p>
                <p><strong>Chantiers:</strong> {selectedProject._count?.workOrders ?? 0}</p>
                <p><strong>Factures:</strong> {selectedProject._count?.invoices ?? 0}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">Créé le {formatDate(selectedProject.createdAt)}</p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded border bg-slate-100 px-3 py-2 hover:bg-slate-200"
                onClick={() => {
                  setShowProjectDetails(false);
                  setSelectedProject(null);
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
