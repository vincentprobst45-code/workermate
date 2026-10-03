import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Boxes,
  CalendarPlus,
  FileText,
  FolderPlus,
  Hammer,
  Phone,
  Receipt,
  Smartphone,
  Truck,
} from 'lucide-react';
import SiteVisitChecklistDemo from './SiteVisitChecklistDemo';
import ProfitabilityDemo from './ProfitabilityDemo';

const journey = [
  {
    time: '09h12',
    mood: { label: 'Sérénité', color: 'bg-sky-100 text-sky-700' },
    icon: Phone,
    title: 'Un client vous appelle',
    description: 'Sophie Petit souhaite rénover sa salle de bain. Avant même de raccrocher, vous créez son projet : plus besoin de noter ça sur un bout de papier.',
    demo: (
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]">
          <span className="absolute h-16 w-16 rounded-full bg-blue-400/20 animate-ping motion-reduce:animate-none" aria-hidden="true" />
          <Phone className="relative h-5 w-5" aria-hidden="true" />
        </span>
        <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]">
          <FolderPlus className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">Projet « Salle de bain Petit »</span>
      </div>
    ),
  },
  {
    time: '09h14',
    mood: { label: 'Confiance', color: 'bg-rose-100 text-rose-700' },
    icon: FolderPlus,
    title: 'Le client rejoint le projet',
    description: 'Ses coordonnées s’enregistrent dans le projet : elles resteront accessibles pour chaque devis, facture ou rendez-vous à venir.',
    demo: (
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-xl bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-slate-200">
          <span className="block font-semibold text-slate-900">Sophie Petit</span>
          <span className="block text-slate-500">06 12 34 56 78</span>
        </span>
        <span className="text-slate-300">+</span>
        <span className="rounded-xl bg-[#e9eef5] px-3 py-2 text-xs font-semibold text-blue-700 shadow-[4px_4px_10px_#c3cbd6,-4px_-4px_10px_#ffffff]">Projet « Salle de bain Petit »</span>
      </div>
    ),
  },
  {
    time: '09h16',
    mood: { label: 'Anticipation', color: 'bg-violet-100 text-violet-700' },
    icon: CalendarPlus,
    title: 'Un rendez-vous de visite se cale tout seul',
    description: 'Vous programmez une visite pour établir le devis. Le rendez-vous apparaît directement dans votre planning, rattaché au projet.',
    demo: (
      <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-[#e9eef5] p-3 shadow-[inset_5px_5px_10px_#c3cbd6,inset_-5px_-5px_10px_#ffffff]">
        <span className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
          <span className="text-[9px] font-semibold uppercase">Oct</span>
          <span className="text-sm font-bold leading-none">14</span>
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-900">Visite chantier</p>
          <p className="text-[11px] text-slate-500">09h00 · Sophie Petit</p>
        </div>
      </div>
    ),
  },
  {
    time: '14 octobre',
    mood: { label: 'Liberté', color: 'bg-amber-100 text-amber-700' },
    icon: Smartphone,
    title: 'Sur place, le chantier prend forme',
    description: 'Depuis son téléphone, directement chez la cliente, vous créez le chantier et listez chaque étape prévue, avec les consommations attendues.',
    demo: <SiteVisitChecklistDemo />,
  },
  {
    time: '14 octobre',
    mood: { label: 'Fierté', color: 'bg-emerald-100 text-emerald-700' },
    icon: FileText,
    title: 'Le devis sort avant de quitter le chantier',
    description: 'En repartant, vous générez le devis directement à partir du chantier : lignes, quantités et prix sont déjà là, prêts à être envoyés.',
    demo: (
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]">
          <Hammer className="h-5 w-5" aria-hidden="true" />
        </span>
        <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="-rotate-6 rounded border-2 border-dashed border-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">Devis généré</span>
      </div>
    ),
  },
  {
    time: '2 novembre',
    mood: { label: 'Enthousiasme', color: 'bg-lime-100 text-lime-700' },
    icon: Hammer,
    title: 'Le devis est accepté',
    description: 'Sophie accepte en ligne. Vous convenez aussitôt d’un rendez-vous pour démarrer les travaux : le feu vert est donné.',
    demo: (
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-14 items-center rounded-full bg-emerald-500 p-1 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]">
            <span className="h-6 w-6 translate-x-6 rounded-full bg-white shadow-[2px_2px_5px_rgba(0,0,0,0.25)]" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-emerald-700">Devis accepté</span>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl bg-[#e9eef5] p-3 shadow-[inset_5px_5px_10px_#c3cbd6,inset_-5px_-5px_10px_#ffffff]">
          <span className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
            <span className="text-[9px] font-semibold uppercase">Nov</span>
            <span className="text-sm font-bold leading-none">04</span>
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-900">Début des travaux</p>
            <p className="text-[11px] text-slate-500">08h00 · Équipe complète</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    time: 'Pendant le chantier',
    mood: { label: 'Maîtrise', color: 'bg-blue-100 text-blue-700' },
    icon: Activity,
    title: 'Chaque étape nourrit la rentabilité',
    description: 'Fiches de suivi, étapes réalisées et consommations enregistrées se comparent automatiquement au prévisionnel et au devis : la marge se recalcule toute seule.',
    demo: <ProfitabilityDemo />,
  },
  {
    time: '20 novembre',
    mood: { label: 'Soulagement', color: 'bg-fuchsia-100 text-fuchsia-700' },
    icon: Receipt,
    title: 'La facture se règle, sans y penser',
    description: 'En quelques clics, la facture part du devis accepté. Si elle traîne, Workermate relance Sophie automatiquement — jusqu’au paiement.',
    demo: (
      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
          {['Envoyée', 'Relance', 'Payée'].map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 ${index === 2 ? 'bg-emerald-600 text-white shadow-[0_3px_0_#065f46]' : 'bg-[#e9eef5] text-slate-500 shadow-[3px_3px_8px_#c3cbd6,-3px_-3px_8px_#ffffff]'}`}>{label}</span>
              {index < 2 && <span className="h-px w-5 bg-slate-300" aria-hidden="true" />}
            </div>
          ))}
        </div>
        <span className="inline-block animate-[float-chip_4s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
          + 4 040,00 € encaissés
        </span>
      </div>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-[#e9eef5] text-slate-700">
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Comment ça marche</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">Une journée dans la vie d’un chantier</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Suivez le parcours de Sophie Petit et de son artisan, de l’appel initial jusqu’au paiement de la facture — et découvrez tout ce que Workermate fait, sans y penser, à chaque étape.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#e9eef5] px-5 py-3 text-sm font-semibold text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff] transition active:shadow-[inset_5px_5px_12px_#c3cbd6,inset_-5px_-5px_12px_#ffffff]">
            Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/fonctionnalites" className="inline-flex items-center rounded-xl bg-[#e9eef5] px-5 py-3 text-sm font-semibold text-slate-600 shadow-[inset_4px_4px_10px_#c3cbd6,inset_-4px_-4px_10px_#ffffff]">
            Voir toutes les fonctionnalités
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6">
        <div className="relative">
          <span
            className="absolute left-8 top-8 bottom-8 -z-0 w-[3px] -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,#93c5fd_0,#93c5fd_10px,transparent_10px,transparent_20px)] bg-[length:100%_20px] animate-[flow-line_0.8s_linear_infinite] motion-reduce:animate-none"
            aria-hidden="true"
          />
          <ol className="space-y-12">
            {journey.map(({ time, mood, icon: Icon, title, description, demo }) => (
              <li key={title} className="relative flex gap-6">
                <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[8px_8px_18px_#c3cbd6,-8px_-8px_18px_#ffffff]">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 rounded-[28px] bg-[#e9eef5] p-6 shadow-[10px_10px_24px_#c3cbd6,-10px_-10px_24px_#ffffff] sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{time}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${mood.color}`}>{mood.label}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                  {demo}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">En continu, en arrière-plan</p>
        <h2 className="mt-3 text-center text-2xl font-bold text-slate-900 sm:text-3xl">Pendant que vous travaillez, Workermate veille</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] bg-[#e9eef5] p-7 shadow-[10px_10px_24px_#c3cbd6,-10px_-10px_24px_#ffffff]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]">
              <Activity className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900">La trésorerie garde son calme</h3>
            <p className="mt-2 text-sm text-slate-600">Chaque acompte, achat et paiement met à jour votre trésorerie en temps réel, avec une prévision claire de ce qui arrive.</p>
            <div className="mt-5 flex h-12 items-end gap-1.5">
              {[8, 14, 10, 18, 12, 16, 9, 13].map((height, index) => (
                <span
                  key={index}
                  className="w-2 rounded-full bg-blue-600 animate-pulse motion-reduce:animate-none"
                  style={{ height: `${height * 2}px`, animationDelay: `${index * 0.15}s` }}
                />
              ))}
            </div>
            <Link href="/fonctionnalites/tresorerie" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
              Découvrir la trésorerie <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-[28px] bg-[#e9eef5] p-7 shadow-[10px_10px_24px_#c3cbd6,-10px_-10px_24px_#ffffff]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff]">
              <Boxes className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900">Le matériel suit, sans y penser</h3>
            <p className="mt-2 text-sm text-slate-600">Stock, achats, fournisseurs et factures fournisseurs se mettent à jour au fil des chantiers, toujours au bon endroit.</p>
            <div className="mt-5 flex items-center gap-2">
              {[Truck, Boxes, FileText].map((PipeIcon, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eef5] text-blue-700 shadow-[4px_4px_10px_#c3cbd6,-4px_-4px_10px_#ffffff]">
                    <PipeIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {index < 2 && (
                    <span
                      className="h-1 w-6 rounded-full bg-[repeating-linear-gradient(to_right,#2563eb_0,#2563eb_8px,transparent_8px,transparent_16px)] bg-[length:16px_100%] animate-[flow-line-x_0.8s_linear_infinite] motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
            <Link href="/fonctionnalites/stock" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
              Découvrir le stock &amp; les achats <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24 text-center sm:px-6">
        <div className="rounded-[28px] bg-[#e9eef5] p-10 shadow-[10px_10px_24px_#c3cbd6,-10px_-10px_24px_#ffffff] sm:p-14">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Prêt à vivre ce parcours pour de vrai ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Créez votre compte gratuitement et laissez Workermate accompagner votre prochain chantier, de l’appel au paiement.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#e9eef5] px-6 py-3 text-sm font-semibold text-blue-700 shadow-[6px_6px_14px_#c3cbd6,-6px_-6px_14px_#ffffff] transition active:shadow-[inset_5px_5px_12px_#c3cbd6,inset_-5px_-5px_12px_#ffffff]">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center rounded-xl bg-[#e9eef5] px-6 py-3 text-sm font-semibold text-slate-600 shadow-[inset_4px_4px_10px_#c3cbd6,inset_-4px_-4px_10px_#ffffff]">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
