'use client'

import Link from 'next/link'
import { CalendarDays, ClipboardList } from 'lucide-react'

type TodayEvent = { id: string; title: string; startDate: string; projectId?: string | null; projectTitle?: string | null }
type TodayWorkOrder = { id: string; reference?: string; title?: string; projectId?: string | null; plannedStartDate?: string | null }

function timeLabel(value?: string | null) {
  if (!value) return 'Hora à préciser'
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardToday({ events, workOrders }: { events: TodayEvent[]; workOrders: TodayWorkOrder[] }) {
  const today = new Date()
  const isToday = (value?: string | null) => value ? new Date(value).toDateString() === today.toDateString() : false
  const todayEvents = events.filter((event) => isToday(event.startDate)).slice(0, 4)
  const todayWorkOrders = workOrders.filter((workOrder) => isToday(workOrder.plannedStartDate)).slice(0, 4)

  return <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="dashboard-today-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Organisation</p><h2 id="dashboard-today-title" className="mt-1 text-lg font-semibold text-slate-900">Aujourd’hui</h2><p className="mt-1 text-sm text-slate-500">{today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div><Link href="/planning" className="text-sm font-semibold text-indigo-700 hover:underline">Ouvrir le planning</Link></div><div className="mt-4 grid gap-5 lg:grid-cols-2"><div><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays className="h-4 w-4 text-indigo-600" aria-hidden="true" />Rendez-vous et événements</h3>{todayEvents.length ? <div className="mt-2 divide-y divide-slate-100">{todayEvents.map((event) => <Link key={event.id} href="/planning" className="flex gap-3 py-3 hover:bg-slate-50"><span className="w-12 shrink-0 text-sm font-semibold text-indigo-700">{timeLabel(event.startDate)}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{event.title}</span><span className="text-xs text-slate-500">{event.projectTitle || 'Événement général'}</span></span></Link>)}</div> : <p className="mt-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">Aucun événement prévu aujourd’hui.</p>}</div><div><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ClipboardList className="h-4 w-4 text-amber-600" aria-hidden="true" />Chantiers prévus</h3>{todayWorkOrders.length ? <div className="mt-2 divide-y divide-slate-100">{todayWorkOrders.map((workOrder) => <Link key={workOrder.id} href={`/workorders?workOrder=${workOrder.id}`} className="flex gap-3 py-3 hover:bg-slate-50"><span className="w-12 shrink-0 text-sm font-semibold text-amber-700">{timeLabel(workOrder.plannedStartDate)}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{workOrder.reference || workOrder.title || 'Chantier'}</span><span className="text-xs text-slate-500">{workOrder.projectId ? 'Rattaché à un projet' : 'Sans projet'}</span></span></Link>)}</div> : <p className="mt-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">Aucun chantier planifié aujourd’hui.</p>}</div></div></section>
}
