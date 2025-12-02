// documents/config.ts

/**
 * Configuration et constantes pour la génération de documents
 */

export const DOCUMENT_TYPES = {
    RECU: 'recu',
    ACTE_VENTE: 'acte_vente',
    CSF: 'csf',
    REQUISITION: 'requisition',
} as const;

export const DOCUMENT_LABELS = {
    [DOCUMENT_TYPES.RECU]: 'Reçu de Paiement',
    [DOCUMENT_TYPES.ACTE_VENTE]: 'Acte de Vente',
    [DOCUMENT_TYPES.CSF]: 'Certificat de Situation Financière',
    [DOCUMENT_TYPES.REQUISITION]: 'Réquisition',
} as const;

export const SUCCESS_MESSAGES = {
    [DOCUMENT_TYPES.RECU]: 'Téléchargement du reçu en cours...',
    [DOCUMENT_TYPES.ACTE_VENTE]: 'Téléchargement de l\'acte de vente...',
    [DOCUMENT_TYPES.CSF]: 'Téléchargement du CSF en cours...',
    [DOCUMENT_TYPES.REQUISITION]: 'Téléchargement de la réquisition en cours...',
} as const;

export const ERROR_MESSAGES = {
    MISSING_SELECTION: 'Veuillez sélectionner tous les champs requis',
    MISSING_PROPRIETE: 'Veuillez sélectionner une propriété',
    MISSING_DEMANDEUR: 'Veuillez sélectionner un demandeur',
    GENERATION_ERROR: 'Erreur lors de la préparation du téléchargement',
    DOWNLOAD_ERROR: 'Erreur lors du téléchargement',
    HISTORY_ERROR: 'Erreur lors du chargement de l\'historique',
    INCOMPLETE_DATA: 'Données incomplètes pour générer le document',
} as const;

/**
 * Champs requis pour chaque type de document
 */
export const REQUIRED_FIELDS = {
    PROPRIETE: {
        FULL: ['titre', 'contenance', 'proprietaire', 'nature', 'vocation', 'situation'],
        REQUISITION: ['titre', 'proprietaire', 'situation'],
    },
    DEMANDEUR: [
        'date_naissance',
        'lieu_naissance',
        'date_delivrance',
        'lieu_delivrance',
        'domiciliation',
        'occupation',
        'nom_mere',
    ],
} as const;

/**
 * Labels lisibles des champs
 */
export const FIELD_LABELS: Record<string, string> = {
    titre: 'Titre',
    contenance: 'Contenance',
    proprietaire: 'Propriétaire',
    nature: 'Nature',
    vocation: 'Vocation',
    situation: 'Situation',
    date_naissance: 'Date de naissance',
    lieu_naissance: 'Lieu de naissance',
    date_delivrance: 'Date de délivrance CIN',
    lieu_delivrance: 'Lieu de délivrance CIN',
    domiciliation: 'Domiciliation',
    occupation: 'Occupation',
    nom_mere: 'Nom de la mère',
};

/**
 * Types d'opérations
 */
export const OPERATION_TYPES = {
    MORCELLEMENT: 'morcellement',
    IMMATRICULATION: 'immatriculation',
} as const;

/**
 * Status des documents
 */
export const DOCUMENT_STATUS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
    OBSOLETE: 'obsolete',
} as const;

/**
 * Couleurs des badges par type de document
 */
export const DOCUMENT_COLORS = {
    [DOCUMENT_TYPES.RECU]: 'bg-green-500',
    [DOCUMENT_TYPES.ACTE_VENTE]: 'bg-violet-500',
    [DOCUMENT_TYPES.CSF]: 'bg-emerald-500',
    [DOCUMENT_TYPES.REQUISITION]: 'bg-blue-500',
} as const;