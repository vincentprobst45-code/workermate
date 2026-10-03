import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FilePlus2,
  ListChecks,
  Mail,
  MousePointerClick,
  PackagePlus,
  Send,
  Sparkles,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FilePlus2,
    title: 'Ouvrir un devis',
    description: 'Depuis votre espace, créez un nouveau devis. Le numéro est attribué automatiquement au moment de l’enregistrement.',
    note: 'Point de départ',
  },
  {
    number: '02',
    icon: MousePointerClick,
    title: 'Choisir le client',
    description: 'Sélectionnez un client existant ou renseignez ses coordonnées. Son adresse et ses informations restent réutilisables pour les prochains documents.',
    note: 'Une seule saisie',
  },
  {
    number: '03',
    icon: PackagePlus,
    title: 'Ajouter les prestations',
    description: 'Ajoutez vos lignes une par une ou partez du catalogue. Quantité, unité, prix et TVA sont visibles pendant la préparation.',
    note: 'Le détail fait la confiance',
  },
  {
    number: '04',
    icon: ListChecks,
    title: 'Relire le récapitulatif',
    description: 'Vérifiez le sous-total, les remises, les charges, la TVA et le total TTC avant de transmettre le devis.',
    note: 'Dernier regard',
  },
  {
    number: '05',
    icon: Send,
    title: 'Envoyer au client',
    description: 'Envoyez le devis par email ou téléchargez son PDF. L’historique conserve la trace de l’envoi et de son statut.',
    note: 'Prêt à avancer',
  },
];

const checks = [
  'Le nom et l’adresse du client sont corrects',
  'Les quantités et unités correspondent au chantier',
  'Les prix sont bien exprimés en HT',
  'La TVA appliquée correspond à la prestation',
  'Les conditions de paiement sont compréhensibles',
];

export default function QuoteHelpPage() {
  return (
    <div className="overflow-hidden bg-[#f7f8fa] text-slate-800">
      <section className="relative overflow-hidden bg-[#fff4d9]">
        <div className="pointer-events-none absolute -right-20 top-12 h-64 w-64 rounded-full bg-amber-200/70 blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-24">
          <Link href="/aide" className="inline-flex items-center gap-2 text-sm font-bold text-amber-800 transition hover:text-amber-950">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tous les guides
          </Link>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-amber-700"><Sparkles className="h-4 w-4" aria-hidden="true" /> Guide pratique</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">Créer un devis sans perdre le fil.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">Suivez le chemin du premier clic jusqu’à l’envoi client. Cinq étapes, un contrôle rapide, et votre proposition est prête à partir.</p>
            </div>
            <div className="relative mx-auto w-full max-w-xs lg:mb-1">
              <div className="absolute -inset-3 rotate-3 rounded-[2rem] bg-amber-300/50" aria-hidden="true" />
              <div className="relative rounded-[1.75rem] border-2 border-slate-900 bg-white p-5 shadow-[7px_8px_0_#172033]">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3"><span className="text-xs font-black uppercase tracking-widest">Devis</span><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">Brouillon</span></div>
                <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-bold">À choisir</span></div><div className="flex justify-between"><span className="text-slate-500">Prestations</span><span className="font-bold">À ajouter</span></div></div>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-amber-700"><span className="grid h-7 w-7 place-items-center rounded-full bg-amber-200"><ArrowRight className="h-4 w-4" aria-hidden="true" /></span> On commence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">Le parcours</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">De l’idée à l’envoi</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">Vous pouvez vous arrêter à n’importe quelle étape et reprendre plus tard : le devis reste un brouillon tant qu’il n’est pas finalisé.</p>
            <div className="mt-7 flex items-center gap-3 text-sm font-bold text-slate-600"><span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_0_5px_#fef3c7]" /> Progression guidée</div>
          </aside>

          <section aria-labelledby="steps-title">
            <div className="mb-8 flex items-center justify-between gap-4"><h2 id="steps-title" className="text-2xl font-black text-slate-900 sm:text-3xl">Les cinq mouvements</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">5 étapes</span></div>
            <ol className="relative space-y-10 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-1 before:rounded-full before:bg-amber-200 before:content-['']">
              {steps.map(({ number, icon: Icon, title, description, note }) => (
                <li key={number} className="relative flex gap-5 sm:gap-7">
                  <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-[#f7f8fa] bg-amber-500 text-white shadow-[0_5px_0_#b45309]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="font-mono text-xs font-black text-amber-600">{number}</span><h3 className="text-xl font-black text-slate-900">{title}</h3></div>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-[0_3px_9px_rgba(30,41,59,.08)]"><Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> {note}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="mt-20 grid gap-10 border-t border-slate-200 pt-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Avant d’envoyer</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">La vérification en 30 secondes</h2>
            <ul className="mt-6 space-y-4">
              {checks.map((check) => <li key={check} className="flex items-start gap-3 text-sm leading-6 text-slate-600"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />{check}</li>)}
            </ul>
          </div>
          <div className="rounded-[2rem] bg-slate-900 p-7 text-white shadow-[8px_9px_0_#d7dde3] sm:p-8">
            <Mail className="h-7 w-7 text-amber-300" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-black">Le bon réflexe</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">Présentez clairement ce qui est inclus, ce qui ne l’est pas, et quand le paiement est attendu. Un devis lisible évite beaucoup d’allers-retours.</p>
            <Link href="/register" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-amber-300">Créer mon premier devis <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-[#e8edf2] p-7 text-center shadow-[inset_6px_6px_14px_#c7ced6,inset_-6px_-6px_14px_#ffffff] sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Après le devis</p>
          <h2 className="mt-3 text-2xl font-black text-slate-900">Le client accepte ? La suite est déjà là.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Retrouvez ensuite le chantier, la facture et le suivi des paiements dans le même espace.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/aide" className="inline-flex items-center gap-2 rounded-xl bg-[#e8edf2] px-5 py-3 text-sm font-black text-slate-700 shadow-[5px_5px_11px_#c7ced6,-5px_-5px_11px_#ffffff]">Retour aux guides <ArrowLeft className="h-4 w-4" aria-hidden="true" /></Link><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#1d4ed8]">Essayer Workermate <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        </section>
      </main>
    </div>
  );
}