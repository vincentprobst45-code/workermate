'use client'
import Link from 'next/link'
import { useAuth } from '../auth.context'
import { useEffect, useState } from 'react'
import type { TenantMembership } from '../lib/auth.types'

function Header(){
  const { user, activeTenant, tenants, switchTenant } = useAuth()
  const [membershipTenants, setMembershipTenants] = useState<TenantMembership[]>(tenants)
  const [openDropdown, setOpenDropdown] = useState(false)
  const [tenantError, setTenantError] = useState('')

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false
    void fetch('http://localhost:4000/memberships/me', {
      credentials: 'include',
      cache: 'no-store',
    }).then(async (response) => {
      if (!response.ok) throw new Error('Impossible de récupérer les entreprises.')
      const data = await response.json() as TenantMembership[]
      if (!cancelled) setMembershipTenants(data)
    }).catch((error: unknown) => {
      if (!cancelled) setTenantError(error instanceof Error ? error.message : 'Impossible de récupérer les entreprises.')
    })

    return () => { cancelled = true }
  }, [user])

  const handleLogout = async () => {
    await fetch('http://localhost:4000/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })
    window.location.assign('/')
  }

  async function handleTenantChange(tenantId: string) {
    setTenantError('')
    try {
      await switchTenant(tenantId)
      setOpenDropdown(false)
    } catch (error) {
      setTenantError(error instanceof Error ? error.message : 'Impossible de changer d’entreprise.')
    }
  }
  console.log("header")
  console.log(user)

    return(
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm py-2 px-5 shadow-sm shadow-slate-200/20 sm:px-6">
        <div className="mx-auto flex items-center justify-between gap-4">
          <Link href="/">
              <div>
                  <h1 className="text-xl font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Workermate
                  </h1>
              </div>
          </Link>
          
          <nav>
            <Link className='px-2' href="/tenant">Entreprise</Link>
            <Link className='px-2' href="/customers">Clients</Link>
            <Link className='px-2' href="/catalogitem">Catalogue</Link>
            <Link className='px-2' href="/projects">Projets</Link>
            <Link className='px-2' href="/quotes">Devis</Link>
            <Link className='px-2' href="/workorders">Chantiers</Link>
            <Link className='px-2' href="/invoices">Factures</Link>
          </nav>

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
                    <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                      <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Mes entreprises</p>
                      {membershipTenants.map((tenant) => (
                        <button
                          key={tenant.tenantId}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${activeTenant?.tenantId === tenant.tenantId ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                          onClick={() => void handleTenantChange(tenant.tenantId)}
                        >
                          <span>{tenant.tenantName}</span>
                          <span className="ml-2 text-xs opacity-75">{tenant.role}</span>
                        </button>
                      ))}
                      {!membershipTenants.length && <p className="px-3 py-2 text-sm text-slate-600">Aucune entreprise.</p>}
                      {tenantError && <p className="px-2 py-2 text-xs text-red-600">{tenantError}</p>}
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