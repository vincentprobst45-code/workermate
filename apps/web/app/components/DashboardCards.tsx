'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type DashboardItem = { id: string; label: string; detail: string; href: string }
type DashboardCardsProps = {
  projects: { recent: DashboardItem[]; active: DashboardItem[]; nextAction: DashboardItem[]; incomplete: DashboardItem[] }
  workOrders: { active: DashboardItem[] }
  quotes: { pending: DashboardItem[] }
  invoices: { actionable: DashboardItem[] }
}

type Tab = 'projects' | 'workOrders' | 'quotes' | 'invoices'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'projects', label: 'Projets' },
  { id: 'workOrders', label: 'Chantiers' },
  { id: 'quotes', label: 'Devis' },
  { id: 'invoices', label: 'Factures' },
]

export default function DashboardCards({ projects, workOrders, quotes, invoices }: DashboardCardsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('projects')
  const [projectFilter, setProjectFilter] = useState('recent')

  const projectViews = {
    recent: { label: 'Récents', items: projects.recent },
    active: { label: 'En cours', items: projects.active },
    nextAction: { label: 'Prochaine action', items: projects.nextAction },
    incomplete: { label: 'Incomplets', items: projects.incomplete },
  }
  const view = activeTab === 'projects'
    ? projectViews[projectFilter as keyof typeof projectViews]
    : activeTab === 'workOrders'
      ? { label: 'Actifs', items: workOrders.active }
      : activeTab === 'quotes'
        ? { label: 'À traiter', items: quotes.pending }
        : { label: 'À traiter', items: invoices.actionable }

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="dashboard-cards-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Activité</p>
          <h2 id="dashboard-cards-title" className="mt-1 text-lg font-semibold text-slate-900">Vue opérationnelle</h2>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Activité par domaine">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {activeTab === 'projects' && <><label htmlFor="dashboard-project-filter" className="sr-only">Filtrer les projets</label><select id="dashboard-project-filter" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><option value="recent">Récents</option><option value="active">En cours</option><option value="nextAction">Prochaine action</option><option value="incomplete">Incomplets</option></select></>}
          {activeTab !== 'projects' && <span>{view.label}</span>}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{view.items.length}</span>
        </div>
        <Link href={activeTab === 'projects' ? '/projects' : activeTab === 'workOrders' ? '/workorders' : activeTab === 'quotes' ? '/quotes' : '/invoices'} className="text-xs font-semibold text-indigo-700 hover:underline">Tout afficher</Link>
      </div>
      {view.items.length ? <div className="mt-2 divide-y divide-slate-100">{view.items.slice(0, 5).map((item) => <Link key={item.id} href={item.href} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{item.label}</span><span className="block truncate text-xs text-slate-500">{item.detail}</span></span><ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-indigo-500" aria-hidden="true" /></Link>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Aucun élément dans cette vue.</p>}
    </section>
  )
}
