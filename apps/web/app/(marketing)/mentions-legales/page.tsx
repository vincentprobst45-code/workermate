import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '../LegalPage';

export const metadata: Metadata = {
  title: 'Mentions légales | Workermate',
  description: 'Les informations légales relatives au site Workermate.',
};

export default function LegalNoticePage() {
  return (
    <LegalPage
      eyebrow="Informations légales"
      title="Mentions légales"
      intro="Retrouvez ici les informations relatives à l’éditeur, à l’hébergement et à la publication du site Workermate."
      updatedAt="1er octobre 2026"
    >
      <LegalSection title="Éditeur du site">
        <p>Le site Workermate est édité par :</p>
        <ul>
          <li>Dénomination sociale : à compléter</li>
          <li>Forme juridique : à compléter</li>
          <li>Capital social : à compléter</li>
          <li>Siège social : à compléter</li>
          <li>SIRET / SIREN : à compléter</li>
          <li>Numéro de TVA intracommunautaire : à compléter</li>
          <li>Adresse email : contact@workermate.fr</li>
        </ul>
        <p>Directeur de la publication : à compléter.</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>Les informations relatives à l’hébergeur du site et de l’application seront renseignées avant la mise en production :</p>
        <ul>
          <li>Hébergeur : à compléter</li>
          <li>Adresse : à compléter</li>
          <li>Téléphone : à compléter</li>
        </ul>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>La structure du site, ses textes, visuels, marques, logos et logiciels sont protégés par les dispositions applicables en matière de propriété intellectuelle. Toute reproduction ou représentation non autorisée est interdite.</p>
        <p>Les contenus publiés par les utilisateurs restent la propriété de leurs auteurs. L’utilisateur garantit disposer des droits nécessaires pour les utiliser dans Workermate.</p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>Workermate met en œuvre des moyens raisonnables pour maintenir des informations exactes et un service disponible. Le site peut toutefois contenir des erreurs, être interrompu pour maintenance ou dépendre de services tiers.</p>
        <p>Les informations présentées sur le site ne constituent pas un conseil juridique, fiscal ou comptable.</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Pour toute question relative au site ou à ces mentions légales, écrivez à <a className="font-semibold text-indigo-700 hover:underline" href="mailto:contact@workermate.fr">contact@workermate.fr</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
