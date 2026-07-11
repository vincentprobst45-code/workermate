'use client'
 
import { useNextCalendarApp, ScheduleXCalendar } from '@schedule-x/react'
import {
  createViewDay,
  createViewWeekAgenda,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { translations, mergeLocales } from '@schedule-x/translations'
import 'temporal-polyfill/global'
import '@schedule-x/theme-default/dist/index.css'
import { useEffect,useState } from "react";
 
function CalendarApp() {
  const eventsService = useState(() => createEventsServicePlugin())[0]
 
  const calendar = useNextCalendarApp({
    
    views: [createViewDay(), createViewWeekAgenda(), createViewWeek(), createViewMonthGrid(), createViewMonthAgenda()],
    events: [
      {
        id: '1',
        title: 'Event 1',
        start: Temporal.PlainDate.from('2026-07-11'),
        end: Temporal.PlainDate.from('2026-07-11'),
      },
        {
            id: 2,
            title: 'Event 2',
            // start: Temporal.ZonedDateTime.from('2026-07-11T12:00:00Z'),
            // end: Temporal.ZonedDateTime.from('2026-07-11T13:00:00Z'),
            start: Temporal.ZonedDateTime.from('2026-07-11T12:00:00[Europe/Berlin]'),
            end: Temporal.ZonedDateTime.from('2026-07-11T13:00:00[Europe/Berlin]'),
        },
        {
            id: 3,
            title: 'Event 3',
            // start: Temporal.ZonedDateTime.from('2026-07-11T12:00:00Z'),
            // end: Temporal.ZonedDateTime.from('2026-07-11T13:00:00Z'),
            start: Temporal.ZonedDateTime.from('2026-07-11T11:00:00[Europe/Berlin]'),
            end: Temporal.ZonedDateTime.from('2026-07-11T14:00:00[Europe/Berlin]'),
        },
        {
            id: 4,
            title: 'Event 3',
            // start: Temporal.ZonedDateTime.from('2026-07-11T12:00:00Z'),
            // end: Temporal.ZonedDateTime.from('2026-07-11T13:00:00Z'),
            start: Temporal.ZonedDateTime.from('2026-07-11T10:00:00[Europe/Berlin]'),
            end: Temporal.ZonedDateTime.from('2026-07-11T16:00:00[Europe/Berlin]'),
        }
    ],
    plugins: [eventsService],
    translations: mergeLocales (
    translations,
    {
      frFR: {
        'Week': '4 days'
      }
    }
  ),

    callbacks: {
      onRender: () => {
        // get all events
        eventsService.getAll()
      }
    }
  })
 
  return (
    <div>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  )
}
 
export default CalendarApp
