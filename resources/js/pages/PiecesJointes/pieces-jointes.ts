// types/pieces-jointes.ts

export interface PieceJointe {
    id: number;
    nom_original: string;
    nom_fichier: string;
    type_mime: string;
    taille: number;
    extension: string;
    type_document: string | null;
    categorie: 'global' | 'demandeur' | 'propriete';
    categorie_label: string;
    description: string | null;
    is_verified: boolean;
    is_image: boolean;
    is_pdf: boolean;
    url: string;
    view_url: string;
    taille_formatee: string;
    icone: string;
    created_at: string;
    user: {
        id: number;
        name: string;
    } | null;
    verified_by: {
        id: number;
        name: string;
    } | null;
    verified_at: string | null;
}

export interface BaseDemandeur {
    id: number;
    nom_demandeur: string;
    prenom_demandeur: string;
    cin: string;
}

export interface BasePropriete {
    id: number;
    lot: string;
    titre: string | null;
}

export interface RelatedDemandeurData {
    demandeur: BaseDemandeur;
    pieces: PieceJointe[];
}

export interface RelatedProprieteData {
    propriete: BasePropriete;
    pieces: PieceJointe[];
}

export interface RelatedPieces {
    demandeurs: Record<number, RelatedDemandeurData>;
    proprietes: Record<number, RelatedProprieteData>;
}

export interface UploadForm {
    files: File[];
    type_document: string;
    categorie: string;
    description: string;
    linked_entity_type: '' | 'Demandeur' | 'Propriete';
    linked_entity_id: string | number;
}

export interface PiecesJointesIndexProps {
    attachableType: 'Dossier' | 'Demandeur' | 'Propriete';
    attachableId: number;
    title?: string;
    canUpload?: boolean;
    canDelete?: boolean;
    canVerify?: boolean;
    initialCount?: number;
    demandeurs?: BaseDemandeur[];
    proprietes?: BasePropriete[];
    showRelated?: boolean;
}

export const CATEGORIES = {
    global: { label: 'Document général', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    demandeur: { label: 'Document demandeur', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    propriete: { label: 'Document propriété', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
} as const;

export const TYPES_DOCUMENTS = {
    'CIN': 'CIN',
    'Acte de naissance': 'Acte de naissance',
    'Acte de mariage': 'Acte de mariage',
    'Certificat de résidence': 'Certificat de résidence',
    'Plan du terrain': 'Plan du terrain',
    'Autre': 'Autre',
} as const;