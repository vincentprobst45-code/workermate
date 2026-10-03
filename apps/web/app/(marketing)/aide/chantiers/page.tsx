import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Filter,
  FolderOpen,
  GripVertical,
  ListChecks,
  Search,
} from 'lucide-react';

const statusChips = [
  { label: 'Brouillon', className: 'text-slate-600' },
  { label: 'Planifié', className: 'text-blue-700' },
  { label: 'En cours', className: 'text-amber-700' },
  { label: 'Terminé', className: 'text-emerald-700' },
  { label: 'Annulé', className: 'text-rose-700' },
];

const itemTypeChips = ['Travaux', 'Matériel', 'Équipement', 'Déplacement', 'Service', 'Autre'];

const budgetRows = [
  { label: 'CA prévu', hint: 'Total des lignes du chantier' },
  { label: 'CA facturé', hint: 'Total des factures émises' },
  { label: 'CA encaissé', hint: 'Total des paiements reçus' },
  { label: 'Coûts prévus', hint: 'Coûts d’achat estimés des lignes' },
  { label: 'Coûts réels', hint: 'Achats et consommations enregistrées' },
  { label: 'Marge prévisionnelle', hint: 'CA prévu − coûts prévus' },
  { label: 'Marge actuelle', hint: 'CA facturé − coûts réels' },
  { label: 'Marge encaissée', hint: 'CA encaissé − coûts réels' },
];

const sections = [
  { href: '#creer', label: 'Créer un chantier' },
  { href: '#etapes', label: 'Les étapes du chantier' },
  { href: '#remplir', label: 'Remplir depuis l’existant' },
  { href: '#suivi', label: 'Fiches de suivi' },
  { href: '#liens', label: 'Devis, factures, planning' },
  { href: '#budget', label: 'Budget & rentabilité' },
  { href: '#retrouver', label: 'Retrouver vos chantiers' },
];

const raised = 'rounded-[28px] bg-[#e8edf2] shadow-[10px_10px_24px_#c7ced6,-10px_-10px_24px_#ffffff]';
const pressed = 'rounded-2xl bg-[#e8edf2] shadow-[inset_6px_6px_14px_#c7ced6,inset_-6px_-6px_14px_#ffffff]';
const chip = 'rounded-full bg-[#e8edf2] px-3 py-1.5 text-xs font-semibold shadow-[4px_4px_10px_#c7ced6,-4px_-4px_10px_#ffffff]';
const iconBadge = 'flex h-12 w-12 items-center justify-center rounded-full bg-[#e8edf2] text-blue-700 shadow-[6px_6px_14px_#c7ced6,-6px_-6px_14px_#ffffff]';

export default function HelpWorkOrdersPage() {
  return (
    <div className="bg-[#e8edf2] text-slate-700">
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-6 sm:py-24">
        <Link href="/aide" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tous les guides
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Centre d’aide</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">Tout savoir sur les chantiers</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          De la création d’un chantier jusqu’au calcul automatique de sa rentabilité : voici l’ensemble des fonctionnalités à votre disposition.
        </p>
        <nav aria-label="Sections de cette page" className="mt-8 flex flex-wrap justify-center gap-2">
          {sections.map((section) => (
            <a key={section.href} href={section.href} className={`${chip} text-slate-600 transition hover:text-blue-700`}>
              {section.label}
            </a>
          ))}
        </nav>
      </section>

      <section id="creer" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-6">
        <div className={`${raised} p-7 sm:p-9`}>
          <div className="flex items-center gap-4">
            <span className={iconBadge}><FolderOpen className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold text-slate-900">Créer un chantier</h2>
          </div>
          <p className="mt-4 text-slate-600">
            Un chantier regroupe un titre, une description, une référence (générée automatiquement si vous n’en saisissez pas), des dates planifiées, et peut être rattaché à un client, une adresse d’intervention et un projet.
          </p>
          <p className="mt-3 text-slate-600">Chaque chantier suit un statut, qui reflète où il en est :</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {statusChips.map((status) => (
              <span key={status.label} className={`${chip} ${status.className}`}>{status.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="etapes" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-6">
        <div className={`${raised} p-7 sm:p-9`}>
          <div className="flex items-center gap-4">
            <span className={iconBadge}><ListChecks className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold text-slate-900">Les étapes du chantier</h2>
          </div>
          <p className="mt-4 text-slate-600">
            Chaque chantier contient une liste de lignes (ou « étapes ») : travaux, matériel, équipement, déplacement, service... Pour chaque ligne, vous renseignez une quantité, une unité, un prix de vente prévu et, si besoin, un coût d’achat prévu avec sa TVA.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {itemTypeChips.map((type) => (
              <span key={type} className={`${chip} text-slate-600`}>{type}</span>
            ))}
          </div>
          <div className={`mt-5 flex items-center gap-3 ${pressed} p-4`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"><GripVertical className="h-4 w-4" aria-hidden="true" /></span>
            <p className="text-sm text-slate-600">Les étapes se réorganisent par glisser-déposer, ou avec les flèches monter / descendre.</p>
          </div>
        </div>
      </section>

      <section id="remplir" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-6">
        <div className={`${raised} p-7 sm:p-9`}>
          <div className="flex items-center gap-4">
            <span className={iconBadge}><FileText className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold text-slate-900">Remplir un chantier depuis l’existant</h2>
          </div>
          <p className="mt-4 text-slate-600">
            Plutôt que de tout ressaisir, un chantier peut être rempli à partir d’un devis déjà créé (ses lignes sont reprises automatiquement), ou ligne par ligne à partir de votre catalogue d’articles et de prestations.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className={`${chip} text-blue-700`}>Devis existant</span>
            <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className={`${chip} text-blue-700`}>Lignes du chantier</span>
            <span className="text-slate-300">·</span>
            <span className={`${chip} text-blue-700`}>Catalogue</span>
            <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className={`${chip} text-blue-700`}>Ligne de chantier</span>
          </div>
        </div>
      </section>

      <section id="suivi" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-6">
        <div className={`${raised} p-7 sm:p-9`}>
          <div className="flex items-center gap-4">
            <span className={iconBadge}><ClipboardList className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold text-slate-900">Fiches de suivi et consommations</h2>
          </div>
          <p className="mt-4 text-slate-600">
            Pendant le chantier, créez des fiches de suivi : une date, un titre, une description, un temps prévu et un temps réalisé. Chaque fiche peut détailler des lignes de consommation réelle, rattachées à une étape prévue pour comparer facilement le prévu et le réel.
          </p>
          <p className="mt-3 text-slate-600">
            Enregistrer une consommation (matériel, équipement...) met automatiquement à jour votre stock. Si vous supprimez une ligne de consommation ou une fiche entière, le mouvement de stock correspondant est annulé.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className={`${pressed} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fiche de suivi</p>
              <p className="mt-1 text-sm text-slate-700">Date · Titre · Description · Temps prévu · Temps réalisé</p>
            </div>
            <div className={`${pressed} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ligne de consommation</p>
              <p className="mt-1 text-sm text-slate-700">Quantité réelle · Rattachement à l’étape prévue · Mouvement de stock</p>
            </div>
          </div>
        </div>
      </section>

      <section id="liens" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-6">
        <div className={`${raised} p-7 sm:p-9`}>
          <div className="flex items-center gap-4">
            <span className={iconBadge}><CalendarClock className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold text-slate-900">Un chantier, au centre de tout</h2>
          </div>
          <p className="mt-4 text-slate-600">
            Un chantier peut être directement relié à des devis, des factures, des rendez-vous de planning et des documents. Pas besoin de ressaisir une information déjà présente ailleurs : chaque document se retrouve au même endroit.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className={`${chip} text-blue-700`}>Devis</span>
            <span className={`${chip} text-blue-700`}>Factures</span>
            <span className={`${chip} text-blue-700`}>Rendez-vous</span>
            <span className={`${chip} text-blue-700`}>Documents</span>
            <span className={`${chip} text-blue-700`}>Achats</span>
          </div>
        </div>
      </section>

      <section id="budget" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-6">
        <div className={`${raised} p-7 sm:p-9`}>
          <div className="flex items-center gap-4">
            <span className={iconBadge}><Calculator className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold text-slate-900">Budget et rentabilité du projet</h2>
          </div>
          <p className="mt-4 text-slate-600">
            À l’échelle du projet qui regroupe vos chantiers, devis et factures, Workermate calcule automatiquement un tableau de bord budgétaire :
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {budgetRows.map((row) => (
              <div key={row.label} className={`${pressed} p-4`}>
                <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                <p className="mt-1 text-xs text-slate-500">{row.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="retrouver" className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-6">
        <div className={`${raised} p-7 sm:p-9`}>
          <div className="flex items-center gap-4">
            <span className={iconBadge}><Search className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold text-slate-900">Retrouver vos chantiers</h2>
          </div>
          <p className="mt-4 text-slate-600">
            La liste des chantiers se cherche, se trie et se filtre : par mot-clé, par statut, ou pour n’afficher que les chantiers à venir. Chaque chantier affiche son statut, ses dates et son nombre d’étapes en un coup d’œil.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className={`${chip} text-slate-600`}><Search className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Recherche</span>
            <span className={`${chip} text-slate-600`}><Filter className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Filtre par statut</span>
            <span className={`${chip} text-slate-600`}><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />À venir uniquement</span>
            <span className={`${chip} text-slate-600`}><Boxes className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Tri et pagination</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24 text-center sm:px-6">
        <div className={`${raised} p-10 sm:p-14`}>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Envie de voir tout ça en situation ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Découvrez le parcours complet d’un chantier, de l’appel du client jusqu’au paiement de la facture.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/comment-ca-marche" className="inline-flex items-center gap-2 rounded-xl bg-[#e8edf2] px-6 py-3 text-sm font-semibold text-blue-700 shadow-[6px_6px_14px_#c7ced6,-6px_-6px_14px_#ffffff] transition active:shadow-[inset_5px_5px_12px_#c7ced6,inset_-5px_-5px_12px_#ffffff]">
              Voir le parcours complet <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/register" className="inline-flex items-center rounded-xl bg-[#e8edf2] px-6 py-3 text-sm font-semibold text-slate-600 shadow-[inset_4px_4px_10px_#c7ced6,inset_-4px_-4px_10px_#ffffff]">
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
