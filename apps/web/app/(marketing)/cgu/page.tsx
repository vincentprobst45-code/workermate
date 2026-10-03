import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '../LegalPage';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation | Workermate',
  description: 'Les conditions générales d’utilisation du service Workermate.',
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Cadre d’utilisation"
      title="Conditions générales d’utilisation"
      intro="Ces conditions définissent les règles d’accès et d’utilisation du site et du logiciel Workermate."
      updatedAt="1er octobre 2026"
    >
      <LegalSection title="1. Objet">
        <p>Workermate est un service de gestion destiné aux artisans et petites entreprises. Il permet notamment de centraliser les clients, devis, chantiers, factures, paiements, achats et documents.</p>
        <p>Les présentes conditions devront être complétées par les informations de l’éditeur, les conditions tarifaires et les éventuelles conditions particulières applicables à chaque offre.</p>
      </LegalSection>

      <LegalSection title="2. Accès au service">
        <p>L’utilisateur doit fournir des informations exactes, conserver ses identifiants confidentiels et disposer des droits nécessaires pour agir au nom de son entreprise.</p>
        <p>L’utilisateur est responsable des actions réalisées depuis son compte. Il doit signaler rapidement toute utilisation non autorisée à <a className="font-semibold text-indigo-700 hover:underline" href="mailto:contact@workermate.fr">contact@workermate.fr</a>.</p>
      </LegalSection>

      <LegalSection title="3. Utilisation autorisée">
        <p>L’utilisateur s’engage à utiliser Workermate conformément aux lois et règlements applicables. Il lui est notamment interdit :</p>
        <ul>
          <li>d’utiliser le service pour une activité illicite ou frauduleuse ;</li>
          <li>de tenter de compromettre la sécurité ou la disponibilité du service ;</li>
          <li>d’importer des contenus dont il ne détient pas les droits ;</li>
          <li>de partager ses accès avec des personnes non autorisées.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Données et contenus de l’utilisateur">
        <p>L’utilisateur conserve la responsabilité de ses données, de leur exactitude et de la légalité des traitements qu’il réalise avec Workermate. Il doit effectuer les vérifications et sauvegardes nécessaires à son activité.</p>
        <p>Les règles relatives aux données personnelles sont détaillées dans la <a className="font-semibold text-indigo-700 hover:underline" href="/confidentialite">politique de confidentialité</a>.</p>
      </LegalSection>

      <LegalSection title="5. Disponibilité et support">
        <p>Workermate peut être temporairement indisponible pour maintenance, évolution ou en raison d’un événement indépendant de sa volonté. Les modalités de support, les niveaux de service et les horaires de prise en charge seront précisés dans l’offre souscrite.</p>
      </LegalSection>

      <LegalSection title="6. Tarifs et résiliation">
        <p>Les prix, la durée de l’essai éventuel, les modalités de facturation et les conditions de résiliation sont présentés sur la page Tarifs ou dans l’offre souscrite.</p>
        <p>En cas de manquement grave ou d’usage abusif, l’accès peut être suspendu le temps de sécuriser le service et d’examiner la situation.</p>
      </LegalSection>

      <LegalSection title="7. Évolution des conditions">
        <p>Workermate peut faire évoluer ces conditions pour tenir compte des changements du service ou de la réglementation. La date de mise à jour est indiquée en haut de cette page. Les modifications substantielles feront l’objet d’une information appropriée.</p>
      </LegalSection>

      <LegalSection title="8. Contact et droit applicable">
        <p>Pour toute question concernant ces conditions, contactez <a className="font-semibold text-indigo-700 hover:underline" href="mailto:contact@workermate.fr">contact@workermate.fr</a>.</p>
        <p>Le droit applicable et les modalités de règlement des litiges devront être validés et complétés par l’éditeur avant publication commerciale.</p>
      </LegalSection>
    </LegalPage>
  );
}
