'use client';

import { useEffect, useId, useRef } from 'react';
import { Pencil, X } from 'lucide-react';
import type { CalendarEvent } from './calendar.types';

type EventDetailsProps = {
  event: CalendarEvent;
  onClose: () => void;
  onEdit?: () => void;
};

function formatDate(value: Date): string {
  return value.toLocaleString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export default function EventDetails({ event, onClose, onEdit }: EventDetailsProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function closeOnEscape(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl sm:p-6"
      onClick={(eventClick) => eventClick.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Événement</p>
          <h2 id={titleId} className="mt-1 truncate text-xl font-bold text-slate-950">{event.title}</h2>
        </div>
        <button
          type="button"
          aria-label="Fermer les détails de l'événement"
          className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
        <Detail label="Début" value={formatDate(event.start)} />
        <Detail label="Fin" value={formatDate(event.end)} />
        <Detail label="Client" value={event.customerName} />
        <Detail label="Projet" value={event.projectName} />
        <Detail label="Adresse" value={event.addressName} />
        <Detail label="Créé par" value={event.createdByName} />
      </dl>

      {(event.description || event.notes) && (
        <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
          <Detail label="Description" value={event.description} />
          <Detail label="Notes" value={event.notes} />
        </div>
      )}

      <div className="mt-5 flex justify-end border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Modifier
        </button>
      </div>
    </div>
  );
}
