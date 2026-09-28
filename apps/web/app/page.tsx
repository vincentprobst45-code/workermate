'use client'
import Link from 'next/link'
import { useAuth } from './auth.context'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, FolderPlus, UserRoundPlus } from 'lucide-react'
import { useApiClient } from './api-client'
import BigCalendar from './components/BigCalendar'
import DashboardCards from './components/DashboardCards'
import DashboardToday from './components/DashboardToday'
import DashboardTodoList from './components/DashboardTodoList'
import DashboardFinanceSynthesis from './components/DashboardFinanceSynthesis'
import DashboardProjectsHealth from './components/DashboardProjectsHealth'
import type { ProjectProfitability } from './components/project-profitability.types'

type HomeCalendarEvent = { id: string; title: string; startDate: string; projectId?: string | null; projectTitle?: string | null };

type HomeData = {
  customers: unknown[];
  projects: HomeProject[];
  workOrders: HomeWorkOrder[];
  quotes: HomeQuote[];
  invoices: HomeInvoice[];
};

type HomeProject = {
  id: string;
  reference?: string;
  title?: string;
  status?: string;
  customers?: unknown[];
  _count?: { quotes?: number; workOrders?: number; invoices?: number; calendarEvents?: number };
};

type HomeWorkOrder = { id: string; reference?: string; title?: string; status?: string; projectId?: string | null; plannedStartDate?: string | null };
type HomeQuote = { id: string; number?: string; title?: string; status?: string; projectId?: string | null };
type HomeInvoice = { id: string; number?: string; status?: string; paymentStatus?: string; projectId?: string | null; dueDate?: string | null; amountDue?: number | string; taxInclusiveAmount?: number | string };
type FinanceAccount = { id: string; currency?: string; openingBalance?: number | string; openingBalanceDate?: string | null; archivedAt?: string | null };
type FinanceTransaction = { paymentAccountId: string; amount?: number | string; direction: string; transactionDate: string };
type FinanceExpense = { taxInclusiveAmount?: number | string; paidAt?: string | null; dueDate?: string };

const pendingQuoteStatuses = new Set(['DRAFT', 'SENT', 'PENDING']);

export default function Home() {
  const { activeTenant, user } = useAuth()
  const [showStandaloneMenu, setShowStandaloneMenu] = useState(false)
  const standaloneMenuRef = useRef<HTMLDivElement>(null)
  const api = useApiClient()
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', activeTenant?.tenantId],
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const [customersResponse, projectsResponse, workOrdersResponse, quotesResponse, invoicesResponse, eventsResponse] = await Promise.all([
        api.get('/customers'),
        api.get('/projects'),
        api.get('/workOrders'),
        api.get('/quotes'),
        api.get('/invoices'),
        api.get(`/calendarevents?start=${encodeURIComponent(new Date().toISOString())}`),
      ])
      const collectionResponses = [customersResponse, projectsResponse, workOrdersResponse, quotesResponse, invoicesResponse]
      if (collectionResponses.some((response) => !response.ok)) {
        throw new Error('Impossible de charger les indicateurs d’activité. Réessayez dans un instant.')
      }
      if (!eventsResponse.ok) {
        throw new Error('Impossible de charger les événements du jour.')
      }
      const [customers, projects, workOrders, quotes, invoices] = await Promise.all(collectionResponses.map((response) => response.json()))
      return {
        homeData: { customers, projects, workOrders, quotes, invoices } as HomeData,
        calendarEvents: await eventsResponse.json() as HomeCalendarEvent[],
      }
    },
  })
  const financeQuery = useQuery({
    queryKey: ['dashboard-finance', activeTenant?.tenantId],
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const responses = await Promise.all([
        api.get('/projects/profitability'),
        api.get('/payment-accounts'),
        api.get('/bank-transactions'),
        api.get('/company-expenses'),
      ])
      if (responses.some((response) => !response.ok)) {
        throw new Error('Impossible de charger la synthèse financière.')
      }
      return {
        profitabilityProjects: await responses[0].json() as ProjectProfitability[],
        financeAccounts: await responses[1].json() as FinanceAccount[],
        financeTransactions: await responses[2].json() as FinanceTransaction[],
        financeExpenses: await responses[3].json() as FinanceExpense[],
      }
    },
  })
  const homeData = dashboardQuery.data?.homeData ?? null
  const calendarEvents = dashboardQuery.data?.calendarEvents ?? []
  const profitabilityProjects = financeQuery.data?.profitabilityProjects ?? []
  const financeAccounts = financeQuery.data?.financeAccounts ?? []
  const financeTransactions = financeQuery.data?.financeTransactions ?? []
  const financeExpenses = financeQuery.data?.financeExpenses ?? []
  const loading = dashboardQuery.isPending
  const financeLoading = financeQuery.isPending
  const error = dashboardQuery.error?.message || financeQuery.error?.message || ''

  useEffect(() => {
    if (!showStandaloneMenu) return undefined
    function handleClickOutside(event: MouseEvent) {
      if (standaloneMenuRef.current && !standaloneMenuRef.current.contains(event.target as Node)) setShowStandaloneMenu(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowStandaloneMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showStandaloneMenu])

  const projectIdsWithNextAction = new Set(calendarEvents.map((event) => event.projectId).filter(Boolean))
  const recentProjects = homeData?.projects.slice(0, 5) || []
  const projectItems = {
    recent: recentProjects.map((project) => ({ id: project.id, label: projectTitle(project), detail: `${project._count?.quotes || 0} devis · ${project._count?.workOrders || 0} chantiers`, href: `/projects?project=${project.id}` })),
    active: homeData?.projects.filter((project) => ['OPEN', 'IN_PROGRESS'].includes(project.status || '')).map((project) => ({ id: project.id, label: projectTitle(project), detail: project.status === 'IN_PROGRESS' ? 'En cours' : 'Ouvert', href: `/projects?project=${project.id}` })) || [],
    nextAction: homeData?.projects.filter((project) => projectIdsWithNextAction.has(project.id)).map((project) => ({ id: project.id, label: projectTitle(project), detail: 'Action planifiée', href: `/projects?project=${project.id}` })) || [],
    incomplete: homeData?.projects.filter((project) => !project.customers?.length || !(project._count?.quotes || project._count?.workOrders || project._count?.invoices)).map((project) => ({ id: project.id, label: projectTitle(project), detail: !project.customers?.length ? 'Client manquant' : 'Éléments à structurer', href: `/projects?project=${project.id}` })) || [],
  }
  const dashboardTodos = [
    ...((homeData?.quotes.filter((quote) => pendingQuoteStatuses.has(quote.status || '')).slice(0, 2) || []).map((quote) => ({ id: `quote-${quote.id}`, label: `Relancer le devis ${quote.number || quote.title || ''}`.trim(), detail: quote.projectId ? 'Devis rattaché à un projet' : 'Devis sans projet', href: `/quotes?quote=${quote.id}`, priority: 'normal' as const }))),
    ...((homeData?.invoices.filter((invoice) => invoice.status !== 'CANCELLED' && (invoice.paymentStatus === 'PARTIALLY_PAID' || invoice.paymentStatus === 'UNPAID')).slice(0, 2) || []).map((invoice) => ({ id: `invoice-${invoice.id}`, label: `Suivre la facture ${invoice.number || ''}`.trim(), detail: invoice.dueDate && new Date(invoice.dueDate) < new Date() ? 'Échéance dépassée' : 'Paiement en attente', href: `/invoices?invoice=${invoice.id}`, priority: invoice.dueDate && new Date(invoice.dueDate) < new Date() ? 'high' as const : 'normal' as const }))),
    ...projectItems.incomplete.slice(0, 2).map((project) => ({ id: `project-${project.id}`, label: `Compléter ${project.label}`, detail: project.detail, href: project.href, priority: 'normal' as const })),
  ]
  const bankBalance = financeAccounts.filter((account) => !account.archivedAt).reduce((total, account) => total + Number(account.openingBalance || 0) + financeTransactions.filter((transaction) => transaction.paymentAccountId === account.id).reduce((sum, transaction) => sum + (transaction.direction === 'DEBIT' ? -1 : 1) * Number(transaction.amount || 0), 0), 0)
  const toPay = financeExpenses.filter((expense) => !expense.paidAt).reduce((total, expense) => total + Number(expense.taxInclusiveAmount || 0), 0)
  const toCollect = homeData?.invoices.filter((invoice) => invoice.status !== 'CANCELLED' && invoice.paymentStatus !== 'PAID').reduce((total, invoice) => total + Number(invoice.amountDue ?? invoice.taxInclusiveAmount ?? 0), 0) || 0
  const activeMargin = profitabilityProjects.filter(({ project }) => ['OPEN', 'IN_PROGRESS'].includes(project.status)).reduce((total, project) => total + project.summary.realizedMargin, 0)
  const isNewAccount = !loading && !error && homeData !== null && homeData.customers.length === 0 && homeData.projects.length === 0
  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Tableau de bord</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div><h1 className="text-2xl font-bold text-slate-900">{greeting} {user?.firstname || user?.email || 'à vous'}</h1><p className="mt-1 text-sm text-slate-600">Vue d’ensemble de <strong>{activeTenant?.tenantName || 'votre entreprise'}</strong></p></div>
            {activeTenant && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Entreprise active</span>}
          </div>
        </section>

        <section aria-labelledby="quick-actions-title" className="mb-6">
          <div className="mb-3 flex items-center justify-between"><h2 id="quick-actions-title" className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Actions rapides</h2></div>
          <div className="flex flex-wrap gap-3"><Link href="/projects?create=project" className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Nouveau projet</Link><Link href="/projects" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voir les projets</Link><div ref={standaloneMenuRef} className="relative"><button type="button" aria-expanded={showStandaloneMenu} onClick={() => setShowStandaloneMenu((current) => !current)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">+ Créer sans projet</button>{showStandaloneMenu && <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl" role="menu"><p className="px-3 py-2 text-xs text-slate-500">Créer un élément autonome</p><StandaloneAction href="/customers" label="Un client" /><StandaloneAction href="/workorders" label="Un chantier" /><StandaloneAction href="/quotes" label="Un devis" /><StandaloneAction href="/invoices" label="Une facture" /><StandaloneAction href="/planning" label="Un événement" /></div>}</div></div>
        </section>

        {error && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" className="font-semibold underline" onClick={() => { void Promise.all([dashboardQuery.refetch(), financeQuery.refetch()]) }}>Réessayer</button></div>}

        {isNewAccount ? (
          <WelcomeOnboarding businessName={activeTenant?.tenantName || 'votre entreprise'} />
        ) : (
          <>
            {loading ? (
              <div className="mb-8 space-y-4">
                <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" aria-label="Chargement de l’activité du jour" />
                <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />
                <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
              </div>
            ) : (
              <>
                <DashboardToday events={calendarEvents} workOrders={homeData?.workOrders || []} />
                <DashboardTodoList items={dashboardTodos} />
                <DashboardCards projects={projectItems} workOrders={{ active: homeData?.workOrders.filter((workOrder) => ['PLANNED', 'IN_PROGRESS'].includes(workOrder.status || '')).map((workOrder) => ({ id: workOrder.id, label: workOrder.reference || workOrder.title || 'Chantier', detail: workOrder.projectId ? 'Rattaché à un projet' : 'Sans projet', href: `/workorders?workOrder=${workOrder.id}` })) || [] }} quotes={{ pending: homeData?.quotes.filter((quote) => pendingQuoteStatuses.has(quote.status || '')).map((quote) => ({ id: quote.id, label: quote.number || quote.title || 'Devis', detail: quote.projectId ? 'Rattaché à un projet' : 'Sans projet', href: `/quotes?quote=${quote.id}` })) || [] }} invoices={{ actionable: homeData?.invoices.filter((invoice) => invoice.status !== 'CANCELLED' && (invoice.paymentStatus === 'PARTIALLY_PAID' || invoice.paymentStatus === 'UNPAID' || invoice.status === 'DRAFT')).map((invoice) => ({ id: invoice.id, label: invoice.number || 'Facture', detail: invoice.projectId ? 'Rattachée à un projet' : 'Sans projet', href: `/invoices?invoice=${invoice.id}` })) || [] }} />
              </>
            )}
            {financeLoading ? (
              <div className="mb-8 space-y-4">
                <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" aria-label="Chargement de la trésorerie" />
                <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
              </div>
            ) : (
              <>
                <DashboardFinanceSynthesis bankBalance={bankBalance} toCollect={toCollect} toPay={toPay} activeMargin={activeMargin} />
                <DashboardProjectsHealth projects={profitabilityProjects} />
              </>
            )}
          </>
        )}
        <section className="mt-8" aria-labelledby="dashboard-calendar-title">
          <h2 id="dashboard-calendar-title" className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Calendrier</h2>
          <BigCalendar />
        </section>

      </main>
    </div>
  );
}

function projectTitle(project: HomeProject) {
  return [project.reference, project.title].filter(Boolean).join(' — ') || 'Projet sans nom';
}

function StandaloneAction({ href, label }: { href: string; label: string }) {
  return <Link href={href} role="menuitem" className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Créer {label}</Link>;
}

function WelcomeOnboarding({ businessName }: { businessName: string }) {
  const steps = [
    { icon: Building2, title: 'Configurer votre entreprise', description: 'Coordonnées, TVA et numérotation des devis/factures.', href: '/tenant', cta: 'Configurer' },
    { icon: UserRoundPlus, title: 'Ajouter votre premier client', description: 'Enregistrez les coordonnées de vos contacts.', href: '/customers', cta: 'Ajouter un client' },
    { icon: FolderPlus, title: 'Créer votre premier projet', description: 'Regroupez devis, chantiers et factures au même endroit.', href: '/projects?create=project', cta: 'Créer un projet' },
  ];
  return (
    <section className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-sm sm:p-8" aria-labelledby="welcome-onboarding-title">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Premiers pas</p>
      <h2 id="welcome-onboarding-title" className="mt-2 text-xl font-bold text-slate-900">Bienvenue chez {businessName}</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">Votre espace est prêt. Suivez ces quelques étapes pour démarrer votre première affaire.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <Link key={step.title} href={step.href} className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><step.icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="mt-3 text-xs font-semibold text-indigo-700">Étape {index + 1}</span>
            <span className="mt-1 text-sm font-semibold text-slate-900">{step.title}</span>
            <span className="mt-1 text-xs text-slate-500">{step.description}</span>
            <span className="mt-3 text-xs font-semibold text-indigo-700 group-hover:underline">{step.cta} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
