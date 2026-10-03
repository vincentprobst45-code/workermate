export const sections = [
  { id: 'cycle', label: 'Vue d’ensemble' },
  { id: 'preparer', label: 'Préparer' },
  { id: 'creer', label: 'Créer' },
  { id: 'lignes', label: 'Lignes et TVA' },
  { id: 'envoyer', label: 'Envoyer' },
  { id: 'encaisser', label: 'Encaisser' },
  { id: 'corriger', label: 'Corriger' },
  { id: 'automatiser', label: 'Automatiser' },
  { id: 'questions', label: 'Questions' },
] as const;

export type Task = {
  label: string;
  path: string[];
  target: string;
  keywords: string;
};

// Chaque tâche pointe vers un id présent dans page.tsx.
export const tasks: Task[] = [
  { label: 'Enregistrer un paiement', path: ['Factures', 'Ajouter un paiement'], target: 'paiement', keywords: 'encaisser règlement reçu virement chèque espèces carte' },
  { label: 'Corriger une facture émise', path: ['Factures', 'Corriger'], target: 'corriger', keywords: 'erreur modifier rectifier supprimer annuler' },
  { label: 'Faire un avoir', path: ['Factures', 'Corriger', 'Créer un avoir'], target: 'corriger', keywords: 'annuler rembourser crédit' },
  { label: 'Envoyer une facture par email', path: ['Factures', 'Détails facture', 'Envoyer par email'], target: 'envoyer', keywords: 'mail courriel client transmettre' },
  { label: 'Télécharger le PDF', path: ['Factures', 'Détails facture', 'Télécharger la facture'], target: 'envoyer', keywords: 'pdf imprimer document' },
  { label: 'Activer les relances automatiques', path: ['Entreprise', 'Modifier', 'Relances email'], target: 'relances', keywords: 'impayé retard échéance rappel' },
  { label: 'Enregistrer un acompte reçu', path: ['Devis', 'Enregistrer un acompte reçu'], target: 'acompte', keywords: 'avance versement devis' },
  { label: 'Créer une facture depuis un devis', path: ['Factures', 'Créer une nouvelle facture'], target: 'sources', keywords: 'devis remplir importer' },
  { label: 'Facturer un chantier', path: ['Factures', 'Créer une nouvelle facture'], target: 'sources', keywords: 'chantier remplir projet' },
  { label: 'Ajouter une remise ou des frais', path: ['Facture', 'Ajouter une remise ou des frais'], target: 'lignes', keywords: 'réduction charge ajustement geste commercial' },
  { label: 'Comprendre le net à payer', path: ['Facture', 'Montants calculés'], target: 'calcul', keywords: 'total ttc tva reste à payer acompte déduit' },
  { label: 'Annuler un paiement saisi par erreur', path: ['Facture', 'Détails', 'Paiements'], target: 'annuler-paiement', keywords: 'supprimer erreur raison' },
  { label: 'Facturer chaque mois', path: ['Factures', 'Créer une facture récurrente'], target: 'recurrence', keywords: 'abonnement mensuel répétition périodique' },
  { label: 'Vérifier si un email est bien parti', path: ['Factures', 'Détails facture', 'Historique des envois'], target: 'historique', keywords: 'envoi échec statut mail' },
  { label: 'Renseigner SIRET, TVA et IBAN', path: ['Entreprise', 'Modifier'], target: 'preparer', keywords: 'identité légale coordonnées bancaires compte' },
];
