// this index.d.ts
import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { ReactNode } from 'react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: ReactNode;
    href: string;
    label?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: {
        error: any; message?: string; success?: string;
};
    districts: District[];
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

// DÉFINITIONS DES TYPES (Solution simplifiée)
export type Nature = 'Urbaine' | 'Suburbaine' | 'Rurale';
export type Vocation = 'Edilitaire' | 'Agricole' | 'Forestière' | 'Touristique';
export type TypeOperation = 'morcellement' | 'immatriculation';

export interface Propriete {
    [x: string]: any;
    id: number;
    lot: string;
    titre: string;
    contenance: number;
    proprietaire: string;
    propriete_mere: string;
    titre_mere: string;
    charge: string;
    situation: string;
    nature: Nature;              // Urbaine | Suburbaine | Rurale
    vocation: Vocation;          // Edilitaire | Agricole | Forestière | Touristique
    numero_FN: string;
    numero_requisition: string;
    status: boolean;
    type_operation: TypeOperation;
    date_requisition: string;
    date_inscription: string;
    dep_vol: string;
    id_dossier: number;
    demandeurs?: Demandeur[];
    is_incomplete?: boolean;
    is_archived?: boolean;
    demandes?: Array<{
        id: number;
        id_demandeur: number;
        status: 'active' | 'archive';
    }>;
    demandeurs?: Array<Demandeur & { status?: 'active' | 'archive' }>;
}

export interface Dossier {
    id: number;
    nom_dossier: string;
    type_commune: string;
    commune: string;
    fokontany: string;
    date_descente_debut: string;
    date_descente_fin: string;
    circonscription: string;
    id_district: number;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    demandeurs_count: number;
    proprietes_count: number;
    is_incomplete?: boolean;
}

export interface Demandeur {
    id: number;
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string;
    date_naissance: string;
    lieu_naissance: string;
    sexe: string;
    occupation: string;
    nom_pere: string;
    nom_mere: string;
    cin: string;
    date_delivrance: string;
    lieu_delivrance: string;
    date_delivrance_duplicata: string;
    lieu_delivrance_duplicata: string;
    domiciliation: string;
    situation_familiale: string;
    regime_matrimoniale: string;
    date_mariage: string;
    lieu_mariage: string;
    nationalite: string;
    marie_a: string;
    telephone: string;
    is_incomplete?: boolean;
}

export interface Demander {
    propriete: Propriete;
    demandeur: Demandeur;
    id: number;
    id_demandeur: number;
    id_propriete: number;
    total_prix: number;
    status: string;
    status_consort: boolean;
    motif_archive: string;
}

// ✅ DISTRICT CORRIGÉ (4 colonnes au lieu de 12)
export interface District {
    id: number;
    nom_district: string;
    // COLONNES DE PRIX BASÉES SUR LA VOCATION
    edilitaire: number;      // Prix pour vocation Edilitaire
    agricole: number;        // Prix pour vocation Agricole
    forestiere: number;      // Prix pour vocation Forestière
    touristique: number;     // Prix pour vocation Touristique
}

export interface PageProps {
    dossier: Dossier;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    documents?: Paginated<Demander>;
    districts?: District[];
}

export interface Paginated<T> {
    last_page: number;
    current_page: number;
    data: T[];
    links: Link[];
}

export interface Link {
    active: boolean;
    label: string;
    url: string | null;
}

// TYPES HELPERS
export type Proprietes = Propriete[];
export type Demandeurs = Demandeur[];

declare global {
    interface Window {
        route: (name: string, params?: any) => string;
    }
}