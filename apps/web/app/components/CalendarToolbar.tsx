'use client';

import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import type { View } from 'react-big-calendar';

type CalendarToolbarProps = {
  dateLabel: string;
  view: View;
  loading: boolean;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onViewChange: (view: View) => void;
  onAdd: () => void;
  onSettings: () => void;
  onChooseDate: () => void;
};

const views: Array<{ value: View; label: string }> = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'day', label: 'Jour' },
];

export default function CalendarToolbar({ dateLabel, view, loading, onToday, onPrevious, onNext, onViewChange, onAdd, onSettings, onChooseDate }: CalendarToolbarProps) {
  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar__heading">
        <div className="calendar-kicker">Planning opérationnel</div>
        <h2 id="calendar-title" className="calendar-toolbar__title">{dateLabel}</h2>
        <p className="calendar-toolbar__subtitle">Votre semaine de chantier, au même endroit.</p>
      </div>
      <div className="calendar-toolbar__actions">
        <div className="calendar-navigation" aria-label="Navigation du calendrier">
          <button type="button" onClick={onSettings} disabled={loading} aria-label="Réglages du calendrier" title="Réglages du calendrier" className="calendar-icon-button"><Settings aria-hidden="true" /></button>
          <button type="button" onClick={onChooseDate} disabled={loading} className="calendar-button"><CalendarDays aria-hidden="true" /> <span>Choisir la date</span></button>
          <button type="button" onClick={onToday} disabled={loading} className="calendar-button calendar-button--today">Aujourd&apos;hui</button>
          <button type="button" onClick={onPrevious} disabled={loading} aria-label="Période précédente" className="calendar-icon-button"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" onClick={onNext} disabled={loading} aria-label="Période suivante" className="calendar-icon-button"><ChevronRight aria-hidden="true" /></button>
        </div>
        <div className="calendar-view-switcher" role="group" aria-label="Vue du calendrier">
          {views.map((item) => <button key={item.value} type="button" aria-pressed={view === item.value} onClick={() => onViewChange(item.value)} disabled={loading} className="calendar-view-button">{item.label}</button>)}
        </div>
        <button type="button" onClick={onAdd} disabled={loading} className="calendar-button calendar-button--primary"><CalendarPlus aria-hidden="true" /> <span>Ajouter</span></button>
      </div>
    </div>
  );
}
