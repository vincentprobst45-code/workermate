'use client';

import { useEffect, useId, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { View } from 'react-big-calendar';

type DateSelectorMode = 'month' | 'week' | 'day';

type DateSelectorProps = {
  date: Date;
  view: View;
  onSelect: (date: Date, view: DateSelectorMode) => void;
  onClose: () => void;
};

const monthLabels = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2024, month, 1)),
);
const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function isToday(date: Date) {
  return sameDay(date, new Date());
}

function monthDays(date: Date) {
  const firstDay = startOfMonth(date);
  const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const daysInPreviousMonth = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
  const days = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    days.push(new Date(date.getFullYear(), date.getMonth() - 1, daysInPreviousMonth - index));
  }
  for (let day = 1; day <= daysInMonth; day += 1) days.push(new Date(date.getFullYear(), date.getMonth(), day));
  for (let day = 1; days.length < 42; day += 1) days.push(new Date(date.getFullYear(), date.getMonth() + 1, day));
  return days;
}

function modeFromView(view: View): DateSelectorMode {
  return view === 'month' || view === 'day' ? view : 'week';
}

export default function DateSelector({ date, view, onSelect, onClose }: DateSelectorProps) {
  const titleId = useId();
  const [mode, setMode] = useState<DateSelectorMode>(modeFromView(view));
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(date));
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const days = monthDays(displayMonth);
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(displayMonth);
  const selectedWeekStart = startOfWeek(date);

  function selectMonth(month: number) {
    onSelect(new Date(displayMonth.getFullYear(), month, 1), 'month');
  }

  function selectDay(selectedDate: Date) {
    onSelect(selectedDate, mode);
  }

  return (
    <div className="date-selector" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="date-selector__header">
        <div>
          <p className="calendar-kicker">Aller à une date</p>
          <h2 id={titleId} className="date-selector__title">Choisir la date</h2>
        </div>
        <button type="button" className="calendar-icon-button" aria-label="Fermer le choix de date" onClick={onClose}><X aria-hidden="true" /></button>
      </div>

      <div className="date-selector__modes" role="tablist" aria-label="Mode de sélection">
        {(['month', 'week', 'day'] as const).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={mode === item} className="date-selector__mode" onClick={() => setMode(item)}>
            {item === 'month' ? 'Mois' : item === 'week' ? 'Semaine' : 'Jour'}
          </button>
        ))}
      </div>

      {mode === 'month' ? (
        <div className="date-selector__months" aria-label={`Mois de ${displayMonth.getFullYear()}`}>
          {monthLabels.map((label, month) => (
            <button key={label} type="button" className={`date-selector__month${month === date.getMonth() && displayMonth.getFullYear() === date.getFullYear() ? ' is-selected' : ''}`} onClick={() => selectMonth(month)}>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="date-selector__calendar">
          <div className="date-selector__calendar-heading">
            <strong>{monthName}</strong>
            <div className="date-selector__month-nav">
              <button type="button" className="calendar-icon-button" aria-label="Mois précédent" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}><ChevronLeft aria-hidden="true" /></button>
              <button type="button" className="calendar-icon-button" aria-label="Mois suivant" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}><ChevronRight aria-hidden="true" /></button>
            </div>
          </div>
          <div className="date-selector__weekdays" aria-hidden="true">{weekdayLabels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
          <div className={`date-selector__days date-selector__days--${mode}`}>
            {days.map((day, index) => {
              const weekIndex = Math.floor(index / 7);
              const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
              const inSelectedWeek = sameDay(startOfWeek(day), selectedWeekStart);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`date-selector__day${isCurrentMonth ? '' : ' is-outside'}${isToday(day) ? ' is-today' : ''}${sameDay(day, date) ? ' is-selected' : ''}${mode === 'week' && hoveredWeek === weekIndex ? ' is-hovered-week' : ''}${mode === 'week' && inSelectedWeek ? ' is-selected-week' : ''}`}
                  onMouseEnter={() => mode === 'week' && setHoveredWeek(weekIndex)}
                  onFocus={() => mode === 'week' && setHoveredWeek(weekIndex)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  onBlur={() => setHoveredWeek(null)}
                  onClick={() => selectDay(day)}
                  aria-label={day.toLocaleDateString('fr-FR', { dateStyle: 'full' })}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
