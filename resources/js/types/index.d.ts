import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { ReactNode } from 'react';
import type { BreadcrumbItem, Dossiers, SharedData } from '@/types';


export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: ReactNode;
    href: string;
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
    flash: { message?: string};
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
    [key: string]: unknown;
}
export interface Propriete{
    id: number;
    lot: string;
    titre: string;
    contenance: number;
    proprietaire: string;
    propriete_mere: string;
    titre_mere: string;
    charge: string;
    situation: string;
    nature: string;
    numero_FN: string;
    numero_requisition: string;
    status: string;
    date_requisition: string;
    date_inscription: string;
    dep_vol: string;
    id_dossier: string;
}

export interface Dossier{
    id: number;
    nom_dossier: string;
    type: string;
    type_commune: string;
    commune: string;
    fokontany: string;
    date_descente_debut: string;
    date_descente_fin: string;
    circonscription: string;
    id_district: number;
    demandeurs?: Demandeur[];
    demandeurs_count: number;
    proprietes_count: number;
}

export interface Demandeur{
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
}

export interface Demander{
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

export interface District{
    id: number;
    nom_district: string;
    edilitaire: string;
    agricole: string;
}
export interface PageProps{
    dossier: Dossier;
    Demandeurs: Demandeurs;
    document: Paginated<Demander>;
    districts: Districts;
}

export interface Paginated<T>{
    data: T[];
    links: Link[];
}

export interface Link{
    active: boolean;
    label: string;
    url: string;
}
type Dossiers = {
    dossiers: Dossier[];
}
type Demandeurs = {
    demandeurs: Demandeur[];
}
type Proprietes = {
    proprietes: Propriete[];
}
type Demanders = {
    documents: Demander[];
}
type Districts = {
    districts: District[];
}
type Users = {
    users: User[];
}

export {}; // Pour rendre ce fichier un module
declare global {
  interface Window {
    route: any; // tu peux typer selon ton besoin, ex: route: (args: any) => any;
  }
}