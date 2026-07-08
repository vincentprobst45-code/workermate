'use client'
import { useAuth } from './auth.context'
import { useState } from 'react'

export default function Home() {
  const { user, activeTenant } = useAuth()
  const [openDropdown, setOpenDropdown] = useState(false)

  const handleLogout = async () => {
    await fetch('http://localhost:4000/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })
    window.location.assign('/')
  }
  console.log(user)

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
                    <span className="ml-2 inline-block">▼</span>
                  </button>
                  
                  {openDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                      <p className="px-4 py-2 text-sm text-slate-600">
                        Changement de tenant bientôt disponible.
                      </p>
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

          <a href="/projects" className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Chantiers</p>
                <p className="mt-2 text-sm text-slate-600">
                  Crée et suis tes projets.
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
      </main>
    </div>
  );
}
