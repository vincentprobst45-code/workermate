import Link from 'next/link';
import type { ReactNode } from 'react';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href="/" className="shrink-0 text-lg font-semibold uppercase tracking-[0.2em] text-slate-900 sm:text-xl">
            Workermate
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-indigo-700">{link.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Se connecter</Link>
            <Link href="/register" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:px-4">Essai gratuit</Link>
          </div>
        </div>
        <nav className="flex items-center gap-6 overflow-x-auto border-t border-slate-100 px-5 py-2 text-sm font-medium text-slate-600 md:hidden">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 transition hover:text-indigo-700">{link.label}</Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-900">Workermate</p>
              <p className="mt-3 max-w-xs text-sm text-slate-600">Le logiciel de gestion pensé pour les artisans : devis, factures, chantiers et trésorerie, au même endroit.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Produit</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><Link href="/" className="transition hover:text-indigo-700">Fonctionnalités</Link></li>
                <li><Link href="/pricing" className="transition hover:text-indigo-700">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Entreprise</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><Link href="/contact" className="transition hover:text-indigo-700">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Compte</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><Link href="/login" className="transition hover:text-indigo-700">Se connecter</Link></li>
                <li><Link href="/register" className="transition hover:text-indigo-700">Créer un compte</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-10 text-xs text-slate-400">© {new Date().getFullYear()} Workermate. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
