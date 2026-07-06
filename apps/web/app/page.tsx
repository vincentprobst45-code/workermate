'use client'
import { useAuth } from './auth.context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const { user, tenants, activeTenant, logout, switchTenant } = useAuth()
  const router = useRouter()
  const [openDropdown, setOpenDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm py-5 px-5 shadow-sm shadow-slate-200/20 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Workermate
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Planning et gestion pour artisans
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(!openDropdown)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
                  >
                    {activeTenant?.tenantName || 'Sélectionner'}
                    {tenants.length > 1 && (
                      <span className="ml-2 inline-block">▼</span>
                    )}
                  </button>
                  
                  {openDropdown && tenants.length > 1 && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                      {tenants.map((tenant) => (
                        <button
                          key={tenant.tenantId}
                          onClick={() => {
                            switchTenant(tenant.tenantId)
                            setOpenDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-slate-100 transition text-sm ${
                            activeTenant?.tenantId === tenant.tenantId
                              ? 'bg-slate-100 font-medium text-slate-900'
                              : 'text-slate-600'
                          }`}
                        >
                          {tenant.tenantName}
                          {tenant.role && (
                            <span className="ml-2 text-xs text-slate-500">({tenant.role})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-sm font-medium text-slate-700">
                  {user.firstname} {user.lastname}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Se Déconnecter
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Se connecter
                </a>
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Inscription
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-xl shadow-slate-800/20 sm:p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-300">
              Page de démarrage
            </p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Un espace simple pour gérer vos chantiers, clients et devis.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Retrouvez votre planning du jour, consultez vos clients, créez un devis ou une facture et suivez vos chantiers avec photos avant/après.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Planning</p>
                <p className="mt-2 text-sm text-slate-600">
                  Visualise ta semaine, tes rendez-vous et tes plages de disponibilité.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                Priorité
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-medium text-slate-900">Lundi</p>
                <p className="text-slate-500">3 chantiers programmés</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-medium text-slate-900">Mardi</p>
                <p className="text-slate-500">2 visites clients</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Clients</p>
                <p className="mt-2 text-sm text-slate-600">
                  Accède rapidement à tes contacts, adresses et historiques d’interventions.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700">
                +120
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-medium text-slate-900">M. Dupont</p>
                <p className="text-slate-500">Cuisine, intervention prévue mercredi</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-medium text-slate-900">SARL Plomberie 75</p>
                <p className="text-slate-500">A reçu un devis le mois dernier</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Devis & Factures</p>
                <p className="mt-2 text-sm text-slate-600">
                  Crée, modifie et envoie tes documents clients par mail en quelques clics.
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-100 px-3 py-2 text-xs font-medium text-indigo-700">
                7 documents
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-medium text-slate-900">Devis chantier A</p>
                <p className="text-slate-500">En attente d’accord client</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-medium text-slate-900">Facture chantier B</p>
                <p className="text-slate-500">Envoyée, paiement en attente</p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Chantiers</p>
              <p className="mt-2 text-sm text-slate-600">
                Suis l’état des chantiers et ajoute des photos avant/après pour chaque intervention.
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Voir les chantiers
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Chantier logement</p>
              <p className="mt-2 text-sm text-slate-600">Installation de chaudière + photos pré et post intervention.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Réfection salle de bain</p>
              <p className="mt-2 text-sm text-slate-600">Suivi du chantier et ajout des photos à chaque étape.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
