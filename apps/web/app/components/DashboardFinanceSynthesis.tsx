'use client'

import Link from 'next/link'
import { ArrowDownToLine, ArrowUpRight, Landmark, WalletCards } from 'lucide-react'

function money(value: number, currency = 'EUR') { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value) }

type FinanceProps = { bankBalance: number; toCollect: number; toPay: number; activeMargin: number }

export default function DashboardFinanceSynthesis({ bankBalance, toCollect, toPay, activeMargin }: FinanceProps) {
  const cards = [
    { label: 'Solde bancaire', value: bankBalance, icon: Landmark, tone: 'text-sky-700 bg-sky-50' },
    { label: 'À encaisser', value: toCollect, icon: ArrowUpRight, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'À payer', value: toPay, icon: ArrowDownToLine, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Marge projets actifs', value: activeMargin, icon: WalletCards, tone: activeMargin >= 0 ? 'text-indigo-700 bg-indigo-50' : 'text-rose-700 bg-rose-50' },
  ]
  return <section className="mb-8" aria-labelledby="dashboard-finance-title"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Pilotage financier</p><h2 id="dashboard-finance-title" className="mt-1 text-lg font-semibold text-slate-900">Situation de l’entreprise</h2></div><Link href="/treasury" className="text-sm font-semibold text-indigo-700 hover:underline">Ouvrir la trésorerie</Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span><span className={`rounded-lg p-2 ${tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span></div><p className="mt-3 text-xl font-bold text-slate-900">{money(value)}</p></div>)}</div></section>
}
