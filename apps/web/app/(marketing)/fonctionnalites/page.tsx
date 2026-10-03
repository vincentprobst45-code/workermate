import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Bell,
  Boxes,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Landmark,
  MapPin,
  MessageSquare,
  Package,
  Receipt,
  ScrollText,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import SectionNav from './SectionNav';

const sections = [
  { id: 'hero', label: 'Introduction' },
  { id: 'projet', label: 'Projet central' },
  { id: 'creation', label: 'Création rapide' },
  { id: 'association', label: 'Association' },
  { id: 'planning', label: 'Planning' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'stock', label: 'Stock & achats' },
  { id: 'tresorerie', label: 'Trésorerie' },
  { id: 'chantier', label: 'Suivi mobile' },
  { id: 'cta', label: 'Essayer' },
];

const transformations = [
  { code: '01', title: 'Devis → Facture', description: 'Créez une facture à partir de ce devis : client, lignes et adresse repris automatiquement, sans ressaisie.' },
  { code: '02', title: 'Devis → Chantier', description: 'Créez un chantier à partir de ce devis dès qu’il est accepté, avec les informations déjà en place.' },
  { code: '03', title: 'Catalogue → Ligne de devis', description: 'Remplissez une ligne de devis à partir d’un produit du catalogue : libellé, prix et TVA préremplis.' },
  { code: '04', title: 'Client → Rendez-vous', description: 'Créez un rendez-vous pour ce client, directement à son adresse, sans la resaisir.' },
];

const associations = [
  { label: 'Ajouter une facture existante au projet', icon: Receipt },
  { label: 'Ajouter un client existant au devis', icon: Users },
  { label: 'Ajouter une adresse existante au chantier', icon: MapPin },
];

const backOfficeFeatures = [
  { icon: Package, title: 'Catalogue produits', description: 'Vos articles et prestations types, prêts à réutiliser dans devis, factures et chantiers.' },
  { icon: Boxes, title: 'Gestion de stock', description: 'Suivi des quantités disponibles, alertes sur les seuils bas et historique des mouvements.' },
  { icon: ShoppingCart, title: 'Achats', description: 'Commandes fournisseurs rattachées à vos chantiers, pour suivre chaque dépense d’un projet.' },
  { icon: Truck, title: 'Fournisseurs', description: 'Coordonnées, historique d’achats et conditions par fournisseur, centralisés.' },
  { icon: FileText, title: 'Factures fournisseurs', description: 'Réception, classement et rapprochement de vos factures d’achats, sans papier.' },
];

const treasuryFeatures = [
  { icon: TrendingUp, title: 'Prévisions budgétaires', description: 'Anticipez votre trésorerie à venir selon vos devis en cours et vos factures à échoir.' },
  { icon: Landmark, title: 'Multi-comptes', description: 'Suivez plusieurs comptes bancaires et professionnels au même endroit.' },
  { icon: Banknote, title: 'Rapprochement bancaire', description: 'Faites correspondre vos relevés bancaires à vos encaissements et paiements en quelques clics.' },
];

const siteTrackingFeatures = [
  { icon: Package, title: 'Consommations enregistrées', description: 'Notez le matériel et les fournitures utilisés sur chaque chantier, au fil de l’avancement.' },
  { icon: Camera, title: 'Photos avant / après', description: 'Documentez l’état initial et final de chaque intervention, directement depuis le mobile.' },
  { icon: Clock, title: 'Temps prévu / passé', description: 'Comparez le temps estimé au temps réellement passé sur chaque chantier.' },
  { icon: TrendingUp, title: 'Rentabilité automatique', description: 'La marge de chaque chantier se calcule seule, à partir des coûts et du temps enregistrés.' },
];

export default function FeaturesPage() {
  return (
    <>
      <SectionNav sections={sections} />
      <section id="hero" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-blue-50">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            <span>Fonctionnalités</span>
            <span>Workermate</span>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Un outil qui organise
              <br />
              votre entreprise autour
              <br />
              du chantier.
            </h1>
            <div className="border-t border-blue-700 pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <p className="text-blue-200">
                Clients, adresses, devis, chantiers, factures, stock, achats et trésorerie : chaque fonctionnalité de Workermate est pensée pour se connecter aux autres, sans double saisie.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50">
                  Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="inline-flex items-center rounded-lg border border-blue-400/50 px-5 py-3 text-sm font-semibold text-blue-50 transition hover:bg-blue-800">
                  Voir les tarifs
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-16 grid gap-6 border-t border-blue-800 pt-6 text-xs uppercase tracking-wide text-blue-300 sm:grid-cols-3">
            <p>Projets · Planning · Employés</p>
            <p>Clients · Adresses · Chantiers</p>
            <p>Devis · Factures · Catalogue</p>
          </div>
        </div>
      </section>

      <section id="projet" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Fonctionnalité centrale</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Le projet, au cœur de tout.</h2>
            <p className="mt-4 text-slate-600">
              Chez Workermate, tout part du projet. Client, devis, chantier, facture, planning : chaque document et chaque échange se rattache automatiquement au bon projet, sans classeur à tenir à jour à la main.
            </p>
            <p className="mt-3 text-slate-600">
              Vous ouvrez un projet une seule fois, et retrouvez ensuite tout son historique — devis envoyés, chantiers en cours, factures émises — au même endroit.
            </p>
            <Link href="/fonctionnalites/projets" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
              En savoir plus <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
            <div className="flex flex-col items-center">
              {['Devis', 'Chantier', 'Facture'].map((label, index) => (
                <div
                  key={label}
                  className={`flex h-32 w-32 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-semibold uppercase tracking-wide text-blue-800 shadow-sm ${index > 0 ? '-mt-9' : ''}`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 sm:flex-col sm:items-start">
              <span className="h-24 w-px bg-blue-200 sm:h-40" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                Projet
                <span className="mt-1 block font-normal normal-case tracking-normal text-slate-500">Tout regroupé au même endroit</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="creation" className="scroll-mt-24 bg-blue-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Gain de temps</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Créez à partir de l’existant</h2>
            <p className="mt-4 text-slate-600">Un seul geste suffit pour transformer un document en un autre, sans jamais retaper une information déjà connue.</p>
          </div>
          <div className="mt-10 divide-y divide-blue-200 border-y border-blue-200">
            {transformations.map(({ code, title, description }) => (
              <div key={code} className="grid gap-2 py-7 sm:grid-cols-[6rem_1fr] sm:items-baseline sm:gap-8">
                <p className="text-4xl font-bold text-blue-900 sm:text-5xl">{code}</p>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{title}</p>
                  <p className="mt-1 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="association" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Association automatique</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Réutilisez ce qui existe déjà</h2>
            <p className="mt-4 text-slate-600">Pas besoin de recréer une fiche client, une adresse ou une facture : associez simplement ce qui existe déjà au bon endroit.</p>
          </div>
          <ul className="space-y-4">
            {associations.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="planning" className="scroll-mt-24 bg-blue-950 py-20 text-blue-50 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">Planning</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Un planning complet et interactif</h2>
              <p className="mt-4 text-blue-200">
                Rendez-vous, visites et interventions dans un calendrier unique. Chaque événement peut être détaillé, filtré par employé, et vous donne un accès rapide aux données du client ou du chantier concerné.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-blue-100">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" /> Détail complet de chaque événement</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" /> Gestion et filtrage par employé</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" /> Accès rapide aux données d’intérêt</li>
              </ul>
              <Link href="/fonctionnalites/planning" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:underline">
                En savoir plus <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-2xl border border-blue-800 bg-blue-900/60 p-6 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-blue-300">
                <span>Semaine du 12 octobre</span>
                <span>4 employés</span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-blue-800/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-50">Pose de carrelage</p>
                    <p className="text-xs text-blue-300">08h30 · Julien M.</p>
                  </div>
                  <MapPin className="h-4 w-4 text-blue-300" aria-hidden="true" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-blue-800/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-50">Visite technique</p>
                    <p className="text-xs text-blue-300">10h00 · Sarah D.</p>
                  </div>
                  <MapPin className="h-4 w-4 text-blue-300" aria-hidden="true" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-blue-800/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-50">Rénovation salle de bain</p>
                    <p className="text-xs text-blue-300">14h00 · Équipe complète</p>
                  </div>
                  <MapPin className="h-4 w-4 text-blue-300" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="equipe" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><MessageSquare className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Sarah D.</p>
                <p className="text-sm text-slate-600">Le client du 14h a reporté à demain matin.</p>
              </div>
            </div>
            <div className="ml-8 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700"><Bell className="h-5 w-5" aria-hidden="true" /></span>
              <p className="text-sm text-slate-700">Nouvelle facture assignée à valider.</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Équipe</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Une gestion intra-entreprise facilitée</h2>
            <p className="mt-4 text-slate-600">
              Messagerie et notifications entre employés directement dans l’application : plus besoin de jongler entre plusieurs outils pour se coordonner sur un chantier ou une facture.
            </p>
          </div>
        </div>
      </section>

      <section id="stock" className="scroll-mt-24 bg-blue-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Stock &amp; achats</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Du catalogue au fournisseur</h2>
            <p className="mt-4 text-slate-600">Suivez vos articles, vos stocks et vos achats fournisseurs sans quitter Workermate.</p>
            <Link href="/fonctionnalites/stock" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
              En savoir plus <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {backOfficeFeatures.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tresorerie" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Trésorerie</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Une trésorerie claire et anticipée</h2>
          <p className="mt-4 text-slate-600">Prévisions budgétaires, plusieurs comptes bancaires et rapprochement automatique : gardez une vision précise de votre trésorerie à tout instant.</p>
          <Link href="/fonctionnalites/tresorerie" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
            En savoir plus <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {treasuryFeatures.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="chantier" className="scroll-mt-24 bg-blue-950 py-20 text-blue-50 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">Sur le terrain</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Un suivi de chantier pensé pour le mobile</h2>
            <p className="mt-4 text-blue-200">Depuis le chantier, sur un téléphone, enregistrez ce qui compte réellement — et laissez Workermate calculer la rentabilité à votre place.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {siteTrackingFeatures.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-blue-800 bg-blue-900/60 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-blue-200"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-semibold text-blue-50">{title}</h3>
                <p className="mt-2 text-sm text-blue-200">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Fonctionnalités</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
          <ScrollText className="mx-auto mb-4 h-10 w-10 text-blue-600" aria-hidden="true" />
          Prêt à tout organiser au même endroit ?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Essayez Workermate gratuitement et découvrez comment vos projets, vos chantiers et votre trésorerie peuvent enfin tenir ensemble.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Essayer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/pricing" className="inline-flex items-center rounded-lg border border-blue-200 px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
            Voir les tarifs
          </Link>
        </div>
      </section>
    </>
  );
}
