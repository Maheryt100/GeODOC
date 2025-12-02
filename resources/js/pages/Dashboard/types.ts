// pages/Dashboard/types.ts

export interface KPI {
    demandeurs_details: { total: number; actifs: number; acquis: number; sans_propriete: number; hommes: number; femmes: number; hommes_actifs: number; femmes_actifs: number; };
    dossiers_ouverts: number;
    dossiers_fermes: number;
    proprietes_acquises: number;
    proprietes_disponibles: number;
    completion: CompletionDetails; 
    demandeurs_actifs: number;
    revenus_potentiels: number;
    nouveaux_dossiers: number;
    dossiers_en_retard: number;
    temps_moyen_traitement: number;
    superficie_totale: number;
    superficie_details: SuperficieDetails; 
    demandeurs_sans_propriete: number;
    documents_generes_aujourdhui: number;
    utilisateurs_actifs_24h: number;
}

export interface ProprietesStatus {
    disponibles: number;
    acquises: number;
}

export interface EvolutionItem {
    month: string;
    count: number;
}

export interface RevenuVocation {
    vocation: string;
    montant: number;
}

export interface TopCommune {
    commune: string;
    fokontany: string;
    type_commune: string;
    count: number;
}

export interface Alert {
    type: 'warning' | 'info' | 'error';
    title: string;
    message: string;
    action?: string;
}

export interface Activity {
    id: number;
    type: string;
    description: string;
    time: string;
    user: string;
}

// ✅ AJOUT : Interface pour les données de performance trimestrielle
export interface PerformanceQuarterly {
    quarter: string;
    ouverts: number;
    fermes: number;
    total: number;
}

export interface Charts {
    dossiers_timeline: EvolutionItem[];
    proprietes_status: ProprietesStatus;
    top_communes: TopCommune[];
    evolution_mensuelle?: EvolutionItem[];
    revenus_par_vocation?: RevenuVocation[];
    performance_trimestrielle?: PerformanceQuarterly[]; // ✅ Maintenant défini
}

export interface DashboardProps {
    kpis: KPI;
    charts: Charts;
    alerts: Alert[];
    recentActivity: Activity[];
}

export interface CompletionDetails {
    taux: number;
    dossiers_complets: number;
    dossiers_incomplets: number;
    total_dossiers: number;
    proprietes_incompletes: number;
    demandeurs_incomplets: number;
}

export interface SuperficieDetails {
    totale: number;
    acquise: number;
    disponible: number;
}

export interface DemandeurDetails {
    total: number;
    actifs: number;
    acquis: number;
    sans_propriete: number;
    hommes: number;
    femmes: number;
    hommes_actifs: number;
    femmes_actifs: number;
}