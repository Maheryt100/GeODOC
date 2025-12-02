// types/index.d.ts
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
        error: string; 
        message?: string; 
        success?: string;
    };
    districts: District[];
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

// MODIFIÉ : Ajout du type UserRole
export type UserRole = 'super_admin' | 'central_user' | 'admin_district' | 'user_district' | 'user';

export interface User {
    district: any;
    id: number;
    name: string;
    email: string;
    role: UserRole; //  Type plus strict
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

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
    nature: Nature;
    vocation: Vocation;
    numero_FN: string;
    numero_requisition: string;
    status: boolean;
    type_operation: TypeOperation;
    date_requisition: string;
    date_inscription: string;
    dep_vol: string;
    numero_dep_vol?: string;
    dep_vol_complet?: string;
    id_dossier: number;
    demandeurs?: Demandeur[];
    is_incomplete?: boolean;
    is_archived?: boolean;
    demandes?: Array<{
        total_prix: number;
        ordre: number;
        demandeur: any;
        id: number;
        id_demandeur: number;
        status: 'active' | 'archive';
    }>;
}

export interface Dossier {
    id: number;
    nom_dossier: string;
    numero_ouverture?: string;
    numero_ouverture_display?: string;
    date_descente_debut: string;
    date_descente_fin: string;
    date_ouverture: string;
    date_fermeture?: string | null;
    closed_by?: number | null;
    motif_fermeture?: string | null;
    type_commune: string;
    commune: string;
    fokontany: string;
    circonscription: string;
    id_district: number;
    id_user: number;
    demandeurs_count: number;
    proprietes_count: number;
    is_closed: boolean;
    is_open: boolean;
    can_close?: boolean;
    can_modify?: boolean;
    status_label?: string;
    closedBy?: User;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    created_at: string;
    updated_at: string;
    
}

export interface Demandeur {
    id: number;
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur?: string;
    date_naissance: string;
    lieu_naissance?: string;
    sexe?: string;
    occupation?: string;
    nom_pere?: string;
    nom_mere?: string;
    cin: string;
    date_delivrance?: string;
    lieu_delivrance?: string;
    date_delivrance_duplicata?: string;
    lieu_delivrance_duplicata?: string;
    domiciliation?: string;
    situation_familiale?: string;
    regime_matrimoniale?: string;
    nationalite: string;
    telephone?: string;
    date_mariage?: string;
    lieu_mariage?: string;
    marie_a?: string;
    id_user: number;
    status?: string;
    id_demande?: number;
    hasProperty?: boolean;
    created_at: string;
    updated_at: string;
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

export interface District {
    id: number;
    nom_district: string;
    edilitaire: number;
    agricole: number;
    forestiere: number;
    touristique: number;
}

export interface PageProps {
    dossier: Dossier;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    documents?: Paginated<Demander>;
    districts?: District[];
    suggested_numero?: string;
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

export type Proprietes = Propriete[];
export type Demandeurs = Demandeur[];

declare global {
    interface Window {
        route: (name: string, params?: any) => string;
    }
}