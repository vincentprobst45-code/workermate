import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Hand,
  LayoutGrid,
  Link2,
  MousePointerClick,
  SlidersHorizontal,
} from 'lucide-react';

const gestures = [
  {
    icon: Hand,
    color: 'amber',
    title: 'Créer et déplacer au doigt (ou à la souris)',
    description: 'Glissez un rendez-vous d’un créneau à l’autre, ou dessinez une nouvelle plage directement sur le planning : le changement est immédiat, sur ordinateur comme sur mobile.',
    demo: (
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
        <div className="flex flex-col gap-2">
          <span className="h-7 w-16 rounded-lg border-2 border-dashed border-amber-300" aria-hidden="true" />
          <span className="h-7 w-16 rounded-lg border-2 border-dashed border-amber-300" aria-hidden="true" />
        </div>
        <svg viewBox="0 0 60 32" className="h-8 w-14 text-amber-400" aria-hidden="true">
          <path d="M2 4 C 30 4, 20 28, 56 28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" />
          <path d="M48 22 L 57 28 L 49 33" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="-rotate-3 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_4px_0_#b45309]">Rdv 14h</span>
      </div>
    ),
  },
  {
    icon: LayoutGrid,
    color: 'violet',
    title: 'Passer d’une vue à l’autre sans réfléchir',
    description: 'Jour, semaine, mois ou liste : basculez de vue comme on tourne un bouton, pour retrouver instantanément le niveau de détail dont vous avez besoin.',
    demo: (
      <div className="mt-5 inline-flex items-center gap-1 rounded-full bg-violet-100 p-1">
        {['Jour', 'Semaine', 'Mois', 'Liste'].map((view, index) => (
          <span
            key={view}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${index === 1 ? 'bg-violet-600 text-white shadow-[0_3px_0_#5b21b6]' : 'text-violet-700'}`}
          >
            {view}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: SlidersHorizontal,
    color: 'teal',
    title: 'Filtrer comme on règle une table de mixage',
    description: 'Un curseur par employé, par type d’événement ou par statut : ajustez le planning affiché en quelques gestes, sans jamais passer par un formulaire.',
    demo: (
      <div className="mt-5 flex items-end gap-5 rounded-2xl bg-teal-50 p-4">
        {[{ label: 'Équipe', value: 65 }, { label: 'Type', value: 35 }, { label: 'Statut', value: 80 }].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-1.5 rounded-full bg-teal-200">
              <span
                className="absolute left-1/2 h-3.5 w-3.5 rounded-full bg-teal-600 shadow-[0_3px_0_#0f766e]"
                style={{ bottom: `${value}%`, transform: 'translate(-50%, 50%)' }}
              />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Link2,
    color: 'rose',
    title: 'Associer un événement en un clic',
    description: 'Rattachez un rendez-vous à un projet, un chantier ou une adresse existante : l’événement se connecte instantanément, comme un aimant qui trouve sa place.',
    demo: (
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold">
        <span className="rounded-lg bg-rose-500 px-3 py-1.5 text-white shadow-[0_3px_0_#9f1239]">Rendez-vous 10h</span>
        <span className="h-px w-6 border-t-2 border-dashed border-rose-300" aria-hidden="true" />
        <Link2 className="h-4 w-4 text-rose-400" aria-hidden="true" />
        <span className="h-px w-6 border-t-2 border-dashed border-rose-300" aria-hidden="true" />
        <span className="rounded-lg bg-white px-3 py-1.5 text-rose-700 shadow-sm ring-1 ring-rose-200">Chantier Dupont</span>
      </div>
    ),
  },
  {
    icon: MousePointerClick,
    color: 'sky',
    title: 'Ouvrir les détails sans quitter le planning',
    description: 'Un clic sur un événement fait remonter tout ce qui compte : client, adresse, chantier et documents liés, dans une bulle qui apparaît juste au-dessus.',
    demo: (
      <div className="relative mt-8 inline-flex flex-col items-center">
        <div className="relative rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs shadow-sm">
          <p className="font-semibold text-slate-900">12 Rue des Lilas</p>
          <p className="text-slate-500">Client : Martin Dubois</p>
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-sky-200 bg-white" aria-hidden="true" />
        </div>
        <span className="mt-4 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_3px_0_#0369a1]">Rendez-vous chantier</span>
      </div>
    ),
  },
];

const colorTokenClasses: Record<string, string> = {
  amber: 'bg-amber-500 shadow-[0_6px_0_#b45309] hover:shadow-[0_7px_0_#b45309]',
  violet: 'bg-violet-600 shadow-[0_6px_0_#5b21b6] hover:shadow-[0_7px_0_#5b21b6]',
  teal: 'bg-teal-600 shadow-[0_6px_0_#0f766e] hover:shadow-[0_7px_0_#0f766e]',
  rose: 'bg-rose-500 shadow-[0_6px_0_#9f1239] hover:shadow-[0_7px_0_#9f1239]',
  sky: 'bg-sky-500 shadow-[0_6px_0_#0369a1] hover:shadow-[0_7px_0_#0369a1]',
};

export default function PlanningFeaturePage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-28">
          <Link href="/fonctionnalites" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour aux fonctionnalités
          </Link>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Planning</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Un planning qui se pilote du bout du doigt.
              </h1>
              <p className="mt-5 text-lg text-slate-600">
                Créez, déplacez, filtrez et associez vos rendez-vous d’un geste — sur ordinateur comme sur mobile. Chaque interaction est pensée pour être immédiate, presque physique.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_5px_0_#b45309] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#b45309] active:translate-y-0.5 active:shadow-[0_2px_0_#b45309]">
                  Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/fonctionnalites" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Toutes les fonctionnalités
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>Jeudi 15 octobre</span>
                <span>Vue semaine</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">09h00 — créneau libéré</div>
                <div className="flex items-center justify-between rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#b45309]">
                  <span>Pose de carrelage</span>
                  <span className="text-xs font-normal text-amber-100">déplacé à 10h30</span>
                </div>
                <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Visite technique · 14h00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-6 sm:py-28">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Cinq gestes, cinq sensations</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Un planning qu’on a plaisir à utiliser</h2>
          <p className="mt-4 text-slate-600">Chaque interaction est conçue pour être simple, directe, et un peu satisfaisante.</p>
        </div>

        <div className="relative mt-16">
          <span
            className="absolute left-8 top-8 bottom-8 w-[3px] -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,#cbd5e1_0,#cbd5e1_10px,transparent_10px,transparent_20px)] bg-[length:100%_20px] animate-[flow-line_0.8s_linear_infinite] motion-reduce:animate-none"
            aria-hidden="true"
          />

          <ol className="space-y-14">
            {gestures.map(({ icon: Icon, color, title, description, demo }) => (
              <li key={title} className="flex gap-6">
                <span className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white transition-transform ${colorTokenClasses[color]}`}>
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                  {demo}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24 text-center sm:px-6">
        <div className="rounded-3xl bg-slate-900 p-10 shadow-xl sm:p-14">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Prêt à sentir la différence ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Essayez le planning Workermate gratuitement et glissez votre premier rendez-vous.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_5px_0_#b45309] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#b45309] active:translate-y-0.5 active:shadow-[0_2px_0_#b45309]">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/fonctionnalites" className="inline-flex items-center rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800">
              Voir toutes les fonctionnalités
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
