'use client'
import { useAuth } from './auth.context'
import { useEffect, useState } from 'react'
import { useApiClient } from './api-client'
import BigCalendar from './components/BigCalendar'
import MiniAgenda, { type MiniAgendaCalendarEvent } from './components/miniAgenda'

type HomeCalendarEvent = MiniAgendaCalendarEvent;

export default function Home() {
  const { activeTenant } = useAuth()
  const [calendarEvents, setCalendarEvents] = useState<HomeCalendarEvent[]>([])
  const api = useApiClient()

  useEffect(() => {
    let cancelled = false

    async function loadUpcomingEvents() {
      const response = await api.get(`/calendarevents?start=${encodeURIComponent(new Date().toISOString())}`)
      if (!response.ok || cancelled) {
        return
      }

      const events = await response.json() as HomeCalendarEvent[]
      setCalendarEvents(events)
    }

    void loadUpcomingEvents().catch(() => {
      if (!cancelled) {
        setCalendarEvents([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [api, activeTenant?.tenantId])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <MiniAgenda calendarEvents={calendarEvents} />

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <a href="/customers" className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Clients</p>
                <p className="mt-2 text-sm text-slate-600">
                  Gère tes contacts et historiques.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700">
                Gérer →
              </div>
            </div>
          </a>

          <a href="/workorders" className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Chantiers</p>
                <p className="mt-2 text-sm text-slate-600">
                  Crée et suis tes chantiers.
                </p>
              </div>
              <div className="rounded-2xl bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700">
                Gérer →
              </div>
            </div>
          </a>

          <a href="/invoices" className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Factures</p>
                <p className="mt-2 text-sm text-slate-600">
                  Gère tes factures et devis.
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-100 px-3 py-2 text-xs font-medium text-indigo-700">
                Gérer →
              </div>
            </div>
          </a>
        </section>
        <BigCalendar />
      </main>
    </div>
  );
}
