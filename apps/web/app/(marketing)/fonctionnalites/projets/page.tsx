import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  FileText,
  FolderKanban,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

const overviewPoints = [
  'Client, adresse et coordonnées rattachés automatiquement',
  'Tous les devis envoyés, acceptés ou refusés',
  'Toutes les factures émises et leur statut de paiement',
  'Le planning des rendez-vous et interventions liés',
];

const projectFeatures = [
  { icon: Wallet, title: 'Suivi financier en temps réel', description: 'Budget prévisionnel, dépenses engagées et marge réelle calculés automatiquement à partir des devis, achats et factures du projet.' },
  { icon: FileText, title: 'Documents centralisés', description: 'Devis, factures, avoirs et factures fournisseurs liés au projet, classés et consultables en un clic, sans les rechercher ailleurs.' },
  { icon: CalendarDays, title: 'Planning intégré', description: 'Les rendez-vous et interventions du projet apparaissent directement dans le planning global de l’entreprise.' },
  { icon: Camera, title: 'Suivi de chantier', description: 'Photos avant/après, consommations et temps passé enregistrés depuis le terrain, rattachés au bon projet.' },
  { icon: Users, title: 'Équipe assignée', description: 'Attribuez les employés qui interviennent sur le projet et suivez qui fait quoi, du devis à la réception.' },
  { icon: TrendingUp, title: 'Rentabilité automatique', description: 'La marge du projet se met à jour seule à chaque facture, chaque achat et chaque heure enregistrée.' },
];

const usageSteps = [
  { title: 'Créez le projet', description: 'À partir d’un client existant ou nouveau, en quelques secondes.' },
  { title: 'Rattachez ce qui existe', description: 'Associez une adresse, un devis ou une facture déjà créés, sans ressaisie.' },
  { title: 'Suivez au quotidien', description: 'Chantier, planning, budget et documents restent synchronisés automatiquement.' },
];

export default function ProjectsFeaturePage() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white">
      <div className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-indigo-400/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />

      <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
        <Link href="/fonctionnalites" className="inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour aux fonctionnalités
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Fonctionnalité centrale</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Le projet, votre tableau de bord central</h1>
            <p className="mt-5 text-lg text-blue-100">
              Chaque projet Workermate regroupe tout ce qui concerne un client et son chantier : devis, factures, planning, budget et documents, réunis au même endroit et toujours à jour.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:bg-blue-50">
                Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/fonctionnalites" className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20">
                Toutes les fonctionnalités
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/25 bg-white/10 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white"><FolderKanban className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-semibold text-white">Rénovation salle de bain</p>
                <p className="text-xs text-blue-200">Client : Martin Dubois</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-blue-100"><Receipt className="h-4 w-4" aria-hidden="true" /> Devis</span>
                <span className="font-semibold text-white">Accepté</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-blue-100"><CalendarDays className="h-4 w-4" aria-hidden="true" /> Chantier</span>
                <span className="font-semibold text-white">En cours</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-blue-100"><Wallet className="h-4 w-4" aria-hidden="true" /> Facture</span>
                <span className="font-semibold text-white">En attente</span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-white/15 px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-blue-100">Marge estimée</span>
              <span className="text-lg font-bold text-white">32 %</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-xl sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Tout ce que regroupe un projet</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {overviewPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-blue-50">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Ce que vous pouvez faire avec un projet</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projectFeatures.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-lg shadow-blue-950/10 backdrop-blur-xl transition hover:bg-white/15">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-blue-100">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-xl sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Comment ça fonctionne</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {usageSteps.map(({ title, description }, index) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">{index + 1}</span>
                <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-blue-100">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-24 text-center sm:px-6">
        <div className="rounded-3xl border border-white/25 bg-white/10 p-10 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">Prêt à organiser vos projets ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">Créez votre compte et regroupez clients, devis, chantiers et factures autour de vos projets dès aujourd’hui.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/fonctionnalites" className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Voir toutes les fonctionnalités
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
