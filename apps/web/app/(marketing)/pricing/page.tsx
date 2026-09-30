import Link from 'next/link';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Solo',
    description: "Pour l’artisan qui travaille seul et veut arrêter les tableurs.",
    price: '19 €',
    period: '/ mois',
    cta: 'Essayer gratuitement',
    href: '/register',
    featured: false,
    features: [
      'Clients et adresses illimités',
      'Devis et factures conformes',
      'Planning et chantiers',
      '1 utilisateur',
      'Assistance par email',
    ],
  },
  {
    name: 'Équipe',
    description: 'Pour les entreprises avec plusieurs intervenants sur le terrain.',
    price: '49 €',
    period: '/ mois',
    cta: 'Essayer gratuitement',
    href: '/register',
    featured: true,
    features: [
      'Tout Solo, plus :',
      'Jusqu’à 5 utilisateurs',
      'Trésorerie et marge par projet',
      'Catalogue d’articles et stock',
      'Achats et fournisseurs',
      'Assistance prioritaire',
    ],
  },
  {
    name: 'Entreprise',
    description: 'Pour les structures avec des besoins spécifiques.',
    price: 'Sur devis',
    period: '',
    cta: 'Nous contacter',
    href: '/contact',
    featured: false,
    features: [
      'Tout Équipe, plus :',
      'Utilisateurs illimités',
      'Accompagnement à la mise en place',
      'Export comptable',
      'Interlocuteur dédié',
    ],
  },
];

const faqs = [
  { question: 'Puis-je changer de formule à tout moment ?', answer: 'Oui, vous pouvez passer d’une formule à l’autre à tout moment depuis votre espace, sans engagement.' },
  { question: 'Mes devis et factures sont-ils conformes à la réglementation ?', answer: 'Oui. Numérotation continue, mentions légales et TVA sont gérées automatiquement pour chaque document émis.' },
  { question: 'Puis-je utiliser Workermate sur mon téléphone ?', answer: 'Oui, l’application est conçue pour être utilisée aussi bien au bureau que sur le terrain, depuis un mobile ou une tablette.' },
  { question: 'Y a-t-il un engagement de durée ?', answer: 'Non, tous les abonnements sont sans engagement et résiliables à tout moment.' },
];

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Tarifs</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">Une offre simple, pour chaque taille d’équipe</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">Pas de frais cachés, pas de module payant en plus. Choisissez la formule adaptée à votre activité.</p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.name} className={`flex flex-col rounded-2xl border p-6 shadow-sm sm:p-8 ${tier.featured ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 lg:-translate-y-2' : 'border-slate-200 bg-white'}`}>
              {tier.featured && <span className="mb-3 inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Le plus populaire</span>}
              <h2 className={`text-lg font-semibold ${tier.featured ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h2>
              <p className={`mt-2 text-sm ${tier.featured ? 'text-indigo-100' : 'text-slate-500'}`}>{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${tier.featured ? 'text-white' : 'text-slate-900'}`}>{tier.price}</span>
                {tier.period && <span className={`text-sm ${tier.featured ? 'text-indigo-100' : 'text-slate-500'}`}>{tier.period}</span>}
              </p>
              <Link href={tier.href} className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition ${tier.featured ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {tier.cta}
              </Link>
              <ul className="mt-8 space-y-3 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className={`flex items-start gap-2 ${tier.featured ? 'text-indigo-50' : 'text-slate-600'}`}>
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.featured ? 'text-white' : 'text-indigo-600'}`} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">Tous les prix sont hors taxes. Sans engagement, résiliable à tout moment.</p>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-slate-900">Questions fréquentes</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Encore une question ?</h2>
          <p className="mt-2 text-slate-600">Notre équipe est là pour vous aider à choisir la bonne formule.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Contactez-nous</Link>
        </div>
      </section>
    </>
  );
}
