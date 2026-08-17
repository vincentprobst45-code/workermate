'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Calendar, Users, FileText, LucideIcon, 
  FolderOpenDot, Building2, UserRound, Hammer, NotepadText, ScrollText, BookOpenText } from 'lucide-react';

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/tenant', label: 'Entreprise', icon: Building2 },
  { href: '/projects', label: 'Projets', icon: FolderOpenDot },
  { href: '/customers', label: 'Clients', icon: UserRound },
  { href: '/workorders', label: 'Chantiers', icon: Hammer },
  { href: '/quotes', label: 'Devis', icon: NotepadText },
  { href: '/invoices', label: 'Factures', icon: ScrollText },
  { href: '/catalogitem', label: 'Catalogue', icon: BookOpenText },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function VerticalHeader() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCollapse, setAutoCollapse] = useState(false);

  return (
    <aside
      className={`shrink-0 bg-zinc-800 text-zinc-200 transition-[width] duration-200 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
      aria-label="Navigation principale"
    >
      <div className="sticky top-0 flex h-[calc(100vh-4rem)] flex-col">
        <div className={`flex h-16 items-center border-b border-zinc-700 ${isCollapsed ? 'justify-center' : 'justify-end gap-2 px-3'}`}>
          {!isCollapsed && (
            <button
              type="button"
              aria-pressed={autoCollapse}
              title="Fermeture auto"
              onClick={() => setAutoCollapse((current) => !current)}
              className={`flex h-10 items-center gap-2 rounded-md px-2 text-xs transition ${
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
            className="flex h-10 w-10 items-center justify-center rounded-md text-lg text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
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
                className={`flex h-11 items-center rounded-md text-sm font-medium transition ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
                onClick={() => {
                  if (autoCollapse) {
                    setIsCollapsed(true);
                  }
                }}
              >
                <span className="w-6 text-center text-lg leading-none" aria-hidden="true"><Icon className="h-5 w-5 shrink-0" /></span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}