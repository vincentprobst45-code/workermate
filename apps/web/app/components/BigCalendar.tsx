'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, dayjsLocalizer, type View } from 'react-big-calendar';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { CalendarDays, Hammer, MapPin, Package, Settings, UserRound } from 'lucide-react';
import 'dayjs/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useApiClient } from '../api-client';
import AddCalendarEventForm from './AddCalendarEventForm';
import CalendarDayHeader from './CalendarDayHeader';
import CalendarEventItem from './CalendarEventItem';
import CalendarToolbar from './CalendarToolbar';
import EventDetails from './EventDetails';
import type { CalendarEvent, CalendarEventApi, CalendarRange } from './calendar.types';

 dayjs.extend(localizedFormat);
 dayjs.locale('fr');
const localizer = dayjsLocalizer(dayjs);
const VIEW_KEY = 'workermate.calendar.view';
const DATE_KEY = 'workermate.calendar.date';

function personName(person?: CalendarEventApi['customer'] | CalendarEventApi['createdBy']) {
  if (!person) return undefined;
  if ('firstName' in person) {
    const customer = person as NonNullable<CalendarEventApi['customer']>;
    const name = [customer.firstName, customer.lastName].filter((value): value is string => Boolean(value?.trim())).join(' ');
    return name || customer.company?.trim() || undefined;
  }
  const creator = person as NonNullable<CalendarEventApi['createdBy']>;
  const name = [creator.firstname, creator.lastname].filter((value): value is string => Boolean(value?.trim())).join(' ');
  return name || creator.email?.trim() || undefined;
}

function addressName(address?: CalendarEventApi['address']) {
  if (!address) return undefined;
  return [address.street1, [address.postalCode, address.city].filter(Boolean).join(' ')]
    .filter(Boolean).join(', ') || undefined;
}

export function toCalendarEvent(dto: CalendarEventApi): CalendarEvent {
  return {
    id: dto.id,
    title: dto.title,
    start: new Date(dto.startDate),
    end: new Date(dto.endDate),
    color: dto.color,
    type: dto.type,
    description: dto.description,
    notes: dto.notes,
    customerName: dto.customerName ?? personName(dto.customer),
    projectName: dto.projectName ?? dto.project?.title ?? undefined,
    addressName: dto.addressName ?? addressName(dto.address),
    createdByName: dto.createdByName ?? personName(dto.createdBy),
  };
}

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function savedDate() {
  if (typeof window === 'undefined') return new Date();
  const value = new Date(window.localStorage.getItem(DATE_KEY) ?? '');
  return Number.isNaN(value.getTime()) ? new Date() : value;
}

function savedView(): View {
  if (typeof window === 'undefined') return 'week';
  const value = window.localStorage.getItem(VIEW_KEY);
  return value === 'month' || value === 'week' || value === 'day' || value === 'agenda' ? value : 'week';
}

function periodLabel(date: Date, view: View) {
  if (view === 'month') return dayjs(date).format('MMMM YYYY');
  if (view === 'day') return dayjs(date).format('dddd D MMMM YYYY');
  if (view === 'agenda') return `Agenda du ${dayjs(date).format('D MMMM YYYY')}`;
  const start = getMonday(date);
  return `${dayjs(start).format('D MMM')} - ${dayjs(start).add(6, 'day').format('D MMM YYYY')}`;
}

function CalendarSkeleton() {
  return (
    <div className="calendar-loading" aria-label="Chargement du calendrier">
      <div className="calendar-loading__grid">{Array.from({ length: 7 }, (_, index) => <div key={index} className="calendar-loading__column"><span /><span /><span /></div>)}</div>
      <p>Chargement du planning...</p>
    </div>
  );
}

const legend = [
  { label: 'Rendez-vous client', tone: 'teal', icon: UserRound },
  { label: 'Visite de chantier', tone: 'cyan', icon: MapPin },
  { label: 'Travaux', tone: 'indigo', icon: Hammer },
  { label: 'Maintenance', tone: 'amber', icon: Settings },
  { label: 'Livraison', tone: 'orange', icon: Package },
  { label: 'Administratif', tone: 'slate', icon: CalendarDays },
];

export default function BigCalendar() {
  const api = useApiClient();
  const initialDate = savedDate();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>(savedView);
  const [date, setDate] = useState(initialDate);
  const [visibleRange, setVisibleRange] = useState<CalendarRange>(() => {
    const start = getMonday(initialDate);
    return { start, end: dayjs(start).add(7, 'day').toDate() };
  });
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const empty = !loading && !error && calendarEvents.length === 0;

  useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view);
    window.localStorage.setItem(DATE_KEY, date.toISOString());
  }, [date, view]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ start: visibleRange.start.toISOString(), end: visibleRange.end.toISOString() });
      try {
        const response = await api.get(`/calendarevents?${params}`);
        if (!response.ok) throw new Error('Calendar request failed');
        const data = await response.json() as CalendarEventApi[];
        if (!cancelled) setCalendarEvents(data.map(toCalendarEvent));
      } catch {
        if (!cancelled) setError('Erreur lors de la récupération des événements.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [api, visibleRange]);

  useEffect(() => {
    if (!showAddEventModal) return;
    addModalRef.current?.focus();
    function close(event: KeyboardEvent) { if (event.key === 'Escape') setShowAddEventModal(false); }
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [showAddEventModal]);

  function rangeChange(range: Date[] | CalendarRange) {
    if (Array.isArray(range)) {
      if (!range.length) return;
      const start = new Date(Math.min(...range.map((item) => item.getTime())));
      const end = new Date(Math.max(...range.map((item) => item.getTime())));
      setVisibleRange({ start, end: dayjs(end).add(1, 'day').toDate() });
      return;
    }
    setVisibleRange(range);
  }

  function navigate(amount: number) {
    const unit = view === 'month' ? 'month' : view === 'day' ? 'day' : 'week';
    setDate(dayjs(date).add(amount, unit).toDate());
  }

  function goToToday() { setDate(new Date()); }
  function retry() { setVisibleRange({ ...visibleRange }); }

  return (
    <section className="calendar-shell" aria-labelledby="calendar-title" aria-busy={loading}>
      <CalendarToolbar dateLabel={periodLabel(date, view)} view={view} loading={loading} onToday={goToToday} onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onViewChange={setView} onAdd={() => setShowAddEventModal(true)} />

      <div className="calendar-legend" aria-label="Légende des types d’événements">
        {legend.map(({ label, tone, icon: Icon }) => <span key={label} className={`calendar-legend__item calendar-legend__item--${tone}`}><Icon aria-hidden="true" /> {label}</span>)}
      </div>

      {error && <div role="alert" className="calendar-alert"><span>{error}</span><button type="button" onClick={retry}>Réessayer</button></div>}

      <div className={`calendar-frame${empty ? ' calendar-frame--empty' : ''}`}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          toolbar={false}
          view={view}
          onView={setView}
          onRangeChange={rangeChange}
          date={date}
          onNavigate={setDate}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          culture="fr"
          formats={{ agendaDateFormat: 'ddd D MMM', dayHeaderFormat: 'ddd D MMM', dayRangeHeaderFormat: ({ start, end }) => `${dayjs(start).format('D MMM')} - ${dayjs(end).format('D MMM')}` }}
          components={{ event: CalendarEventItem, header: ({ label, date: headerDate }) => <CalendarDayHeader label={label} date={headerDate} isToday={dayjs(headerDate).isSame(dayjs(), 'day')} /> }}
          eventPropGetter={(event) => ({ className: `calendar-event-wrapper calendar-event-wrapper--${event.type ?? 'OTHER'}`, style: { '--event-color': event.color ?? '#3730A3' } as React.CSSProperties })}
          onSelectEvent={setSelectedEvent}
          scrollToTime={dayjs().hour(7).toDate()}
          style={{ height: 'clamp(560px, 72vh, 820px)' }}
        />
        {empty && <div className="calendar-empty"><div className="calendar-empty__icon"><CalendarDays aria-hidden="true" /></div><h3>Aucun événement sur cette période</h3><p>Votre planning est libre. Ajoutez un rendez-vous ou une intervention pour commencer.</p><button type="button" onClick={() => setShowAddEventModal(true)}>Ajouter un événement</button></div>}
        {loading && <CalendarSkeleton />}
      </div>

      {showAddEventModal && <div className="calendar-modal-backdrop" onClick={() => setShowAddEventModal(false)}><div ref={addModalRef} role="dialog" aria-modal="true" aria-labelledby="add-calendar-event-title" tabIndex={-1} className="calendar-modal" onClick={(event) => event.stopPropagation()}><span id="add-calendar-event-title" className="sr-only">Ajouter un événement</span><button type="button" aria-label="Fermer la création d’événement" onClick={() => setShowAddEventModal(false)} className="calendar-modal__close">×</button><AddCalendarEventForm onCreated={(data) => { setCalendarEvents((current) => [toCalendarEvent(data), ...current]); setShowAddEventModal(false); }} /></div></div>}
      {selectedEvent && <div className="calendar-modal-backdrop calendar-modal-backdrop--details" onClick={() => setSelectedEvent(null)}><EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} /></div>}
    </section>
  );
}
