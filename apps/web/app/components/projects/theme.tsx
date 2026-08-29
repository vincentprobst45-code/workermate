import type { ProjectStatus, WorkOrderStatus } from '@prisma/client';

// Shared visual language for the project details modal, aligned with the projects list page.
export const cardClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
export const sectionTitleClass = 'text-sm font-semibold text-slate-900';
export const btnPrimary = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700';
export const btnGhost =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50';
export const btnLink = 'text-xs font-semibold text-indigo-700 hover:text-indigo-900';
export const alertError = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700';
export const alertSuccess = 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700';

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; className: string }> = {
  OPEN: { label: 'Ouvert', className: 'bg-sky-50 text-sky-700' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Terminé', className: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Annulé', className: 'bg-stone-100 text-stone-600' },
};

export const WORKORDER_STATUS_META: Record<WorkOrderStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600' },
  PLANNED: { label: 'Planifié', className: 'bg-sky-50 text-sky-700' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Terminé', className: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Annulé', className: 'bg-stone-100 text-stone-600' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const meta = WORKORDER_STATUS_META[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function CardHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h4 className={sectionTitleClass}>{title}</h4>
      {actionLabel && onAction && (
        <button type="button" className={btnLink} onClick={onAction}>
          {actionLabel} →
        </button>
      )}
    </div>
  );
}
