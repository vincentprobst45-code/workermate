import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Hammer,
  NotepadText,
  ScrollText,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards,
  Zap,
} from 'lucide-react';

const features = [
  { icon: UserRound, title: 'Clients centralisés', description: 'Coordonnées, adresses et historique de chaque client au même endroit, prêts à réutiliser.' },
  { icon: NotepadText, title: 'Devis en quelques minutes', description: 'Préremplis depuis un chantier ou votre catalogue d’articles, prêts à envoyer.' },
  { icon: ScrollText, title: 'Facturation conforme', description: 'Numérotation automatique, mentions légales et TVA gérées sur chaque document émis.' },
  { icon: Hammer, title: 'Suivi de chantiers', description: 'Étapes, fiches de suivi et statuts en temps réel, du devis à la réception.' },
  { icon: CalendarDays, title: 'Planning unifié', description: 'Rendez-vous, visites et interventions dans un calendrier pensé pour le terrain.' },
  { icon: WalletCards, title: 'Trésorerie claire', description: 'Encaissements, paiements et marge par projet, sans tableur ni ressaisie.' },
];

const steps = [
  { title: 'Un client', description: 'Enregistrez ses coordonnées une seule fois, elles resteront toujours à jour.' },
  { title: 'Un devis', description: 'Les informations client et entreprise se préremplissent automatiquement.' },
  { title: 'Une facture', description: 'Convertissez le devis accepté en facture conforme, en un clic.' },
];

const highlights = [
  { icon: Smartphone, title: 'Pensé pour le mobile', description: 'Consultez vos chantiers et créez un devis depuis le terrain, sur votre téléphone.' },
  { icon: ShieldCheck, title: 'Conformité assurée', description: 'Numérotation, mentions légales et TVA gérées automatiquement sur chaque document.' },
  { icon: Zap, title: 'Aucune prise de tête', description: 'Une interface simple, sans jargon ni formation nécessaire pour démarrer.' },
];

export default function MarketingHomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Pour les artisans du bâtiment
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              La gestion de votre entreprise, simplifiée.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Workermate réunit clients, devis, factures, chantiers et trésorerie dans un seul outil clair et professionnel — pensé pour les artisans, pas pour les comptables.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Voir les tarifs
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">Sans engagement · Aucune carte bancaire requise</p>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-indigo-900/5 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Devis DEV-2026-0004</p>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Accepté</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Rénovation salle de bain</span><span className="font-semibold text-slate-900">2 450,00 €</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Pose de carrelage</span><span className="font-semibold text-slate-900">980,00 €</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Plomberie</span><span className="font-semibold text-slate-900">610,00 €</span></div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">Total TTC</span>
                <span className="text-lg font-bold">4 040,00 €</span>
              </div>
              <p className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white" aria-hidden="true">Convertir en facture</p>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Facture payée</p>
                  <p className="text-xs text-slate-500">Il y a 2 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Tout-en-un</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Tout ce qu’il faut pour piloter votre activité</h2>
          <p className="mt-3 text-slate-600">Fini les tableurs et les documents dispersés. Chaque projet, du premier contact au paiement, reste organisé au même endroit.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Simplicité</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Du premier contact au paiement, en 3 étapes</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{index + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center md:text-left">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white md:mx-0"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-indigo-600 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Prêt à simplifier votre gestion ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">Rejoignez les artisans qui gèrent déjà leurs devis, factures et chantiers avec Workermate.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50">Essayer gratuitement</Link>
            <Link href="/contact" className="rounded-lg border border-indigo-300 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">Nous contacter</Link>
          </div>
        </div>
      </section>
    </>
  );
}
