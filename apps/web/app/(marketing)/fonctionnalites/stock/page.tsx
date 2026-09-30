import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  FileText,
  Package,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import StockCounterDemo from './StockCounterDemo';

const steps: Array<{ icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>; title: string; description: string; extra?: ReactNode }> = [
  {
    icon: Truck,
    title: 'Fournisseurs',
    description: 'Coordonnées, historique d’achats et conditions par fournisseur, centralisés.',
  },
  {
    icon: ShoppingCart,
    title: 'Achats',
    description: 'Commandes fournisseurs rattachées à vos chantiers, pour suivre chaque dépense d’un projet.',
  },
  {
    icon: FileText,
    title: 'Factures fournisseurs',
    description: 'Réception, classement et rapprochement de vos factures d’achats, sans papier.',
  },
  {
    icon: Boxes,
    title: 'Gestion de stock',
    description: 'Suivi des quantités disponibles, alertes sur les seuils bas et historique des mouvements.',
    extra: <StockCounterDemo />,
  },
  {
    icon: Package,
    title: 'Catalogue produits',
    description: 'Vos articles et prestations types, prêts à réutiliser dans devis, factures et chantiers.',
    extra: (
      <div className="mt-4 rounded-2xl bg-[#e9eef5] p-4 shadow-[inset_6px_6px_14px_#c3cbd6,inset_-6px_-6px_14px_#ffffff]">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Un seul article, trois usages</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {['Devis', 'Facture', 'Chantier'].map((destination, index) => (
            <div key={destination} className="flex items-center gap-2">
              <span
                className="h-1.5 w-8 shrink-0 rounded-full bg-[repeating-linear-gradient(to_right,#3b82f6_0,#3b82f6_8px,transparent_8px,transparent_16px)] bg-[length:16px_100%] animate-[flow-line-x_0.8s_linear_infinite] motion-reduce:animate-none"
                style={{ animationDelay: `${index * 0.15}s` }}
                aria-hidden="true"
              />
              <span className="rounded-full bg-[#e9eef5] px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-[4px_4px_10px_#c3cbd6,-4px_-4px_10px_#ffffff]">
                {destination}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function StockFeaturePage() {
  return (
    <div className="relative bg-[#e9eef5] text-slate-700">
      <section className="relative mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-28">
        <Link
          href="/fonctionnalites"
          className="inline-flex items-center gap-2 rounded-full bg-[#e9eef5] px-4 py-2 text-sm font-medium text-blue-800 shadow-[5px_5px_12px_#c3cbd6,-5px_-5px_12px_#ffffff] transition active:shadow-[inset_4px_4px_10px_#c3cbd6,inset_-4px_-4px_10px_#ffffff]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour aux fonctionnalités
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Stock &amp; achats</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Du fournisseur au chantier, tout s’enchaîne tout seul.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Une commande, une réception, un stock à jour, un article prêt à réutiliser : chaque étape déclenche automatiquement la suivante, sans ressaisie.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#e9eef5] px-5 py-3 text-sm font-semibold text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff] transition active:shadow-[inset_5px_5px_12px_#c3cbd6,inset_-5px_-5px_12px_#ffffff]"
              >
                Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/fonctionnalites"
                className="inline-flex items-center rounded-xl bg-[#e9eef5] px-5 py-3 text-sm font-semibold text-slate-600 shadow-[inset_4px_4px_10px_#c3cbd6,inset_-4px_-4px_10px_#ffffff]"
              >
                Toutes les fonctionnalités
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
            <span className="absolute h-40 w-40 rounded-full bg-blue-400/25 motion-reduce:animate-none animate-ping" aria-hidden="true" />
            <span className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[12px_12px_28px_#c3cbd6,-12px_-12px_28px_#ffffff]">
              <Boxes className="h-12 w-12" aria-hidden="true" />
            </span>
            <span
              className="absolute right-2 top-4 animate-[float-chip_4s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-[#e9eef5] px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]"
            >
              + 40 reçus
            </span>
            <span
              className="absolute bottom-2 left-0 animate-[float-chip_4.6s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-[#e9eef5] px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]"
              style={{ animationDelay: '0.8s' }}
            >
              Stock à jour
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-5 pb-28 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Le circuit complet, étape par étape</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Chaque étape alimente automatiquement la suivante : un achat génère une facture fournisseur, qui met à jour le stock, qui rend l’article disponible partout ailleurs.
        </p>

        <div className="relative mt-14">
          <span
            className="absolute left-8 top-8 bottom-8 w-[3px] -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,#60a5fa_0,#60a5fa_10px,transparent_10px,transparent_20px)] bg-[length:100%_20px] animate-[flow-line_0.7s_linear_infinite] motion-reduce:animate-none"
            aria-hidden="true"
          />

          <ol className="space-y-10">
            {steps.map(({ icon: Icon, title, description, extra }, index) => (
              <li key={title} className="flex gap-6">
                <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[8px_8px_18px_#c3cbd6,-8px_-8px_18px_#ffffff]">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 rounded-[28px] bg-[#e9eef5] p-6 shadow-[10px_10px_24px_#c3cbd6,-10px_-10px_24px_#ffffff] sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Étape {index + 1}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                  {extra}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-5 pb-24 text-center sm:px-6">
        <div className="rounded-[28px] bg-[#e9eef5] p-10 shadow-[10px_10px_24px_#c3cbd6,-10px_-10px_24px_#ffffff] sm:p-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Prêt à ne plus ressaisir vos achats ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Créez votre compte et laissez Workermate faire circuler l’information entre vos fournisseurs, votre stock et vos chantiers.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#e9eef5] px-6 py-3 text-sm font-semibold text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff] transition active:shadow-[inset_5px_5px_12px_#c3cbd6,inset_-5px_-5px_12px_#ffffff]"
            >
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center rounded-xl bg-[#e9eef5] px-6 py-3 text-sm font-semibold text-slate-600 shadow-[inset_4px_4px_10px_#c3cbd6,inset_-4px_-4px_10px_#ffffff]"
            >
              Voir toutes les fonctionnalités
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
