import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Search,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

const painPoints = [
  {
    icon: Smartphone,
    problem: '« Faire un devis alors que je suis sur le chantier, sans ordinateur ni bonne connexion. »',
    solution: 'Créez et envoyez un devis depuis votre téléphone, en quelques minutes, où que vous soyez.',
  },
  {
    icon: Wallet,
    problem: '« Retrouver qui a payé un acompte, et combien il reste réellement dû. »',
    solution: 'Chaque acompte est enregistré ; le solde restant dû se recalcule automatiquement.',
  },
  {
    icon: BellRing,
    problem: '« Relancer un client qui ne paie pas, sans y penser tous les matins. »',
    solution: 'Workermate relance automatiquement vos clients dès qu’une facture arrive à échéance.',
  },
  {
    icon: TrendingUp,
    problem: '« Savoir si un chantier a vraiment été rentable, une fois terminé. »',
    solution: 'La marge se calcule automatiquement à partir des devis, achats et heures passées.',
  },
  {
    icon: Users,
    problem: '« Caser toute l’équipe sur les bons chantiers, chaque semaine. »',
    solution: 'Un planning partagé par employé, avec accès rapide aux chantiers et rendez-vous de chacun.',
  },
  {
    icon: Search,
    problem: '« Retrouver un devis envoyé au client il y a trois mois. »',
    solution: 'Historique complet par client : devis, factures et échanges, centralisés au même endroit.',
  },
];

const trades = ['Plombier', 'Électricien', 'Maçon', 'Peintre', 'Menuisier', 'Carreleur', 'Couvreur', 'Paysagiste', 'Chauffagiste'];

const faqs = [
  { question: 'Puis-je faire un devis depuis un chantier, avec seulement du réseau mobile ?', answer: 'Oui, l’interface est pensée pour être utilisée depuis un téléphone, y compris en 4G, sans connexion fixe nécessaire.' },
  { question: 'Je ne suis pas à l’aise avec l’informatique, est-ce compliqué à prendre en main ?', answer: 'Non, l’interface est pensée pour être prise en main en quelques minutes, sans formation ni jargon technique.' },
  { question: 'Puis-je gérer plusieurs employés ou équipes ?', answer: 'Oui, vous pouvez inviter vos employés, leur assigner des chantiers et suivre le planning de chacun.' },
  { question: 'Est-ce adapté à mon métier, même si je ne suis pas dans le bâtiment ?', answer: 'Workermate est pensé pour les artisans du bâtiment, mais convient à toute activité basée sur devis, chantiers et factures.' },
];

export default function ArtisansSolutionPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-900 text-slate-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-6 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Solutions par métier — Artisans du bâtiment
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            Le logiciel pensé pour <span className="text-amber-400">le quotidien</span> des artisans.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Devis depuis le chantier, acomptes suivis, clients relancés automatiquement, marge calculée projet par projet : Workermate règle les problèmes que vous rencontrez tous les jours, pas ceux d’un grand groupe.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-300">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/fonctionnalites" className="inline-flex items-center rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800">
              Voir comment ça marche
            </Link>
          </div>
          <div
            className="mx-auto mt-14 h-4 max-w-md"
            style={{
              backgroundImage: 'repeating-linear-gradient(to right, rgba(251,191,36,0.6) 0 2px, transparent 2px 24px)',
              backgroundPosition: 'bottom',
              backgroundRepeat: 'repeat-x',
              backgroundSize: '24px 16px',
            }}
            aria-hidden="true"
          />
        </div>
      </section>

      <section className="relative bg-[#c9a577] py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.12) 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900/70">Le tableau de chantier</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Les galères qu’on connaît tous</h2>
            <p className="mt-3 text-slate-800/80">Chaque problème du quotidien, épinglé — avec sa solution juste en dessous.</p>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map(({ icon: Icon, problem, solution }, index) => {
              const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1', 'rotate-1'];
              return (
                <div key={problem} className={`relative ${rotations[index % rotations.length]} transition-transform hover:rotate-0`}>
                  <span className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-6 rounded-sm bg-amber-300/80 shadow-sm" aria-hidden="true" />
                  <div className="rounded-sm border border-slate-200 bg-[#fdfaf3] p-5 pt-7 shadow-lg">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-amber-400"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <p className="mt-3 font-serif text-sm italic text-slate-700">{problem}</p>
                    <div className="mt-4 border-t border-dashed border-slate-300 pt-4">
                      <p className="text-sm font-medium text-slate-800">{solution}</p>
                      <span className="mt-3 inline-flex -rotate-6 items-center gap-1 rounded border-2 border-dashed border-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Résolu
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Quel que soit votre métier</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Pensé pour les artisans du bâtiment</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {trades.map((trade) => (
              <span key={trade} className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                {trade}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900">Questions fréquentes</h2>
        <div className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
              <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Prêt à régler ces galères pour de bon ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Essayez Workermate gratuitement et voyez la différence dès le prochain devis.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-300">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
