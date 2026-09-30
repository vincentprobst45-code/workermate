import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bell,
  CheckCircle2,
  FileText,
  Landmark,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const composition = [
  'Factures encaissées et en attente de paiement',
  'Achats et factures fournisseurs engagés',
  'Acomptes et paiements partiels suivis automatiquement',
  'Solde consolidé sur l’ensemble de vos comptes',
];

const treasuryFeatures = [
  { icon: TrendingUp, title: 'Prévisions budgétaires', description: 'Anticipez votre trésorerie à venir selon vos devis en cours, vos factures à échoir et vos achats engagés.' },
  { icon: Landmark, title: 'Multi-comptes', description: 'Suivez plusieurs comptes bancaires et professionnels au même endroit, avec un solde consolidé.' },
  { icon: Banknote, title: 'Rapprochement bancaire', description: 'Faites correspondre vos relevés bancaires à vos encaissements et paiements en quelques clics.' },
  { icon: Wallet, title: 'Solde en temps réel', description: 'Un aperçu instantané de votre trésorerie disponible, mis à jour à chaque mouvement.' },
  { icon: Bell, title: 'Alertes d’échéance', description: 'Soyez prévenu avant qu’une facture n’arrive à échéance ou qu’un paiement ne soit en retard.' },
  { icon: FileText, title: 'Export comptable', description: 'Exportez vos mouvements de trésorerie pour votre comptable, sans ressaisie.' },
];

const usageSteps = [
  { title: 'Connectez vos comptes', description: 'Ajoutez vos comptes bancaires professionnels en quelques minutes.' },
  { title: 'Laissez Workermate calculer', description: 'Chaque facture, paiement et achat met à jour votre trésorerie automatiquement.' },
  { title: 'Anticipez sereinement', description: 'Consultez vos prévisions et rapprochez vos relevés en quelques clics.' },
];

// Frosted, low-opacity glass so the blue gradient behind actually reads through the blur, with an edge-lit top border and corner specular highlights instead of a flat white sheen.
function GlassPanel({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/20 border-t-white/80 bg-white/10 shadow-[0_25px_65px_-20px_rgba(29,78,216,0.5),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-16px_28px_-20px_rgba(29,78,216,0.35)] backdrop-blur-2xl ${className}`}
    >
      <span className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/60 blur-2xl" aria-hidden="true" />
      <span className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-blue-300/30 blur-2xl" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function TreasuryFeaturePage() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white via-blue-100 to-blue-500">
      <div className="pointer-events-none absolute -top-16 left-10 h-72 w-96 rounded-full bg-white/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute top-44 right-0 h-80 w-80 rounded-full bg-blue-200/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-300/50 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-24 right-1/4 h-72 w-72 rounded-full bg-white/40 blur-3xl" aria-hidden="true" />

      <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
        <Link href="/fonctionnalites" className="inline-flex items-center gap-2 text-sm font-medium text-blue-800 transition hover:text-blue-950">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour aux fonctionnalités
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Trésorerie</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">Une trésorerie limpide, à portée de main.</h1>
            <p className="mt-5 text-lg text-slate-700">
              Anticipez vos encaissements, suivez tous vos comptes et rapprochez vos relevés bancaires en quelques clics, sans jongler entre plusieurs outils.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">
                Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/fonctionnalites" className="inline-flex items-center rounded-lg border border-blue-200 bg-white/60 px-5 py-3 text-sm font-semibold text-blue-800 backdrop-blur-md transition hover:bg-white/80">
                Toutes les fonctionnalités
              </Link>
            </div>
          </div>

          <GlassPanel className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-800"><Landmark className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Compte professionnel</p>
                <p className="text-xs text-slate-600">Mis à jour à l’instant</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/30 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-600">Solde consolidé</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">18 240,00 €</p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-2.5">
                <span className="text-slate-700">Encaissements attendus</span>
                <span className="font-semibold text-emerald-700">+ 6 450 €</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-2.5">
                <span className="text-slate-700">Paiements à venir</span>
                <span className="font-semibold text-red-600">- 2 180 €</span>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <GlassPanel className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Ce qui compose votre trésorerie</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {composition.map((point) => (
              <li key={point} className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Tout pour piloter votre trésorerie</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {treasuryFeatures.map(({ icon: Icon, title, description }) => (
            <GlassPanel key={title} className="p-6 transition-transform duration-300 hover:-translate-y-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-800"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <GlassPanel className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Comment ça fonctionne</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {usageSteps.map(({ title, description }, index) => (
              <div key={title} className="rounded-2xl border border-white/30 bg-white/10 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/15 text-sm font-bold text-blue-800">{index + 1}</span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-24 text-center sm:px-6">
        <GlassPanel className="p-10 sm:p-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Prêt à voir clair dans votre trésorerie ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Créez votre compte et gardez une vision précise de votre trésorerie, sans tableur ni ressaisie.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/fonctionnalites" className="inline-flex items-center rounded-lg border border-blue-200 bg-white/60 px-6 py-3 text-sm font-semibold text-blue-800 transition hover:bg-white/80">
              Voir toutes les fonctionnalités
            </Link>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
