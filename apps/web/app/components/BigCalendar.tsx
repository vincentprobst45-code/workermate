'use client';

import { useEffect, useState } from 'react';
import { Calendar, dayjsLocalizer, type SlotInfo, type View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { CalendarDays, Hammer, Lock, LockOpen, MapPin, Package, Settings, UserRound } from 'lucide-react';
import 'dayjs/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useApiClient } from '../api-client';
import AddCalendarEventForm from './AddCalendarEventForm';
import CalendarDayHeader from './CalendarDayHeader';
import CalendarEventItem from './CalendarEventItem';
import CalendarSettings from './CalendarSettings';
import CalendarToolbar from './CalendarToolbar';
import DateSelector from './DateSelector';
import EventDetails from './EventDetails';
import FocusTrap from './FocusTrap';
import type { CalendarEvent, CalendarEventApi, CalendarRange } from './calendar.types';

 dayjs.extend(localizedFormat);
 dayjs.locale('fr');
const localizer = dayjsLocalizer(dayjs);
const DragAndDropCalendar = withDragAndDrop(Calendar);
const VIEW_KEY = 'workermate.calendar.view';
const DATE_KEY = 'workermate.calendar.date';
const START_HOUR_KEY = 'workermate.calendar.start-hour';
const END_HOUR_KEY = 'workermate.calendar.end-hour';
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 21;

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
    allDay: dto.allDay,
    color: dto.color,
    type: dto.type,
    description: dto.description,
    notes: dto.notes,
    customerName: dto.customerName ?? personName(dto.customer),
    projectName: dto.projectName ?? dto.project?.title ?? undefined,
    addressName: dto.addressName ?? addressName(dto.address),
    createdByName: dto.createdByName ?? personName(dto.createdBy),
    customerId: dto.customerId,
    addressId: dto.addressId,
    workOrderId: dto.workOrderId,
    projectId: dto.projectId,
    address: dto.address,
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

function savedHour(key: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  const value = Number(window.localStorage.getItem(key));
  return Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback;
}

function periodLabel(date: Date, view: View) {
  if (view === 'month') return dayjs(date).format('MMMM YYYY');
  if (view === 'day') return dayjs(date).format('dddd D MMMM YYYY');
  if (view === 'agenda') return `Agenda du ${dayjs(date).format('D MMMM YYYY')}`;
  const start = getMonday(date);
  return `${dayjs(start).format('D')}–${dayjs(start).add(6, 'day').format('D MMM YYYY')}`;
}

function AgendaEventItem({ event }: { event: CalendarEvent }) {
  return (
    <div className="calendar-agenda-event">
      <strong>{event.title}</strong>
      <span>{event.customerName ?? 'Sans client'}{event.projectName ? ` · ${event.projectName}` : ''}</span>
      <span>{event.addressName ?? 'Adresse non renseignée'}</span>
      <small>{event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
    </div>
  );
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
  { type: 'CUSTOMER_APPOINTMENT', label: 'Rendez-vous client', tone: 'teal', icon: UserRound },
  { type: 'SITE_VISIT', label: 'Visite de chantier', tone: 'cyan', icon: MapPin },
  { type: 'WORK', label: 'Travaux', tone: 'indigo', icon: Hammer },
  { type: 'MAINTENANCE', label: 'Maintenance', tone: 'amber', icon: Settings },
  { type: 'DELIVERY', label: 'Livraison', tone: 'orange', icon: Package },
  { type: 'ADMINISTRATIVE', label: 'Administratif', tone: 'slate', icon: CalendarDays },
  { type: 'ABSENCE', label: 'Absence', tone: 'coral', icon: CalendarDays },
  { type: 'OTHER', label: 'Autre', tone: 'slate', icon: CalendarDays },
];

export default function BigCalendar() {
  const api = useApiClient();
  const initialDate = savedDate();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(initialDate);
  const [startHour, setStartHour] = useState(DEFAULT_START_HOUR);
  const [endHour, setEndHour] = useState(DEFAULT_END_HOUR);
  const [visibleRange, setVisibleRange] = useState<CalendarRange>(() => {
    const start = getMonday(initialDate);
    return { start, end: dayjs(start).add(7, 'day').toDate() };
  });
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [calendarUnlocked, setCalendarUnlocked] = useState(false);
  const [prefillRange, setPrefillRange] = useState<{ start: Date; end: Date } | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(() => new Set(legend.map(({ type }) => type)));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const displayedEvents = calendarEvents.filter((event) => visibleTypes.has(event.type ?? 'OTHER'));
  const empty = !loading && !error && displayedEvents.length === 0;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedDate = savedDate();
      setDate(storedDate);
      setView(savedView());
      const storedStartHour = savedHour(START_HOUR_KEY, DEFAULT_START_HOUR);
      const storedEndHour = savedHour(END_HOUR_KEY, DEFAULT_END_HOUR);
      const hasValidHourRange = storedEndHour > storedStartHour;
      setStartHour(hasValidHourRange ? storedStartHour : DEFAULT_START_HOUR);
      setEndHour(hasValidHourRange ? storedEndHour : DEFAULT_END_HOUR);
      setVisibleRange({ start: getMonday(storedDate), end: dayjs(getMonday(storedDate)).add(7, 'day').toDate() });
      setIsHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
  function saveSettings(nextStartHour: number, nextEndHour: number) {
    setStartHour(nextStartHour);
    setEndHour(nextEndHour);
    window.localStorage.setItem(START_HOUR_KEY, String(nextStartHour));
    window.localStorage.setItem(END_HOUR_KEY, String(nextEndHour));
    setShowSettingsModal(false);
  }

  function selectEmptySlot(slot: SlotInfo) {
    if (view === 'agenda') return;
    setPrefillRange({ start: slot.start, end: slot.end });
    setShowAddEventModal(true);
  }

  async function updateEventDates(event: CalendarEvent, start: Date, end: Date) {
    try {
      const response = await api.put(`/calendarevents/${event.id}`, { startDate: start.toISOString(), endDate: end.toISOString() });
      if (!response.ok) throw new Error('Calendar event update failed');
      const updated = await response.json() as CalendarEventApi;
      setCalendarEvents((current) => current.map((item) => item.id === event.id ? toCalendarEvent(updated) : item));
    } catch {
      setError('Impossible d’enregistrer le déplacement de l’événement.');
    }
  }

  function toggleLegend(type: string) {
    setVisibleTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  return (
    <section className="calendar-shell" aria-labelledby="calendar-title" aria-busy={loading}>
      <CalendarToolbar dateLabel={periodLabel(date, view)} view={view} loading={loading} onToday={goToToday} onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onViewChange={setView} onAdd={() => setShowAddEventModal(true)} onSettings={() => setShowSettingsModal(true)} onChooseDate={() => setShowDateSelector(true)} />

      <div className="calendar-legend" aria-label="Légende des types d’événements">
        {legend.map(({ label, type, tone, icon: Icon }) => <button key={label} type="button" aria-pressed={visibleTypes.has(type)} className={`calendar-legend__item calendar-legend__item--${tone}${visibleTypes.has(type) ? '' : ' is-muted'}`} onClick={() => toggleLegend(type)}><Icon aria-hidden="true" /> {label}</button>)}
      </div>

      {error && <div role="alert" className="calendar-alert"><span>{error}</span><button type="button" onClick={retry}>Réessayer</button></div>}

      <div className={`calendar-frame${empty ? ' calendar-frame--empty' : ''}${view === 'week' || view === 'day' ? ' calendar-frame--time-grid' : ''}`}>
        <button type="button" className="calendar-lock-button" aria-label={calendarUnlocked ? 'Verrouiller les événements' : 'Déverrouiller les événements'} aria-pressed={calendarUnlocked} onClick={() => setCalendarUnlocked((current) => !current)}>{calendarUnlocked ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}</button>
        {isHydrated && <DragAndDropCalendar
          localizer={localizer}
          events={displayedEvents}
          toolbar={false}
          date={date}
          view={view}
          onView={setView}
          onRangeChange={rangeChange}
          onNavigate={setDate}
          startAccessor="start"
          endAccessor="end"
          dayLayoutAlgorithm="overlap"
          showMultiDayTimes
          allDayMaxRows={2}
          titleAccessor="title"
          culture="fr"
          formats={{ agendaDateFormat: 'ddd D MMM', dayHeaderFormat: 'ddd D MMM', dayRangeHeaderFormat: ({ start, end }) => `${dayjs(start).format('D MMM')} - ${dayjs(end).format('D MMM')}` }}
          components={{ event: CalendarEventItem, agenda: { event: AgendaEventItem }, header: ({ label, date: headerDate }) => <CalendarDayHeader label={label} date={headerDate} isToday={dayjs(headerDate).isSame(dayjs(), 'day')} /> }}
          eventPropGetter={(event) => ({ className: `calendar-event-wrapper calendar-event-wrapper--${event.type ?? 'OTHER'}`, style: { '--event-color': event.color ?? '#64748b' } as React.CSSProperties })}
          onSelectEvent={setSelectedEvent}
          selectable
          onSelectSlot={selectEmptySlot}
          draggableAccessor={() => calendarUnlocked}
          resizableAccessor={() => calendarUnlocked}
          onEventDrop={({ event, start, end }) => { if (calendarUnlocked) void updateEventDates(event, new Date(start), new Date(end)); }}
          onEventResize={({ event, start, end }) => { if (calendarUnlocked) void updateEventDates(event, new Date(start), new Date(end)); }}
          scrollToTime={dayjs().startOf('day').hour(startHour).toDate()}
          min={dayjs().startOf('day').hour(startHour).toDate()}
          max={dayjs().startOf('day').hour(endHour).toDate()}
          style={{ height: 'clamp(560px, 72vh, 820px)' }}
        />}
        {empty && <div className="calendar-empty"><div className="calendar-empty__icon"><CalendarDays aria-hidden="true" /></div><h3>Aucun événement sur cette période</h3><p>Votre planning est libre. Ajoutez un rendez-vous ou une intervention pour commencer.</p><button type="button" onClick={() => setShowAddEventModal(true)}>Ajouter un événement</button></div>}
        {loading && <CalendarSkeleton />}
      </div>

      {showSettingsModal && <div className="calendar-modal-backdrop calendar-modal-backdrop--settings bg-slate-950/50 p-4" onClick={() => setShowSettingsModal(false)}><FocusTrap onEscape={() => setShowSettingsModal(false)}><CalendarSettings startHour={startHour} endHour={endHour} onClose={() => setShowSettingsModal(false)} onSave={saveSettings} /></FocusTrap></div>}
      {showDateSelector && <div className="calendar-modal-backdrop calendar-modal-backdrop--date-selector" onClick={() => setShowDateSelector(false)}><FocusTrap onEscape={() => setShowDateSelector(false)}><div onClick={(event) => event.stopPropagation()}><DateSelector date={date} view={view} onClose={() => setShowDateSelector(false)} onSelect={(selectedDate, selectedView) => { setDate(selectedDate); setView(selectedView); setShowDateSelector(false); }} /></div></FocusTrap></div>}
      {(showAddEventModal || editingEvent) && <div className="calendar-modal-backdrop" onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setPrefillRange(null); }}><FocusTrap onEscape={() => { setShowAddEventModal(false); setEditingEvent(null); setPrefillRange(null); }}><div role="dialog" aria-modal="true" aria-labelledby="add-calendar-event-title" tabIndex={-1} className="calendar-modal" onClick={(modalEvent) => modalEvent.stopPropagation()}><span id="add-calendar-event-title" className="sr-only">{editingEvent ? 'Modifier un événement' : 'Ajouter un événement'}</span><button type="button" aria-label="Fermer le formulaire événement" onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setPrefillRange(null); }} className="calendar-modal__close">×</button><AddCalendarEventForm key={editingEvent?.id ?? `${prefillRange?.start.getTime() ?? 'new'}`} event={editingEvent ?? undefined} initialStart={prefillRange?.start} initialEnd={prefillRange?.end} onCancel={() => { setShowAddEventModal(false); setEditingEvent(null); setPrefillRange(null); }} onCreated={(data) => { setCalendarEvents((current) => [toCalendarEvent(data), ...current]); setShowAddEventModal(false); setPrefillRange(null); }} onUpdated={(data) => { setCalendarEvents((current) => current.map((calendarEvent) => calendarEvent.id === data.id ? toCalendarEvent(data) : calendarEvent)); setEditingEvent(null); }} /></div></FocusTrap></div>}
      {selectedEvent && <div className="calendar-modal-backdrop calendar-modal-backdrop--details" onClick={() => setSelectedEvent(null)}><FocusTrap onEscape={() => setSelectedEvent(null)}><EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} onEdit={() => { setEditingEvent(selectedEvent); setSelectedEvent(null); }} /></FocusTrap></div>}
    </section>
  );
}
