// pages/Statistics/types.ts

export interface StatisticsFilters {
    period: string;
    date_from: string | null;
    date_to: string | null;
    district_id: number | null;
}

export interface District {
    id: number;
    nom_district: string;
}

export interface OverviewStats {
    total_dossiers: number;
    dossiers_ouverts: number;
    dossiers_fermes: number;
    taux_croissance: number;
}

export interface DossiersStats {
    [x: string]: any;
    total: number;
    ouverts: number;
    fermes: number;
    duree_moyenne: number;
}

export interface ProprietesStats {
    sans_demande: any;
    total: number;
    disponibles: number;
    acquises: number;
    superficie_totale: number;
    superficie_moyenne: number;
}

export interface DemandeursStats {
    actifs: number;
    
    total: number;
    avec_propriete: number;
    sans_propriete: number;
    age_moyen: number;
}

export interface DemographicsStats {
    total_hommes: number;
    total_femmes: number;
    pourcentage_hommes: number;
    pourcentage_femmes: number;
    hommes_avec_propriete: number;
    femmes_avec_propriete: number;
    age_moyen: number;
    tranches_age: {
        [key: string]: number;
    };
}

export interface FinancialsStats {
    total_revenus_potentiels: number;
    revenu_moyen: number;
    revenu_max: number;
    revenu_min: number;
    par_vocation: {
        [key: string]: number;
    };
}

export interface GeographicStats {
    top_communes: Array<{
        commune: string;
        fokontany: string;
        type_commune: string;
        count: number;
    }>;
}

export interface PerformanceStats {
    taux_completion: number;
    temps_moyen_traitement: number;
    dossiers_en_retard: number;
}

export interface Stats {
    overview: OverviewStats;
    dossiers: DossiersStats;
    proprietes: ProprietesStats;
    demandeurs: DemandeursStats;
    demographics: DemographicsStats;
    financials: FinancialsStats;
    geographic: GeographicStats;
    performance: PerformanceStats;
}

export interface ChartData {
    evolution_mensuelle: Array<{
        month: string;
        count: number;
    }>;
    repartition_nature: Array<{
        name: string;
        value: number;
    }>;
    repartition_vocation: Array<{
        name: string;
        value: number;
    }>;
    top_districts: Array<{
        nom_district: string;
        count: number;
    }>;
    age_pyramid: {
        [key: string]: {
            hommes: number;
            femmes: number;
        };
    };
    completion_rate: {
        rate: number;
        complets: number;
        incomplets: number;
    };
}

export interface StatisticsProps {
    stats: Stats;
    charts: ChartData;
    filters: StatisticsFilters;
    districts: District[];
}