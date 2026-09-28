'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, Building2, ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { useAuth } from '../auth.context';
import type { TenantMembership } from '../lib/auth.types';
import NotificationsHeaderList from './NotificationsHeaderList';

export default function Header({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { user, activeTenant, tenants, switchTenant } = useAuth();
  const [membershipTenants, setMembershipTenants] = useState<TenantMembership[]>(tenants);
  const [openMenu, setOpenMenu] = useState<'tenant' | 'notifications' | 'user' | null>(null);
  const [tenantError, setTenantError] = useState('');
  const [tenantLoading, setTenantLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetch('http://localhost:4000/memberships/me', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Impossible de récupérer les entreprises.');
        const data = await response.json() as TenantMembership[];
        if (!cancelled) setMembershipTenants(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setTenantError(error instanceof Error ? error.message : 'Impossible de récupérer les entreprises.');
      });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenu(null);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenu(null);
    }
    document.addEventListener('mousedown', closeMenus);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenus);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  async function handleLogout() {
    await fetch('http://localhost:4000/auth/logout', { method: 'POST', credentials: 'include', cache: 'no-store' });
    window.location.assign('/');
  }

  async function handleTenantChange(tenantId: string) {
    setTenantError('');
    setTenantLoading(true);
    try {
      await switchTenant(tenantId, membershipTenants);
      setOpenMenu(null);
    } catch (error) {
      setTenantError(error instanceof Error ? error.message : 'Impossible de changer d’entreprise.');
    } finally {
      setTenantLoading(false);
    }
  }

  const displayName = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.email || '';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm shadow-slate-200/30 backdrop-blur-sm sm:px-5">
      <div ref={menuRef} className="mx-auto flex min-h-11 items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-1">
          {user && <button type="button" aria-label="Ouvrir le menu de navigation" onClick={onOpenMenu} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2 md:hidden"><Menu className="h-5 w-5" aria-hidden="true" /></button>}
          <Link href="/" aria-label="Workermate, accueil" className="shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"><span className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700 sm:text-xl sm:tracking-[0.2em]">Workermate</span></Link>
        </div>
        {user ? <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <div className="relative"><button type="button" aria-expanded={openMenu === 'notifications'} aria-label={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`} title="Notifications" onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')} className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"><Bell className="h-5 w-5" aria-hidden="true" />{unreadCount > 0 && <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-4 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button><NotificationsHeaderList open={openMenu === 'notifications'} onUnreadCountChange={setUnreadCount} /></div>
          <div className="relative"><button type="button" aria-expanded={openMenu === 'tenant'} onClick={() => setOpenMenu(openMenu === 'tenant' ? null : 'tenant')} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2 sm:max-w-[16rem] sm:px-3"><Building2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /><span className="hidden truncate sm:inline">{activeTenant?.tenantName || 'Sélectionner une entreprise'}</span><ChevronDown className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden="true" /></button>{openMenu === 'tenant' && <div className="absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10" role="menu" aria-label="Mes entreprises"><div className="px-3 py-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mes entreprises</p><p className="mt-1 text-xs text-slate-400">Choisissez le contexte de travail actif</p></div>{membershipTenants.map((tenant) => <button key={tenant.tenantId} type="button" role="menuitem" disabled={tenantLoading} onClick={() => void handleTenantChange(tenant.tenantId)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 ${activeTenant?.tenantId === tenant.tenantId ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'}`}><span className="min-w-0 truncate">{tenant.tenantName}</span><span className="shrink-0 text-xs text-slate-500">{tenant.role}</span></button>)}{!membershipTenants.length && <p className="px-3 py-3 text-sm text-slate-500">Aucune entreprise disponible.</p>}{tenantLoading && <p className="px-3 py-2 text-xs text-indigo-700">Changement en cours...</p>}{tenantError && <p className="px-3 py-2 text-xs text-rose-700" role="alert">{tenantError}</p>}</div>}</div>
          <div className="relative"><button type="button" aria-expanded={openMenu === 'user'} onClick={() => setOpenMenu(openMenu === 'user' ? null : 'user')} className="flex h-10 items-center gap-2 rounded-lg px-2 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2 sm:px-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white" aria-hidden="true">{initials}</span><span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 md:block">{displayName}</span><ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" /></button>{openMenu === 'user' && <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10" role="menu" aria-label="Menu utilisateur"><div className="border-b border-slate-100 px-3 py-2"><p className="truncate text-sm font-semibold text-slate-900">{displayName}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div><Link href="/user" role="menuitem" onClick={() => setOpenMenu(null)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"><UserRound className="h-4 w-4" aria-hidden="true" /> Mon profil</Link><button type="button" role="menuitem" onClick={() => void handleLogout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600"><LogOut className="h-4 w-4" aria-hidden="true" /> Se déconnecter</button></div>}</div>
        </div> : <div className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-2"><Link href="/login" className="rounded-lg px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 sm:px-3 sm:text-sm">Se connecter</Link><Link href="/register" className="rounded-lg bg-slate-900 px-2 py-2 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2 sm:px-3 sm:text-sm">Créer un compte</Link></div>}
      </div>
    </header>
  );
}