'use client'
import Link from 'next/link'
import { useAuth } from '../auth.context'
import { useState } from 'react'

function Header(){
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
  console.log("header")
  console.log(user)

    return(
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm py-5 px-5 shadow-sm shadow-slate-200/20 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link href="/">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Workermate
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                      Planning et gestion pour artisans
                    </h1>
                </div>
            </Link>

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
      )

}
export default Header