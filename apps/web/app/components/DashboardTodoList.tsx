'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'

type TodoItem = { id: string; label: string; detail: string; href: string; priority?: 'high' | 'normal' }

export default function DashboardTodoList({ items }: { items: TodoItem[] }) {
  return <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="dashboard-todo-title"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Décisions</p><h2 id="dashboard-todo-title" className="mt-1 text-lg font-semibold text-slate-900">À traiter</h2></div><span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">{items.length} action{items.length !== 1 ? 's' : ''}</span></div>{items.length ? <div className="mt-4 divide-y divide-slate-100">{items.map((item) => <Link key={item.id} href={item.href} className="flex items-center gap-3 py-3 hover:bg-slate-50"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{item.priority === 'high' ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-800">{item.label}</span><span className="block text-xs text-slate-500">{item.detail}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" /></Link>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">Tout est à jour pour le moment.</p>}</section>
}
