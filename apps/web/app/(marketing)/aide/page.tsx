import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  FileText,
  Hammer,
  LifeBuoy,
  Receipt,
  Search,
  Settings2,
  WalletCards,
} from 'lucide-react';

const guides = [
  {
    icon: FileText,
    title: 'Créer un devis',
    description: 'Préparer les lignes, appliquer la TVA et envoyer un devis clair à votre client.',
    href: '/aide/devis',
    tone: 'blue',
    ready: true,
  },
  {
    icon: Receipt,
    title: 'Gérer les factures',
    description: 'Comprendre les statuts, les acomptes, les paiements et les documents correctifs.',
    href: '/aide/facture',
    tone: 'teal',
    ready: true,
  },
  {
    icon: Hammer,
    title: 'Suivre un chantier',
    description: 'Retrouver les documents, les rendez-vous et les informations utiles d’un projet.',
    href: '/aide/chantiers',
    tone: 'amber',
    ready: true,
  },
  {
    icon: WalletCards,
    title: 'Suivre les paiements',
    description: 'Lire le total TTC, l’acompte reçu et le montant réellement restant à payer.',
    href: '#bientot',
    tone: 'violet',
    ready: false,
  },
  {
    icon: Settings2,
    title: 'Configurer son espace',
    description: 'Mettre à jour les coordonnées de l’entreprise, les mentions et les préférences.',
    href: '/aide/entreprise',
    tone: 'slate',
    ready: true,
  },
];

const toneClasses: Record<string, { icon: string; edge: string }> = {
  blue: { icon: 'text-blue-700 bg-blue-100', edge: 'bg-blue-500' },
  teal: { icon: 'text-teal-700 bg-teal-100', edge: 'bg-teal-500' },
  amber: { icon: 'text-amber-700 bg-amber-100', edge: 'bg-amber-500' },
  violet: { icon: 'text-violet-700 bg-violet-100', edge: 'bg-violet-500' },
  slate: { icon: 'text-slate-700 bg-slate-200', edge: 'bg-slate-500' },
};

export default function HelpIndexPage() {
  return (
    <div className="min-h-full overflow-hidden bg-[#e8edf2] text-slate-700">
      <section className="relative border-b border-[#d5dce3] px-5 py-16 sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/60 blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
            <span aria-hidden="true">←</span> Retour à l’accueil
          </Link>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                <BookOpen className="h-4 w-4" aria-hidden="true" /> Centre d’aide
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
                Trouver la bonne réponse, sans fouiller.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Des guides courts pour avancer dans Workermate, du premier devis au suivi du chantier.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#e8edf2] p-5 shadow-[12px_12px_26px_#c7ced6,-12px_-12px_26px_#ffffff] sm:p-6">
              <div className="flex items-center gap-3 rounded-2xl bg-[#e8edf2] px-4 py-3 shadow-[inset_4px_4px_9px_#c7ced6,inset_-4px_-4px_9px_#ffffff]">
                <Search className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <span className="text-sm text-slate-500">Que cherchez-vous ?</span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                <span>Guides pensés pour les situations du quotidien</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">Sommaire</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Commencer par ici</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Choisissez le moment où vous êtes bloqué. Chaque guide suit le même fil : préparer, faire, vérifier.</p>
            <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-slate-600">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8edf2] text-blue-700 shadow-[4px_4px_9px_#c7ced6,-4px_-4px_9px_#ffffff]">3</span>
              <span>Quatre guides disponibles</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm font-semibold text-slate-400">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8edf2] shadow-[inset_3px_3px_7px_#c7ced6,inset_-3px_-3px_7px_#ffffff]">+</span>
              <span>D’autres arrivent bientôt</span>
            </div>
          </aside>

          <section aria-labelledby="guides-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Parcourir les guides</p>
                <h2 id="guides-title" className="mt-2 text-3xl font-black text-slate-900">Les situations principales</h2>
              </div>
              <LifeBuoy className="hidden h-8 w-8 text-blue-500 sm:block" aria-hidden="true" />
            </div>

            <div className="mt-8 space-y-5">
              {guides.map(({ icon: Icon, title, description, href, tone, ready }) => {
                const colors = toneClasses[tone];
                const content = (
                  <>
                    <span className={`absolute inset-y-5 left-0 w-1 rounded-r-full ${colors.edge}`} aria-hidden="true" />
                    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${colors.icon} shadow-[4px_4px_9px_rgba(157,169,180,.55),-4px_-4px_9px_rgba(255,255,255,.8)]`}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black text-slate-900">{title}</span>
                        {!ready && <span className="rounded-full bg-[#dce2e7] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">Bientôt</span>}
                      </span>
                      <span className="mt-1 block max-w-xl text-sm leading-6 text-slate-600">{description}</span>
                    </span>
                    {ready ? <ArrowRight className="h-5 w-5 shrink-0 text-blue-600 transition-transform group-hover:translate-x-1" aria-hidden="true" /> : <span className="text-xs font-semibold text-slate-400">En préparation</span>}
                  </>
                );

                return ready ? (
                  <Link key={title} href={href} className="group relative flex items-center gap-5 rounded-[1.75rem] bg-[#e8edf2] p-5 shadow-[10px_10px_20px_#c7ced6,-10px_-10px_20px_#ffffff] transition hover:-translate-y-0.5 hover:shadow-[13px_13px_24px_#c3cad2,-13px_-13px_24px_#ffffff] sm:p-6">
                    {content}
                  </Link>
                ) : (
                  <div key={title} className="relative flex items-center gap-5 rounded-[1.75rem] bg-[#e8edf2] p-5 opacity-80 shadow-[inset_5px_5px_12px_#c7ced6,inset_-5px_-5px_12px_#ffffff] sm:p-6">
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-16 flex flex-col items-center justify-between gap-5 rounded-[2rem] bg-[#e8edf2] p-7 text-center shadow-[inset_6px_6px_14px_#c7ced6,inset_-6px_-6px_14px_#ffffff] sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-[4px_4px_0_#1d4ed8]"><CircleHelp className="h-6 w-6" aria-hidden="true" /></span>
            <div>
              <h2 className="font-black text-slate-900">Vous ne trouvez pas votre réponse ?</h2>
              <p className="mt-1 text-sm text-slate-600">Notre équipe peut vous aider à débloquer votre situation.</p>
            </div>
          </div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#e8edf2] px-5 py-3 text-sm font-black text-blue-700 shadow-[5px_5px_11px_#c7ced6,-5px_-5px_11px_#ffffff] transition active:shadow-[inset_4px_4px_9px_#c7ced6,inset_-4px_-4px_9px_#ffffff]">
            Contacter l’équipe <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}