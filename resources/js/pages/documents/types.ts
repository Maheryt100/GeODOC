// documents/types.ts
import { Demandeur, Propriete } from '@/types';

export interface RecuPaiement {
    id: number;
    numero_recu: string;
    montant: string;
    date_recu: string;
    status: string;
    generated_by: string;
    generated_at: string;
    download_count: number;
}

export interface RecuHistoryItem {
    id: number;
    numero_recu: string;
    montant: string;
    date_recu: string;
    demandeur: string;
    cree_par: string;
    cree_le: string;
    status: string;
    download_count: number;
    file_exists: boolean;
}

export interface DemandeurLie {
    id: number;
    id_demande: number;
    nom: string;
    prenom: string;
    cin: string;
    status_consort: boolean;
}

export interface ProprieteWithDemandeurs extends Propriete {
    demandeurs_lies: DemandeurLie[];
    has_recu?: boolean;
    dernier_recu?: RecuPaiement | null;
}

export type DocumentType = 'recu' | 'acte_vente' | 'csf' | 'requisition';