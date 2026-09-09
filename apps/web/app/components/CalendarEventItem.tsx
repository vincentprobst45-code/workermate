'use client';

import { CalendarDays, FolderOpenDot, Hammer, MapPin, Package, Settings, UserRound } from 'lucide-react';
import type { CalendarEvent } from './calendar.types';

const eventMeta: Record<string, { label: string; icon: typeof CalendarDays; tone: string }> = {
  CUSTOMER_APPOINTMENT: { label: 'Client', icon: UserRound, tone: 'teal' },
  SITE_VISIT: { label: 'Visite', icon: MapPin, tone: 'cyan' },
  WORK: { label: 'Travaux', icon: Hammer, tone: 'indigo' },
  MAINTENANCE: { label: 'Maintenance', icon: Settings, tone: 'amber' },
  DELIVERY: { label: 'Livraison', icon: Package, tone: 'orange' },
  ADMINISTRATIVE: { label: 'Administratif', icon: CalendarDays, tone: 'slate' },
  ABSENCE: { label: 'Absence', icon: CalendarDays, tone: 'coral' },
  OTHER: { label: 'Autre', icon: CalendarDays, tone: 'slate' },
};

type CalendarEventItemProps = { event: CalendarEvent };

export default function CalendarEventItem({ event }: CalendarEventItemProps) {
  const meta = eventMeta[event.type ?? 'OTHER'] ?? eventMeta.OTHER;
  const TypeIcon = meta.icon;
  const address = event.addressName ?? [event.address?.street1, event.address?.postalCode, event.address?.city].filter(Boolean).join(', ');
  return (
    <div className={`calendar-event calendar-event--${meta.tone}`}>
      <div className="calendar-event__time">
        <span>{event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{event.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="calendar-event__content">
        <div className="calendar-event__title">{event.title}</div>
        {event.projectName && <div className="calendar-event__meta"><FolderOpenDot aria-hidden="true" /> <span>{event.projectName}</span></div>}
        {address && <div className="calendar-event__meta"><MapPin aria-hidden="true" /> <span>{address}</span></div>}
        {event.customerName && <div className="calendar-event__meta"><UserRound aria-hidden="true" /> <span>{event.customerName}</span></div>}
        {!event.projectName && !address && !event.customerName && <div className="calendar-event__meta"><TypeIcon aria-hidden="true" /> <span>{meta.label}</span></div>}
      </div>
    </div>
  );
}
