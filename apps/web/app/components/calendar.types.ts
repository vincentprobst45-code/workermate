import type { View } from 'react-big-calendar';

export type CalendarEventType =
  | 'CUSTOMER_APPOINTMENT'
  | 'SITE_VISIT'
  | 'WORK'
  | 'MAINTENANCE'
  | 'DELIVERY'
  | 'ADMINISTRATIVE'
  | 'ABSENCE'
  | 'OTHER';

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  type?: CalendarEventType | string;
  description?: string;
  notes?: string;
  customerName?: string;
  projectName?: string;
  addressName?: string;
  createdByName?: string;
};

export type CalendarEventApi = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color?: string;
  type?: CalendarEventType | string;
  description?: string;
  notes?: string;
  customerName?: string;
  projectName?: string;
  addressName?: string;
  createdByName?: string;
  customer?: { firstName?: string | null; lastName?: string | null; company?: string | null } | null;
  project?: { title?: string | null } | null;
  address?: { street1?: string | null; postalCode?: string | null; city?: string | null } | null;
  createdBy?: { firstname?: string | null; lastname?: string | null; email?: string | null } | null;
};

export type CalendarRange = { start: Date; end: Date };
export type CalendarView = View;
