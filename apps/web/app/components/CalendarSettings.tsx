'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Clock3, X } from 'lucide-react';

type CalendarSettingsProps = {
  startHour: number;
  endHour: number;
  onClose: () => void;
  onSave: (startHour: number, endHour: number) => void;
};

const hours = Array.from({ length: 24 }, (_, hour) => hour);

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function CalendarSettings({ startHour, endHour, onClose, onSave }: CalendarSettingsProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [draftStartHour, setDraftStartHour] = useState(startHour);
  const [draftEndHour, setDraftEndHour] = useState(endHour);
  const invalidRange = draftEndHour <= draftStartHour;

  useEffect(() => {
    dialogRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  function save() {
    if (invalidRange) return;
    onSave(draftStartHour, draftEndHour);
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="calendar-settings w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="calendar-settings__header flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
        <div>
          <p className="calendar-kicker">Affichage</p>
          <h2 id={titleId} className="calendar-settings__title mt-1 text-lg font-extrabold text-slate-950">Réglages du calendrier</h2>
        </div>
        <button type="button" aria-label="Fermer les réglages du calendrier" className="calendar-settings__close grid h-8 w-8 shrink-0 place-items-center rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={onClose}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="calendar-settings__body bg-white p-5">
        <div className="calendar-settings__intro flex items-start gap-2 text-sm leading-relaxed text-slate-600">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" />
          <p>Choisissez la plage horaire visible dans les vues semaine et jour.</p>
        </div>
        <div className="calendar-settings__fields mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-extrabold text-slate-600">
            <span>Début</span>
            <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900" value={draftStartHour} onChange={(event) => setDraftStartHour(Number(event.target.value))}>
              {hours.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-extrabold text-slate-600">
            <span>Fin</span>
            <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900" value={draftEndHour} onChange={(event) => setDraftEndHour(Number(event.target.value))}>
              {hours.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
            </select>
          </label>
        </div>
        {invalidRange && <p className="calendar-settings__error mt-2 text-xs text-red-700" role="alert">L’heure de fin doit être postérieure à l’heure de début.</p>}
      </div>

      <div className="calendar-settings__actions flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
        <button type="button" className="calendar-settings__cancel rounded-md px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-200 hover:text-slate-900" onClick={onClose}>Annuler</button>
        <button type="button" className="calendar-settings__save rounded-md bg-indigo-700 px-3 py-2 text-sm font-extrabold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={invalidRange} onClick={save}>Appliquer</button>
      </div>
    </div>
  );
}
