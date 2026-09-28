'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, LucideIcon, X,
  FolderOpenDot, Building2, UserRound, Hammer, NotepadText, ScrollText, BookOpenText, Bell, WalletCards, Truck, ShoppingCart, Boxes } from 'lucide-react';

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/user', label: 'Mon profil', icon: UserRound },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/tenant', label: 'Entreprise', icon: Building2 },
  { href: '/projects', label: 'Projets', icon: FolderOpenDot },
  { href: '/customers', label: 'Clients', icon: UserRound },
  { href: '/workorders', label: 'Chantiers', icon: Hammer },
  { href: '/quotes', label: 'Devis', icon: NotepadText },
  { href: '/invoices', label: 'Factures', icon: ScrollText },
  { href: '/treasury', label: 'Trésorerie', icon: WalletCards },
  { href: '/catalogitem', label: 'Catalogue', icon: BookOpenText },
  { href: '/suppliers', label: 'Fournisseurs', icon: Truck },
  { href: '/purchases', label: 'Achats', icon: ShoppingCart },
  { href: '/stock', label: 'Stock', icon: Boxes },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type VerticalHeaderProps = { mobileOpen?: boolean; onCloseMobile?: () => void };

export default function VerticalHeader({ mobileOpen = false, onCloseMobile }: VerticalHeaderProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCollapse, setAutoCollapse] = useState(false);

  // Lock background scroll and allow Escape to dismiss while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    document.body.style.overflow = 'hidden';
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMobile?.();
    }
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen, onCloseMobile]);

  function handleNavigate() {
    onCloseMobile?.();
    if (autoCollapse) setIsCollapsed(true);
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/60 md:hidden" onClick={onCloseMobile} aria-hidden="true" />}
      <aside
        className={`fixed inset-x-0 bottom-0 top-16 z-40 w-72 max-w-[80vw] bg-zinc-800 text-zinc-200 transition-transform duration-200 md:static md:inset-auto md:z-auto md:w-56 md:max-w-none md:shrink-0 md:translate-x-0 md:transition-[width] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-16' : 'md:w-56'}`}
        aria-label="Navigation principale"
      >
        <div className="flex h-full flex-col md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
          <div className={`flex h-16 items-center justify-between gap-2 border-b border-zinc-700 px-3 ${isCollapsed ? 'md:justify-center' : 'md:justify-end'}`}>
            <span className="text-sm font-semibold uppercase tracking-wide text-white md:hidden">Menu</span>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={onCloseMobile}
              className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-300 transition hover:bg-zinc-700 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {!isCollapsed && (
              <button
                type="button"
                aria-pressed={autoCollapse}
                title="Fermeture auto"
                onClick={() => setAutoCollapse((current) => !current)}
                className={`hidden h-10 items-center gap-2 rounded-md px-2 text-xs transition md:flex ${
                  autoCollapse
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                <span className={`h-3 w-3 rounded-full border ${autoCollapse ? 'border-white bg-white' : 'border-zinc-400'}`} aria-hidden="true" />
                Fermeture auto
              </button>
            )}
            <button
              type="button"
              aria-label={isCollapsed ? 'Élargir la navigation' : 'Réduire la navigation'}
              title={isCollapsed ? 'Élargir la navigation' : 'Réduire la navigation'}
              onClick={() => setIsCollapsed((current) => !current)}
              className="hidden h-10 w-10 items-center justify-center rounded-md text-lg text-zinc-300 transition hover:bg-zinc-700 hover:text-white md:flex"
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {navigationItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                    isCollapsed ? 'md:justify-center md:gap-0 md:px-0' : ''
                  } ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                  onClick={handleNavigate}
                >
                  <span className="w-6 text-center text-lg leading-none" aria-hidden="true"><Icon className="h-5 w-5 shrink-0" /></span>
                  <span className={isCollapsed ? 'md:hidden' : ''}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
