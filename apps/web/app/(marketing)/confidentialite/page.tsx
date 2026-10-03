import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '../LegalPage';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Workermate',
  description: 'Comment Workermate collecte, utilise et protège les données personnelles.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Données personnelles"
      title="Politique de confidentialité"
      intro="Cette page explique quelles données Workermate traite, pourquoi, pendant combien de temps et comment exercer vos droits."
      updatedAt="1er octobre 2026"
    >
      <LegalSection title="1. Responsable du traitement">
        <p>Le responsable du traitement est l’éditeur de Workermate. Ses informations d’identification seront ajoutées dans les mentions légales avant l’ouverture commerciale.</p>
        <p>Pour toute question relative à vos données, vous pouvez écrire à <a className="font-semibold text-indigo-700 hover:underline" href="mailto:contact@workermate.fr">contact@workermate.fr</a>.</p>
      </LegalSection>

      <LegalSection title="2. Données traitées">
        <p>Selon votre utilisation du service, Workermate peut traiter :</p>
        <ul>
          <li>les données de compte : nom, prénom, adresse email et informations de connexion ;</li>
          <li>les données de l’entreprise : coordonnées, identifiants administratifs et coordonnées bancaires renseignées ;</li>
          <li>les données de gestion : clients, fournisseurs, projets, devis, factures, paiements, achats et documents ;</li>
          <li>les données techniques : journaux, adresse IP, navigateur, appareil et événements de sécurité ;</li>
          <li>les échanges avec le support et les préférences de communication.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalités et bases légales">
        <p>Les données sont utilisées pour :</p>
        <ul>
          <li>créer et administrer votre compte, sur la base de l’exécution du contrat ;</li>
          <li>fournir les fonctionnalités de gestion demandées, sur la base de l’exécution du contrat ;</li>
          <li>sécuriser le service, prévenir les abus et assurer la continuité, sur la base de l’intérêt légitime ;</li>
          <li>répondre aux demandes d’assistance, sur la base de l’exécution du contrat ou de l’intérêt légitime ;</li>
          <li>envoyer des communications commerciales lorsque la loi l’autorise ou avec votre consentement.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Données de vos clients et contacts">
        <p>Lorsque vous ajoutez dans Workermate les données de vos clients, fournisseurs ou collaborateurs, vous restez responsable du traitement réalisé pour votre compte. Vous devez disposer d’une base légale, informer les personnes concernées et respecter leurs droits.</p>
        <p>Workermate agit alors comme prestataire au service de votre entreprise. Les engagements précis entre les parties devront être complétés dans un accord de sous-traitance avant la mise en production commerciale.</p>
      </LegalSection>

      <LegalSection title="5. Conservation">
        <p>Les données sont conservées pendant la durée nécessaire à la fourniture du service et à la gestion de la relation contractuelle. Certaines données peuvent être conservées plus longtemps lorsque la loi l’impose, notamment pour répondre aux obligations comptables, fiscales ou à la défense des droits.</p>
        <p>Les durées détaillées par catégorie de données seront précisées dans la version finale de cette politique.</p>
      </LegalSection>

      <LegalSection title="6. Destinataires et sous-traitants">
        <p>L’accès aux données est limité aux personnes qui en ont besoin pour fournir, sécuriser ou maintenir Workermate. Des prestataires techniques peuvent intervenir pour l’hébergement, l’envoi d’emails, le stockage de fichiers, le paiement ou la supervision.</p>
        <p>La liste des sous-traitants et les éventuels transferts hors de l’Union européenne devront être documentés et publiés avant le lancement.</p>
      </LegalSection>

      <LegalSection title="7. Sécurité">
        <p>Workermate met en place des mesures techniques et organisationnelles adaptées, notamment la gestion des accès, l’isolation des espaces d’entreprise, le chiffrement des connexions et la surveillance des erreurs et événements de sécurité.</p>
        <p>Aucune transmission ou conservation ne peut toutefois être garantie comme absolument invulnérable. Toute suspicion d’incident doit être signalée à <a className="font-semibold text-indigo-700 hover:underline" href="mailto:contact@workermate.fr">contact@workermate.fr</a>.</p>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>Dans les conditions prévues par la réglementation, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, et vous opposer à certains traitements.</p>
        <p>Pour exercer vos droits, envoyez votre demande à <a className="font-semibold text-indigo-700 hover:underline" href="mailto:contact@workermate.fr">contact@workermate.fr</a>. Vous pouvez également adresser une réclamation à la CNIL.</p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>Le site peut utiliser des cookies nécessaires à son fonctionnement et, si nécessaire, des cookies de mesure d’audience ou de personnalisation soumis à votre choix. La liste des cookies et le mécanisme de consentement seront ajoutés avant l’activation de services non essentiels.</p>
      </LegalSection>
    </LegalPage>
  );
}
