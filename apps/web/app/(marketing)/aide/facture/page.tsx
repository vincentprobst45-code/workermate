import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Ban, BellRing, Check, Download, FileCheck2, FilePenLine, Mail, Repeat2, Send } from 'lucide-react';
import AnchorLink from './AnchorLink';
import InvoiceAnatomy from './InvoiceAnatomy';
import PaymentMeter from './PaymentMeter';
import ReminderPlanner from './ReminderPlanner';
import SectionNav from './SectionNav';
import TaskFinder from './TaskFinder';
import Tabs from './Tabs';
import TotalsSimulator from './TotalsSimulator';
import styles from './facture.module.css';

export const metadata: Metadata = {
  title: 'Facturation : créer, envoyer, encaisser et corriger une facture | Aide Workermate',
  description:
    'Le guide du module Factures de Workermate : créer une facture, comprendre le net à payer, l’envoyer, enregistrer paiements et acomptes, émettre un avoir et activer les relances.',
};

const ink = 'text-[#0b2545]';
const body = 'text-[#223d5c]';
const muted = 'text-[#465f80]';
const inlineLink = 'font-semibold text-[#153f93] underline decoration-[#1d56c0]/45 underline-offset-4 transition hover:decoration-[#1d56c0]';

const mists: Array<{ top: string; side: 'left' | 'right'; offset: string; size: string; color: string }> = [
  { top: '3%', side: 'right', offset: '-14vw', size: '58vw', color: 'rgba(150,192,236,0.55)' },
  { top: '21%', side: 'left', offset: '-18vw', size: '56vw', color: 'rgba(255,255,255,0.85)' },
  { top: '43%', side: 'right', offset: '-16vw', size: '62vw', color: 'rgba(140,185,232,0.45)' },
  { top: '65%', side: 'left', offset: '-12vw', size: '52vw', color: 'rgba(255,255,255,0.75)' },
  { top: '85%', side: 'right', offset: '-10vw', size: '56vw', color: 'rgba(150,192,236,0.5)' },
];

function Ui({ children }: { children: ReactNode }) {
  return <strong className={`font-semibold ${ink}`}>«&nbsp;{children}&nbsp;»</strong>;
}

function Path({ items }: { items: string[] }) {
  return (
    <ol className={styles.path} aria-label="Chemin dans Workermate">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

function SectionHead({ n, kicker, id, title }: { n: string; kicker: string; id: string; title: ReactNode }) {
  return (
    <header className="grid items-end gap-x-8 gap-y-3 md:grid-cols-[auto_minmax(0,1fr)]">
      <span className={styles.bigNum} aria-hidden="true">{n}</span>
      <div>
        <p className={styles.eyebrow}>{kicker}</p>
        <h2 id={id} className={`${styles.display} mt-2 text-[clamp(2rem,3.7vw,3.1rem)]`}>{title}</h2>
      </div>
    </header>
  );
}

function Bullet({ children, icon: Icon = Check }: { children: ReactNode; icon?: typeof Check }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-1.5 h-4 w-4 shrink-0 text-[#1d56c0]" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

const kinds = [
  {
    id: 'standard',
    label: 'Facture standard',
    hint: 'Le cas courant',
    path: ['Factures', 'Créer une nouvelle facture', 'Facture standard'],
    text: 'La facture classique : une prestation ou une fourniture, facturée en une fois. Remplissez le client, le chantier et les lignes, puis émettez.',
  },
  {
    id: 'acompte',
    label: 'Facture d’acompte',
    hint: 'Avant les travaux',
    path: ['Factures', 'Créer une nouvelle facture', 'Facture d’acompte'],
    text: 'Pour réclamer ou constater une avance. Quand l’acompte est demandé sur un devis, vous pouvez aussi l’enregistrer depuis la page Devis.',
    link: { to: 'acompte', label: 'Enregistrer un acompte' },
  },
  {
    id: 'situation',
    label: 'Facture de situation',
    hint: 'En cours de chantier',
    path: ['Factures', 'Créer une nouvelle facture', 'Facture de situation'],
    text: 'Pour facturer l’avancement d’un chantier par étapes. Les facturations précédentes peuvent être conservées en référence dans le récapitulatif.',
  },
  {
    id: 'solde',
    label: 'Facture de solde',
    hint: 'En fin de chantier',
    path: ['Factures', 'Créer une nouvelle facture', 'Facture de solde'],
    text: 'Pour facturer le reste dû. Saisissez les acomptes déjà versés dans le champ Acompte : ils sont déduits du net à payer.',
    link: { to: 'calcul', label: 'Voir le calcul' },
  },
  {
    id: 'rectificative',
    label: 'Facture rectificative',
    hint: 'Remplacer une facture',
    path: ['Factures', 'Créer une nouvelle facture', 'Facture rectificative'],
    text: 'Pour remplacer les informations d’une facture déjà émise. Vous choisissez la facture à corriger ; son numéro et sa date sont conservés sur la nouvelle.',
    link: { to: 'corriger', label: 'Corriger une facture' },
  },
  {
    id: 'avoir',
    label: 'Avoir',
    hint: 'Annuler financièrement',
    path: ['Factures', 'Créer une nouvelle facture', 'Avoir'],
    text: 'Pour annuler financièrement une facture émise. Vous choisissez la facture concernée, qui reste référencée sur l’avoir.',
    link: { to: 'corriger', label: 'Corriger une facture' },
  },
];

const faqs: Array<{ q: string; a: ReactNode }> = [
  {
    q: 'Pourquoi ne puis-je pas supprimer ma facture ?',
    a: (
      <>
        Seul un brouillon se supprime. Une facture émise se corrige : par un avoir pour l’annuler financièrement, ou par une facture rectificative pour remplacer ses informations.{' '}
        <AnchorLink to="corriger" className={inlineLink}>Voir comment corriger</AnchorLink>.
      </>
    ),
  },
  {
    q: 'Le bouton « Envoyer par email » ne fonctionne pas.',
    a: (
      <>
        Vérifiez que la fiche du client contient une adresse email valide : sans elle, l’envoi est refusé. Ouvrez ensuite les détails de la facture : l’historique des envois indique le statut (Envoyé, Échec ou En cours) et, en cas d’échec, le message d’erreur.
      </>
    ),
  },
  {
    q: 'Le numéro de ma facture est vide dans le formulaire.',
    a: 'C’est normal : le numéro est attribué à l’enregistrement, pas avant. Il suit le format préfixe, année et compteur, par exemple FAC-2026-0042.',
  },
  {
    q: 'Pourquoi le net à payer est-il inférieur au total TTC ?',
    a: (
      <>
        Parce qu’un acompte a été saisi dans le champ Acompte : il est déduit du total TTC. Le total TTC, lui, n’est jamais réduit par l’acompte.{' '}
        <AnchorLink to="calcul" className={inlineLink}>Essayer le simulateur</AnchorLink>.
      </>
    ),
  },
  {
    q: 'J’ai enregistré un paiement par erreur.',
    a: (
      <>
        Sur un brouillon, supprimez le paiement. Sur une facture émise, annulez-le en indiquant une raison : il reste visible, marqué comme annulé, et le règlement de la facture est recalculé.{' '}
        <AnchorLink to="annuler-paiement" className={inlineLink}>Voir le détail</AnchorLink>.
      </>
    ),
  },
  {
    q: 'Aucune relance n’est partie pour ma facture en retard.',
    a: (
      <>
        Une relance n’est envoyée que si les relances sont activées dans la fiche Entreprise, si la facture est émise et non soldée, si son échéance est dépassée du délai choisi, si le client a une adresse email et si le nombre maximum de relances n’est pas atteint. Le contrôle s’effectue toutes les heures.
      </>
    ),
  },
];

export default function InvoiceHelpPage() {
  return (
    <div className={styles.root}>
      <div className={styles.sky} aria-hidden="true" />
      {mists.map((mist) => (
        <span
          key={mist.top}
          aria-hidden="true"
          className={styles.mist}
          style={{ top: mist.top, [mist.side]: mist.offset, width: mist.size, height: mist.size, '--mist-color': mist.color } as CSSProperties}
        />
      ))}

      <div className={styles.content}>
        {/* ------------------------------------------------------------ Hero */}
        <section id="debut" aria-labelledby="titre-page" className="px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
          <div className="mx-auto max-w-[78rem]">
            <Link href="/aide" className={`${styles.btn} px-4 py-2.5`}>
              <ArrowLeft className="h-4 w-4 text-[#1d56c0]" aria-hidden="true" /> Centre d’aide
            </Link>

            <div className="mt-10 grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-16">
              <div className="lg:self-center">
                <p className={styles.eyebrow}>Centre d’aide · Facturation</p>
                <h1 id="titre-page" className={`${styles.display} mt-4 text-[clamp(2.5rem,5.3vw,4.4rem)]`}>
                  La facture, du brouillon <em>au dernier euro encaissé.</em>
                </h1>
                <p className={`mt-6 max-w-xl text-[1.125rem] leading-relaxed ${body}`}>
                  Créer, émettre, envoyer, encaisser, corriger : chaque geste du module Factures, expliqué avec les mots de l’écran et le chemin pour y arriver.
                </p>
                <div className="mt-9 max-w-xl">
                  <TaskFinder />
                </div>
              </div>

              <InvoiceAnatomy />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[78rem] px-4 sm:px-6 lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-14">
          <SectionNav />

          <div className="min-w-0 space-y-28 pb-28 sm:space-y-36">
            {/* ------------------------------------------------ 01 Vue d'ensemble */}
            <section id="cycle" aria-labelledby="cycle-titre" className="scroll-mt-28">
              <SectionHead n="01" kicker="Vue d’ensemble" id="cycle-titre" title={<>Deux suivis en parallèle&nbsp;: <em>le document</em> et <em>l’argent</em>.</>} />
              <p className={`mt-6 max-w-2xl ${body}`}>
                Une facture avance sur deux voies indépendantes. Le statut dit où en est le document ; le règlement dit où en est l’encaissement.
              </p>

              <div className={`${styles.glass} mt-10 grid gap-8 p-5 sm:p-8`}>
                {[
                  {
                    label: 'Le document',
                    nodes: [
                      { title: 'Brouillon', text: 'Enregistrée comme brouillon, la facture reste modifiable.' },
                      { title: 'Émise', text: 'Émise avec succès, elle ne peut plus être supprimée : on la corrige.' },
                    ],
                  },
                  {
                    label: 'L’argent',
                    nodes: [
                      { title: 'Non payée', text: 'Aucun paiement enregistré.' },
                      { title: 'Partiellement payée', text: 'Des paiements sont enregistrés, sans couvrir encore le net à payer.' },
                      { title: 'Payée', text: 'Les paiements enregistrés couvrent le net à payer.' },
                    ],
                  },
                ].map((lane) => (
                  <div key={lane.label}>
                    <p className={styles.eyebrow}>{lane.label}</p>
                    <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                      {lane.nodes.flatMap((node, i) => [
                        <li key={node.title} className={`${styles.well} flex-1 p-4`}>
                          <p className={`${styles.serif} text-xl font-semibold ${ink}`}>{node.title}</p>
                          <p className={`mt-1 text-[0.9375rem] leading-relaxed ${body}`}>{node.text}</p>
                        </li>,
                        i < lane.nodes.length - 1 ? (
                          <li key={`${node.title}-arrow`} aria-hidden="true" className="grid place-items-center text-[#1d56c0]">
                            <ArrowRight className="hidden h-5 w-5 sm:block" />
                            <ArrowRight className="h-5 w-5 rotate-90 sm:hidden" />
                          </li>
                        ) : null,
                      ])}
                    </ol>
                  </div>
                ))}
                <p className={`text-[0.9375rem] ${muted}`}>
                  Le règlement se recalcule à chaque paiement ajouté ou annulé. Le montant reçu apparaît dans la colonne <Ui>Paiements reçus</Ui> de la liste des factures.
                </p>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className={`${styles.paper} p-6 sm:p-8`}>
                  <p className={styles.eyebrow}>Tant que c’est un brouillon</p>
                  <ul className={`mt-4 grid gap-3 text-[1rem] ${body}`}>
                    <Bullet>La modifier avec <Ui>Modifier la facture</Ui>.</Bullet>
                    <Bullet>La supprimer avec <Ui>Supprimer</Ui>. Ses paiements éventuels partent avec elle, après confirmation.</Bullet>
                    <Bullet>Supprimer un paiement saisi par erreur.</Bullet>
                    <Bullet>L’émettre avec <Ui>Émettre la facture</Ui>.</Bullet>
                  </ul>
                </div>
                <div className={`${styles.paper} p-6 sm:p-8`}>
                  <p className={styles.eyebrow}>Une fois émise</p>
                  <ul className={`mt-4 grid gap-3 text-[1rem] ${body}`}>
                    <Bullet>L’envoyer par email ou la télécharger en PDF.</Bullet>
                    <Bullet>Enregistrer les paiements reçus.</Bullet>
                    <Bullet>Annuler un paiement, avec une raison obligatoire.</Bullet>
                    <Bullet icon={FilePenLine}>La corriger avec <Ui>Corriger</Ui> : avoir ou facture rectificative.</Bullet>
                  </ul>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------------ 02 Préparer */}
            <section id="preparer" aria-labelledby="preparer-titre" className="scroll-mt-28">
              <SectionHead n="02" kicker="Avant de commencer" id="preparer-titre" title={<>Réglez l’entreprise une fois, <em>tous les documents suivent</em>.</>} />

              <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
                <div className="grid gap-6">
                  <p className={`max-w-xl ${body}`}>
                    La fiche Entreprise alimente chaque nouvelle facture : identité légale, adresse, TVA, conditions de règlement, compte bancaire. Les changements s’appliquent aux nouveaux documents ; ceux qui existent déjà ne bougent pas.
                  </p>
                  <Path items={['Entreprise', 'Modifier']} />

                  <div className={`${styles.glass} p-5 sm:p-6`}>
                    <p className={styles.eyebrow}>Numérotation</p>
                    <p className={`mt-2 text-[1rem] ${body}`}>Le numéro est attribué à l’enregistrement et suit trois parties. Le préfixe est FAC par défaut.</p>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                      {[
                        ['FAC', 'préfixe'],
                        ['2026', 'année'],
                        ['0042', 'compteur'],
                      ].map(([value, label]) => (
                        <div key={label} className={`${styles.well} flex flex-col-reverse px-2 py-3`}>
                          <dt className={`mt-0.5 text-[0.8125rem] leading-snug ${muted}`}>{label}</dt>
                          <dd className={`${styles.serif} num text-2xl font-semibold ${ink}`}>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className={`mt-4 text-[0.9375rem] ${muted}`}>Le compteur repart à 0001 chaque année.</p>
                  </div>
                </div>

                <fieldset className={`${styles.paper} min-w-0 p-6 sm:p-8`}>
                  <legend className="sr-only">Liste de contrôle avant la première facture</legend>
                  <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Votre liste avant la première facture</p>
                  <p className={`mt-1 text-[0.9375rem] ${muted}`}>Cochez au fil de l’eau : rien n’est enregistré, c’est un simple pense-bête.</p>
                  <ul className="mt-5 divide-y divide-[#9fb8d8]/45">
                    {[
                      ['Identité et contact', 'Nom, téléphone, email, SIRET (14 chiffres, sans espaces) et TVA intracommunautaire.'],
                      ['Adresse de facturation', 'Nouvelle adresse ou adresse existante : elle s’affiche sur vos factures et devis.'],
                      ['Régime de TVA', 'Franchise en base ou Assujetti à la TVA. Si vous êtes assujetti, indiquez aussi la fréquence de déclaration : mensuelle ou trimestrielle.'],
                      ['Valeurs par défaut', 'Conditions de règlement, mentions légales, note de bas de document et devise (EUR par défaut).'],
                      ['Compte bancaire par défaut', 'Ajoutez un compte bancaire et désignez-en un seul comme compte par défaut : il pourra être utilisé sur vos factures et devis.'],
                      ['Email de vos clients', 'Sans adresse email dans la fiche client, la facture ne peut pas être envoyée et les relances ne partent pas.'],
                    ].map(([title, text]) => (
                      <li key={title}>
                        <label className="flex cursor-pointer gap-4 py-4">
                          <input type="checkbox" className={styles.check} />
                          <span>
                            <span className={`block font-semibold ${ink}`}>{title}</span>
                            <span className={`mt-0.5 block text-[0.9375rem] leading-relaxed ${body}`}>{text}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              </div>
            </section>

            {/* --------------------------------------------------------- 03 Créer */}
            <section id="creer" aria-labelledby="creer-titre" className="scroll-mt-28">
              <SectionHead n="03" kicker="Créer une facture" id="creer-titre" title={<>Choisir le type, puis <em>reprendre ce qui existe</em>.</>} />
              <p className={`mt-6 max-w-2xl ${body}`}>
                Tout part de la page Factures. Le menu <Ui>Créer une nouvelle facture</Ui> propose six types ; le formulaire s’adapte ensuite à votre choix.
              </p>

              <div id="types" className="mt-10 scroll-mt-28">
                <Tabs
                  label="Types de facture"
                  tabs={kinds.map((kind) => ({
                    id: kind.id,
                    label: kind.label,
                    hint: kind.hint,
                    panel: (
                      <div>
                        <p className={styles.eyebrow}>{kind.hint}</p>
                        <p className={`${styles.display} mt-2 text-3xl`}>{kind.label}</p>
                        <p className={`mt-4 max-w-xl text-[1.0625rem] ${body}`}>{kind.text}</p>
                        <div className="mt-5">
                          <Path items={kind.path} />
                        </div>
                        {kind.link && (
                          <p className="mt-5">
                            <AnchorLink to={kind.link.to} className={inlineLink}>{kind.link.label} →</AnchorLink>
                          </p>
                        )}
                      </div>
                    ),
                  }))}
                />
              </div>

              <div id="sources" className="mt-20 scroll-mt-28">
                <p className={styles.eyebrow}>Partir de l’existant</p>
                <h3 className={`${styles.display} mt-2 max-w-2xl text-[clamp(1.6rem,2.6vw,2.2rem)]`}>Quatre façons de ne rien ressaisir</h3>

                <div className="mt-8 grid gap-6 lg:grid-cols-12">
                  <article className={`${styles.paper} p-6 sm:p-8 lg:col-span-7`}>
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Depuis un devis</p>
                    <div className="mt-3"><Path items={['Factures', 'Créer une nouvelle facture', 'Remplir à partir d’un devis existant']} /></div>
                    <p className={`mt-4 ${body}`}>
                      Choisissez le devis dans la liste : le client, les lignes et les montants sont repris. Si vous avez déjà saisi des informations, une confirmation vous précise ce qui sera remplacé avant d’aller plus loin.
                    </p>
                    <p className={`mt-3 text-[0.9375rem] ${muted}`}>
                      Pour ne reprendre que les lignes, utilisez <Ui>+ Ajouter une ligne</Ui> puis <Ui>Depuis le devis</Ui>. <Ui>Associer un devis</Ui>, dans « Infos facture », relie simplement la facture au devis.
                    </p>
                  </article>

                  <article className={`${styles.glass} p-6 sm:p-8 lg:col-span-5 lg:mt-14`}>
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Depuis un chantier</p>
                    <div className="mt-3"><Path items={['Factures', 'Créer une nouvelle facture', 'Remplir à partir d’un chantier existant']} /></div>
                    <p className={`mt-4 ${body}`}>
                      La facture reprend le chantier et ses lignes. Là encore, <Ui>Depuis le chantier</Ui> dans <Ui>+ Ajouter une ligne</Ui> n’ajoute que les lignes.
                    </p>
                  </article>

                  <article className={`${styles.glass} p-6 sm:p-8 lg:col-span-5`}>
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Depuis un projet</p>
                    <div className="mt-3"><Path items={['Projets', 'Votre projet', 'Documents', 'Créer une facture']} /></div>
                    <p className={`mt-4 ${body}`}>
                      La facture est rattachée au projet : elle apparaît avec ses devis dans l’onglet Documents. <Ui>Associer une facture</Ui> rattache au projet une facture déjà créée.
                    </p>
                    <p className={`mt-3 text-[0.9375rem] ${muted}`}>Les montants facturés et encaissés alimentent le budget du projet.</p>
                  </article>

                  <article className={`${styles.paper} p-6 sm:p-8 lg:col-span-7 lg:mt-8`}>
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Ligne par ligne</p>
                    <div className="mt-3"><Path items={['Factures', 'Créer une nouvelle facture', '+ Ajouter une ligne']} /></div>
                    <p className={`mt-4 ${body}`}>Quatre sources possibles pour chaque ligne :</p>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {['Depuis le catalogue', 'Ligne libre', 'Depuis le devis', 'Depuis le chantier'].map((label) => (
                        <li key={label} className={`${styles.well} px-4 py-2.5 text-[0.9375rem] font-semibold ${ink}`}>{label}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </div>

              <div id="gestes" className="mt-20 scroll-mt-28">
                <p className={styles.eyebrow}>Pas à pas</p>
                <h3 className={`${styles.display} mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)]`}>Les cinq gestes</h3>
                <ol className="relative mt-8 grid gap-8">
                  <span aria-hidden="true" className="absolute bottom-8 left-[1.6rem] top-8 w-0.5" style={{ background: 'repeating-linear-gradient(to bottom, rgba(29,86,192,0.45) 0 5px, transparent 5px 11px)' }} />
                  {[
                    { title: 'Choisir le type', text: <>Ouvrez <Ui>Créer une nouvelle facture</Ui>, puis choisissez le type dans le menu.</> },
                    { title: 'Renseigner le client et le chantier', text: <><Ui>Remplir depuis un client existant</Ui> ou <Ui>Nouveau client</Ui> ; même principe pour le chantier avec <Ui>Remplir depuis un chantier existant</Ui> ou <Ui>Nouveau chantier</Ui>.</> },
                    { title: 'Composer les lignes', text: <>Ajoutez-les, ordonnez-les, appliquez remises et frais. Tout est détaillé <AnchorLink to="lignes" className={inlineLink}>dans la section suivante</AnchorLink>.</> },
                    { title: 'Contrôler l’aperçu', text: <><Ui>Afficher l’aperçu</Ui> sur mobile, <Ui>Voir l’aperçu</Ui> sur ordinateur. Vérifiez les totaux, la TVA et le net à payer.</> },
                  ].map((step, i) => (
                    <li key={step.title} className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-5">
                      <span className={`${styles.well} ${styles.serif} grid h-[3.25rem] w-[3.25rem] place-items-center !rounded-full text-xl font-semibold text-[#153f93]`}>{i + 1}</span>
                      <div className="pt-1.5">
                        <p className={`text-lg font-semibold ${ink}`}>{step.title}</p>
                        <p className={`mt-1 max-w-2xl ${body}`}>{step.text}</p>
                      </div>
                    </li>
                  ))}
                  <li className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-5">
                    <span className={`${styles.well} ${styles.serif} grid h-[3.25rem] w-[3.25rem] place-items-center !rounded-full text-xl font-semibold text-[#153f93]`}>5</span>
                    <div className="pt-1.5">
                      <p className={`text-lg font-semibold ${ink}`}>Enregistrer ou émettre</p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div className={`${styles.paper} p-5`}>
                          <p className={`flex items-center gap-2 font-semibold ${ink}`}><FileCheck2 className="h-4 w-4 text-[#1d56c0]" aria-hidden="true" /> Enregistrer comme brouillon</p>
                          <p className={`mt-1.5 text-[0.9375rem] leading-relaxed ${body}`}>« Facture enregistrée comme brouillon. » Le numéro est attribué, la facture reste modifiable et supprimable.</p>
                        </div>
                        <div className={`${styles.paper} p-5`}>
                          <p className={`flex items-center gap-2 font-semibold ${ink}`}><Send className="h-4 w-4 text-[#1d56c0]" aria-hidden="true" /> Émettre la facture</p>
                          <p className={`mt-1.5 text-[0.9375rem] leading-relaxed ${body}`}>« Facture émise avec succès. » Elle peut alors être envoyée au client et ne se supprime plus.</p>
                        </div>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            {/* ------------------------------------------------ 04 Lignes et TVA */}
            <section id="lignes" aria-labelledby="lignes-titre" className="scroll-mt-28">
              <SectionHead n="04" kicker="Lignes, remises et TVA" id="lignes-titre" title={<>Ce que vous saisissez, <em>ce que Workermate calcule</em>.</>} />

              <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
                <div className={`${styles.paper} divide-y divide-[#9fb8d8]/45 px-6 sm:px-8`}>
                  <div className="py-7">
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Une ligne</p>
                    <p className={`mt-2 ${body}`}>Chaque ligne porte un libellé, une quantité, une unité, un prix unitaire HT et un taux de TVA. Son total HT se calcule tout seul.</p>
                    <p className={`mt-3 ${body}`}>
                      Les flèches ↑ et ↓, ou la poignée ≡ à glisser, déplacent la ligne ; <Ui>X</Ui> la retire.
                    </p>
                    <p className={`mt-3 ${body}`}>
                      <Ui>••• Options avancées</Ui> ouvre le type de ligne (Travaux, Matériel, Équipement, Déplacement, Service, Autre), une description détaillée et <Ui>+ Ajouter une remise ou des frais de ligne</Ui>.
                    </p>
                  </div>

                  <div id="remises" className="scroll-mt-28 py-7">
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Remises et frais</p>
                    <p className={`mt-2 ${body}`}>
                      Pour toute la facture : <Ui>+ Ajouter une remise ou des frais</Ui>, dans « Ajustements de facture ». Vous choisissez :
                    </p>
                    <ul className={`mt-3 grid gap-2 ${body}`}>
                      <Bullet>le type : Remise ou Frais / charge ;</Bullet>
                      <Bullet>le montant HT, avec si besoin une base HT et un pourcentage ;</Bullet>
                      <Bullet>un motif et son code, facultatifs ;</Bullet>
                      <Bullet>la catégorie et le taux de TVA applicables.</Bullet>
                    </ul>
                  </div>

                  <div className="py-7">
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>La TVA</p>
                    <p className={`mt-2 ${body}`}>
                      Chaque ligne a son taux. Une remise ou des frais ont leur propre catégorie : Standard, Exonérée, Autoliquidation, Intracommunautaire, Export, Hors champ ou Taux zéro. La ventilation par taux s’affiche dans « Infos facture ».
                    </p>
                  </div>
                </div>

                <div id="calcul" className="scroll-mt-28 lg:sticky lg:top-28">
                  <div className={`${styles.well} mb-5 grid gap-1 px-5 py-4 text-center`}>
                    <p className={`${styles.serif} text-[1.0625rem] ${ink}`}>lignes − remises + frais = <strong>total HT</strong></p>
                    <p className={`${styles.serif} text-[1.0625rem] ${ink}`}>+ TVA = <strong>total TTC</strong></p>
                    <p className={`${styles.serif} text-[1.0625rem] ${ink}`}>− acompte versé = <strong>net à payer</strong></p>
                  </div>
                  <TotalsSimulator />
                </div>
              </div>
            </section>

            {/* ------------------------------------------------------ 05 Envoyer */}
            <section id="envoyer" aria-labelledby="envoyer-titre" className="scroll-mt-28">
              <SectionHead n="05" kicker="Envoyer et télécharger" id="envoyer-titre" title={<>Du brouillon au <em>client</em>, avec une trace.</>} />

              <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
                <div className="grid gap-8">
                  <div>
                    <Path items={['Factures', 'Clic sur la facture', 'Détails facture']} />
                    <p className={`mt-4 max-w-xl ${body}`}>
                      Dans la liste, cliquez sur une facture : la fenêtre <Ui>Détails facture</Ui> s’ouvre avec l’aperçu, les paiements et l’historique.
                    </p>
                  </div>
                  <ul className="grid gap-6">
                    {[
                      { icon: Mail, title: 'Envoyer par email', text: 'La facture part à l’adresse du client. Sans adresse email dans sa fiche, l’envoi est refusé : renseignez-la d’abord.' },
                      { icon: Download, title: 'Télécharger la facture', text: 'Génère le PDF et le télécharge sous le nom facture-NUMÉRO.pdf, prêt à être imprimé ou transmis autrement.' },
                    ].map(({ icon: Icon, title, text }) => (
                      <li key={title} className="flex gap-4">
                        <span className={`${styles.well} grid h-12 w-12 shrink-0 place-items-center text-[#1d56c0]`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                        <div>
                          <p className={`font-semibold ${ink}`}>{title}</p>
                          <p className={`mt-0.5 max-w-lg ${body}`}>{text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div id="historique" className={`${styles.glass} scroll-mt-28 p-5 sm:p-7`}>
                  <p className={styles.eyebrow}>Historique des envois</p>
                  <p className={`${styles.serif} mt-1 text-2xl font-semibold ${ink}`}>Chaque envoi laisse sa trace</p>
                  <ul className="mt-5 grid gap-3">
                    {[
                      { status: 'Envoyé', icon: Check, detail: 'claire.fontaine@exemple.fr · 02/10/2026', tone: 'text-[#14532d]' },
                      { status: 'Échec', icon: Ban, detail: 'c.fontaine@exemple.fr · 01/10/2026', note: 'Le message d’erreur s’affiche sous la ligne.', tone: 'text-[#8a1c1c]' },
                      { status: 'En cours', icon: Send, detail: 'claire.fontaine@exemple.fr · 02/10/2026', tone: 'text-[#7a4a05]' },
                    ].map(({ status, icon: Icon, detail, note, tone }) => (
                      <li key={status} className={`${styles.well} px-4 py-3`}>
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                          <span className={`flex items-center gap-2 font-semibold ${tone}`}><Icon className="h-4 w-4" aria-hidden="true" />{status}</span>
                          <span className={`num text-[0.875rem] ${body}`}>{detail}</span>
                        </div>
                        {note && <p className={`mt-1 text-[0.875rem] ${muted}`}>{note}</p>}
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-4 text-[0.875rem] ${muted}`}>Adresses et dates données à titre d’exemple.</p>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------- 06 Encaisser */}
            <section id="encaisser" aria-labelledby="encaisser-titre" className="scroll-mt-28">
              <SectionHead n="06" kicker="Encaisser" id="encaisser-titre" title={<>Paiements, acomptes&nbsp;: <em>le reste à payer se recalcule</em>.</>} />

              <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
                <div className={`${styles.paper} divide-y divide-[#9fb8d8]/45 px-6 sm:px-8`}>
                  <div id="paiement" className="scroll-mt-28 py-7">
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Un règlement reçu</p>
                    <div className="mt-3"><Path items={['Factures', 'Ajouter un paiement']} /></div>
                    <p className={`mt-4 ${body}`}>
                      Choisissez la facture, puis indiquez le montant (supérieur à 0), la date, la méthode — Virement, Carte, Espèces, Chèque ou Autre — une référence et des notes. Le paiement s’ajoute à la facture et son règlement est recalculé.
                    </p>
                    <p className={`mt-3 text-[0.9375rem] ${muted}`}>
                      Dans le formulaire d’une facture, la section <Ui>Paiements</Ui> permet aussi d’en saisir.
                    </p>
                  </div>

                  <div id="acompte" className="scroll-mt-28 py-7">
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Un acompte</p>
                    <p className={`mt-3 font-semibold ${ink}`}>Demandé sur un devis</p>
                    <div className="mt-2"><Path items={['Devis', 'Enregistrer un acompte reçu']} /></div>
                    <p className={`mt-3 ${body}`}>
                      La liste <Ui>Devis nécessitant un acompte</Ui> présente ce qu’il reste à recevoir. Indiquez le montant (jamais au-delà du reste à recevoir), la date et le mode de règlement. L’acompte est ajouté à la facture d’acompte du devis, ou enregistré sur une nouvelle facture d’acompte en brouillon. Le devis passe alors à accepté.
                    </p>
                    <p className={`mt-5 font-semibold ${ink}`}>Déjà versé avant la facture finale</p>
                    <p className={`mt-1 ${body}`}>
                      Saisissez-le dans le champ <Ui>Acompte</Ui> de « Infos facture ». Il est déduit : <strong>net à payer = total TTC − acompte</strong>.
                    </p>
                  </div>

                  <div id="annuler-paiement" className="scroll-mt-28 py-7">
                    <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Une erreur de saisie</p>
                    <ul className={`mt-3 grid gap-3 ${body}`}>
                      <Bullet><strong className={ink}>Facture brouillon</strong> : <Ui>Supprimer le paiement</Ui>. Il disparaît et le total payé est recalculé.</Bullet>
                      <Bullet><strong className={ink}>Facture émise</strong> : <Ui>Annuler le paiement</Ui>, avec une raison obligatoire. Il reste visible, barré, marqué comme annulé.</Bullet>
                    </ul>
                  </div>
                </div>

                <div className="lg:sticky lg:top-28">
                  <PaymentMeter />
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------- 07 Corriger */}
            <section id="corriger" aria-labelledby="corriger-titre" className="scroll-mt-28">
              <SectionHead n="07" kicker="Corriger une erreur" id="corriger-titre" title={<>Une facture émise ne se supprime pas&nbsp;: <em>elle se corrige</em>.</>} />
              <p className={`mt-6 max-w-2xl ${body}`}>
                <Ui>Supprimer</Ui> n’existe que pour les brouillons. Sur une facture émise, la liste propose <Ui>Corriger</Ui>, qui ouvre un choix entre deux documents.
              </p>

              <div className="mt-10">
                <Tabs
                  layout="segmented"
                  label="Choisir le document correctif"
                  tabs={[
                    {
                      id: 'avoir',
                      label: 'Créer un avoir',
                      hint: 'Annuler financièrement la facture',
                      panel: (
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
                          <ol className={`grid gap-4 ${body}`}>
                            <li><span className={`font-semibold ${ink}`}>1.</span> Dans la liste, <Ui>Corriger</Ui> sur la facture concernée.</li>
                            <li><span className={`font-semibold ${ink}`}>2.</span> Choisissez <Ui>Créer un avoir</Ui>.</li>
                            <li><span className={`font-semibold ${ink}`}>3.</span> <Ui>Choisir la facture pour laquelle créer un avoir</Ui> : la facture source est obligatoire.</li>
                            <li><span className={`font-semibold ${ink}`}>4.</span> Vérifiez les lignes et les montants, puis <Ui>Émettre la facture</Ui>.</li>
                          </ol>
                          <div className={`${styles.well} p-5`}>
                            <p className={`font-semibold ${ink}`}>À savoir</p>
                            <p className={`mt-1.5 text-[0.9375rem] leading-relaxed ${body}`}>L’avoir garde en référence la facture d’origine : son numéro, sa date et son montant TTC. Les montants de l’avoir sont saisis en positif.</p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: 'corrective',
                      label: 'Créer une corrective',
                      hint: 'Remplacer les informations',
                      panel: (
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
                          <ol className={`grid gap-4 ${body}`}>
                            <li><span className={`font-semibold ${ink}`}>1.</span> Dans la liste, <Ui>Corriger</Ui> sur la facture concernée.</li>
                            <li><span className={`font-semibold ${ink}`}>2.</span> Choisissez <Ui>Créer une corrective</Ui>.</li>
                            <li><span className={`font-semibold ${ink}`}>3.</span> <Ui>Choisir la facture à corriger</Ui> : la facture source est obligatoire.</li>
                            <li><span className={`font-semibold ${ink}`}>4.</span> Corrigez les informations, puis <Ui>Émettre la facture</Ui>.</li>
                          </ol>
                          <div className={`${styles.well} p-5`}>
                            <p className={`font-semibold ${ink}`}>À savoir</p>
                            <p className={`mt-1.5 text-[0.9375rem] leading-relaxed ${body}`}>Le numéro et la date de la facture corrigée sont conservés sur la facture rectificative, qui la remplace.</p>
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className={`${styles.paper} p-6 sm:p-8`}>
                  <p className={`${styles.serif} text-xl font-semibold ${ink}`}>Et si c’est encore un brouillon ?</p>
                  <p className={`mt-2 ${body}`}>
                    Inutile de créer un document correctif : <Ui>Modifier la facture</Ui>, ou <Ui>Supprimer</Ui>. Si le brouillon porte des paiements, ils sont supprimés avec lui après confirmation.
                  </p>
                </div>
                <div className={`${styles.paper} p-6 sm:p-8`}>
                  <p className={`${styles.serif} text-xl font-semibold ${ink}`}>Et si c’est un paiement qui est faux ?</p>
                  <p className={`mt-2 ${body}`}>
                    Pas besoin d’avoir : le paiement s’annule seul. <AnchorLink to="annuler-paiement" className={inlineLink}>Voir comment →</AnchorLink>
                  </p>
                </div>
              </div>
            </section>

            {/* --------------------------------------------------- 08 Automatiser */}
            <section id="automatiser" aria-labelledby="automatiser-titre" className="scroll-mt-28">
              <SectionHead n="08" kicker="Automatiser" id="automatiser-titre" title={<>Relances et récurrence&nbsp;: <em>moins de suivi à la main</em>.</>} />

              <div id="relances" className="mt-10 scroll-mt-28 grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
                <div>
                  <p className={`${styles.serif} text-2xl font-semibold ${ink}`}>Relances automatiques</p>
                  <div className="mt-3"><Path items={['Entreprise', 'Modifier', 'Relances email']} /></div>
                  <p className={`mt-4 max-w-xl ${body}`}>
                    Cochez <Ui>Activer les relances automatiques</Ui>, puis réglez trois valeurs. Par défaut : première relance 3 jours après l’échéance, une relance tous les 7 jours, 3 relances au maximum. Les relances sont désactivées tant que vous ne les activez pas.
                  </p>
                  <p className={`mt-5 font-semibold ${ink}`}>Une relance part si…</p>
                  <ul className={`mt-3 grid gap-2.5 text-[1rem] ${body}`}>
                    <Bullet icon={BellRing}>la facture est émise et non soldée ;</Bullet>
                    <Bullet icon={BellRing}>son échéance est dépassée du délai choisi ;</Bullet>
                    <Bullet icon={BellRing}>le client a une adresse email ;</Bullet>
                    <Bullet icon={BellRing}>le nombre maximum de relances n’est pas atteint.</Bullet>
                  </ul>
                  <p className={`mt-4 text-[0.9375rem] ${muted}`}>Le contrôle s’effectue toutes les heures. Chaque relance est conservée dans l’historique des envois.</p>
                </div>
                <ReminderPlanner />
              </div>

              <div id="recurrence" className={`${styles.paper} mt-14 scroll-mt-28 p-6 sm:p-10`}>
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div>
                    <p className={`${styles.eyebrow} flex items-center gap-2`}><Repeat2 className="h-4 w-4" aria-hidden="true" /> Facture récurrente</p>
                    <p className={`${styles.display} mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)]`}>Facturer chaque mois sans ressaisir</p>
                    <div className="mt-4"><Path items={['Factures', 'Créer une facture récurrente']} /></div>
                    <p className={`mt-4 ${body}`}>Le formulaire demande :</p>
                    <dl className={`${styles.well} mt-3 grid gap-x-4 gap-y-2 p-5 text-[0.9375rem] sm:grid-cols-[auto_minmax(0,1fr)]`}>
                      {[
                        ['Nom de la récurrence', 'pour la retrouver'],
                        ['Client', 'et projet, en option'],
                        ['Fréquence', 'tous les n jours, semaines, mois ou ans'],
                        ['Première occurrence', 'et fin, en option'],
                        ['Compte bancaire', 'sinon le compte principal'],
                        ['Lignes récurrentes', 'libellé, description, quantité, prix HT'],
                      ].map(([term, detail]) => (
                        <div key={term} className="contents">
                          <dt className={`font-semibold ${ink}`}>{term}</dt>
                          <dd className={`${body} mb-1.5 sm:mb-0`}>{detail}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div>
                    <p className={`${styles.serif} text-xl font-semibold ${ink}`}>Ensuite</p>
                    <ul className={`mt-4 grid gap-4 ${body}`}>
                      <Bullet>Les factures générées arrivent en brouillon : relisez-les, puis émettez-les.</Bullet>
                      <Bullet>Si la première occurrence est déjà échue, une première facture est générée tout de suite.</Bullet>
                      <Bullet>Sous <Ui>Factures récurrentes</Ui>, retrouvez la prochaine échéance et le statut : Active, En pause ou Terminée.</Bullet>
                      <Bullet><Ui>Mettre en pause</Ui> et <Ui>Réactiver</Ui> suspendent ou relancent la série.</Bullet>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------- 09 Questions */}
            <section id="questions" aria-labelledby="questions-titre" className="scroll-mt-28">
              <SectionHead n="09" kicker="En cas de doute" id="questions-titre" title={<>Les questions qui <em>reviennent</em>.</>} />
              <div className="mt-10 grid max-w-3xl gap-4">
                {faqs.map((faq) => (
                  <details key={faq.q} className={styles.faq}>
                    <summary>{faq.q}</summary>
                    <div className={`${styles.paper} mx-1.5 mt-3 p-5 text-[1rem] leading-relaxed ${body}`}>{faq.a}</div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ------------------------------------------------------------ Fin */}
        <section id="fin" aria-labelledby="fin-titre" className="px-4 pb-24 sm:px-6 sm:pb-32">
          <div className={`${styles.glass} mx-auto grid max-w-[78rem] items-center gap-8 p-8 sm:p-12 lg:grid-cols-[minmax(0,1.2fr)_auto]`}>
            <div>
              <p className={styles.eyebrow}>Encore bloqué ?</p>
              <h2 id="fin-titre" className={`${styles.display} mt-2 text-[clamp(2rem,3.7vw,3rem)]`}>Une question <em>sans réponse</em> ?</h2>
              <p className={`mt-4 max-w-xl ${body}`}>Décrivez votre situation à l’équipe : on vous aide à la débloquer. D’autres guides complètent celui-ci.</p>
              <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/aide/devis" className={inlineLink}>Créer un devis</Link>
                <Link href="/aide/chantiers" className={inlineLink}>Suivre un chantier</Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className={`${styles.btn} ${styles.btnPrimary} px-6 py-3.5`}>
                Contacter l’équipe <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/aide" className={`${styles.btn} px-6 py-3.5`}>Tous les guides</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
