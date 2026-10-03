import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  Repeat,
  ShieldCheck,
  Undo2,
  UserCheck,
  Wallet,
  Zap,
} from 'lucide-react';

const cycleSteps = [
  { icon: FileText, title: 'Création de devis', description: 'Générez un devis professionnel en quelques minutes, à partir d’un client, d’un chantier ou de votre catalogue d’articles.' },
  { icon: UserCheck, title: 'Acceptation client', description: 'Votre client consulte et accepte le devis ; le statut se met à jour automatiquement, sans échange de mails.' },
  { icon: Repeat, title: 'Transformation en facture', description: 'Convertissez le devis accepté en facture conforme, en un clic, sans ressaisir ni le client ni les lignes.' },
  { icon: Wallet, title: 'Paiements et acomptes', description: 'Enregistrez acomptes et règlements partiels ; le solde restant dû se recalcule automatiquement à chaque paiement.' },
  { icon: Undo2, title: 'Avoirs et factures correctives', description: 'Annulez ou corrigez une facture déjà émise en toute légalité, avec numérotation et références automatiques.' },
  { icon: Mail, title: 'Historique des envois', description: 'Suivez chaque envoi par email : destinataire, date et statut de remise, pour chaque devis et chaque facture.' },
  { icon: Download, title: 'Export PDF', description: 'Téléchargez vos devis et factures en PDF professionnel à tout moment, prêts à imprimer ou transmettre.' },
  { icon: BellRing, title: 'Relances automatiques', description: 'Ne courez plus après les paiements : Workermate relance vos clients pour les factures arrivées à échéance.' },
];

const highlights = [
  { icon: ShieldCheck, title: 'Conformité légale', description: 'Numérotation continue, mentions obligatoires et TVA gérées automatiquement sur chaque devis et chaque facture.' },
  { icon: FileText, title: 'Sans papier', description: 'Envoi par email, export PDF et archivage numérique : plus aucun document à imprimer ou à classer.' },
  { icon: Zap, title: 'Aucune ressaisie', description: 'Client, lignes et montants circulent automatiquement du devis à la facture, puis au paiement.' },
];

const faqs = [
  { question: 'Mes devis et factures sont-ils conformes à la réglementation ?', answer: 'Oui. Numérotation continue, mentions légales obligatoires et TVA sont calculées et appliquées automatiquement sur chaque document émis.' },
  { question: 'Puis-je encaisser un acompte avant la fin du chantier ?', answer: 'Oui, vous pouvez enregistrer un ou plusieurs acomptes sur une facture ; le montant restant dû est recalculé automatiquement à chaque paiement reçu.' },
  { question: 'Comment fonctionnent les relances automatiques ?', answer: 'Workermate détecte les factures arrivées à échéance sans paiement et envoie une relance à votre client, sans action de votre part.' },
  { question: 'Puis-je corriger une facture déjà envoyée à un client ?', answer: 'Une facture émise ne peut pas être modifiée directement, mais vous pouvez créer un avoir ou une facture corrective en quelques clics, en conservant un historique complet.' },
  { question: 'Mes clients peuvent-ils accepter un devis en ligne ?', answer: 'Oui, votre client peut consulter et accepter son devis directement, sans échange de mails ni signature papier.' },
];

// dotted "trail" connecting each stepping stone of the cycle, mirrored to alternate the curve direction
function PathConnector({ flip }: { flip: boolean }) {
  return (
    <svg viewBox="0 0 120 64" className={`mx-auto h-16 w-24 text-indigo-300 ${flip ? '-scale-x-100' : ''}`} aria-hidden="true">
      <path d="M10 4 C 10 34, 110 30, 110 60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 14" />
    </svg>
  );
}

export default function InvoicingLandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Logiciel de facturation pour artisans
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Devis, factures et paiements, sans perdre une minute.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Créez un devis, faites-le accepter, transformez-le en facture conforme et suivez chaque paiement — Workermate gère la numérotation, la TVA et les relances à votre place.
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
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Facture FAC-2026-0128</p>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Partiellement payée</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Total TTC</span><span className="font-semibold text-slate-900">4 040,00 €</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Acompte reçu</span><span className="font-semibold text-emerald-700">- 1 500,00 €</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Relance programmée</span><span className="font-semibold text-slate-900">Dans 6 jours</span></div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">Net à payer</span>
                <span className="text-lg font-bold">2 540,00 €</span>
              </div>
              <p className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white" aria-hidden="true">Télécharger le PDF</p>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Devis accepté en ligne</p>
                  <p className="text-xs text-slate-500">Il y a 2 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Le cycle complet</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">De la proposition au paiement</h2>
          <p className="mt-3 text-slate-600">Suivez le parcours : chaque étape s’enchaîne automatiquement, du premier devis jusqu’à l’encaissement final.</p>
        </div>

        <div className="mx-auto mt-14 max-w-md">
          <div className="flex flex-col items-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl shadow-inner">🚀</span>
            <span className="mt-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">Premier contact client</span>
          </div>

          {cycleSteps.map(({ icon: Icon, title, description }, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={title}>
                <PathConnector flip={!isEven} />
                <div className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex max-w-[15.5rem] items-start gap-3 sm:max-w-xs ${isEven ? '' : 'flex-row-reverse text-right'}`}>
                    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-900/20 ring-4 ring-white transition hover:scale-105">
                      <Icon className="h-7 w-7" aria-hidden="true" />
                      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-700 shadow">{index + 1}</span>
                    </span>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                      <p className="mt-1 text-xs text-slate-600">{description}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <PathConnector flip={cycleSteps.length % 2 !== 0} />
          <div className="flex flex-col items-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl shadow-lg">🏁</span>
            <span className="mt-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">Facture payée</span>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center md:text-left">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white md:mx-0"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </div>
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
        <div className="overflow-hidden rounded-3xl bg-indigo-600 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Prêt à facturer sans y passer vos soirées ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">Créez votre premier devis gratuitement et découvrez tout le cycle de facturation Workermate.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50">
              Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/fonctionnalites" className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Voir toutes les fonctionnalités
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
