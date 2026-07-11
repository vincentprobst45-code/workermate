"use client"
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import localeData from 'dayjs/plugin/localeData'

import 'dayjs/locale/fr'
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useApiClient } from '../api-client';
import { useEffect, useState } from 'react'

dayjs.extend(localizedFormat)
dayjs.extend(localeData)

dayjs.locale('fr')

const localizer = dayjsLocalizer(dayjs)
// const myEventsList = [
//     {
//         title: "event 1",
//         start: new Date('2026-07-11T12:00:00.000Z'),
//         end: new Date('2026-07-11T13:00:00.000Z'),
//     }
// ]

interface CalendarEvent {
  id: string;
  firstname: string;
  lastname?: string;
  company?: string;
  createdAt: string;
}

function BigCalendar() {
  const api = useApiClient();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
    const scrollTo = new Date()
    scrollTo.setHours(7, 0, 0, 0)
    const myEventsList = calendarEvents ? calendarEvents : [
      {
        title: 'event',
        start: new Date(2026, 6, 11, 12, 0),
        end: new Date(2026, 6, 11, 13, 0),
      },
    ]
      useEffect(() => {
        let cancelled = false;
    
        const loadCalendarEvents = async () => {
          try {
            const res = await api.get('/calendarEvents');
            if (!res.ok) throw new Error('Erreur');
            const data = await res.json();
            if (!cancelled) {
              setCalendarEvents(data);
            }
          } catch {
            if (!cancelled) {
              setError('Erreur lors de la récupération des événements');
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        };
    
        void loadCalendarEvents();
    
        return () => {
          cancelled = true;
        };
      }, [api]);

    return(
        <div className='py-8 my-8'>
        {loading ? (
          <p>Chargement du planning...</p>
        ) : (
            <div>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
              <Calendar
                localizer={localizer}
                events={myEventsList}
                defaultView="week"
                startAccessor="start"
                endAccessor="end"
                style={{ height: 800 }}
                scrollToTime={scrollTo}
              />
          </div>
        )}
          {/* <Calendar
  localizer={localizer}
  events={myEventsList}
  defaultView="week"
  defaultDate={new Date(2026, 6, 11)}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 600 }}
/> */}
        </div>
)
}
export default BigCalendar