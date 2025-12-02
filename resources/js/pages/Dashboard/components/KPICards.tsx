// Dashboard/components/KPICards.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    TrendingUp, Folder, FolderOpen, 
    Users, DollarSign,
    Clock, AlertCircle, FileText, Activity,
    Eye, EyeOff
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import type { KPI } from '../types';
import { CompletionCards } from './CompletionCards';
import { ProprietesCard } from './ProprietesCard';
import { DemandeursCard } from './DemandeursCard';
import { DossiersCard } from './DossiersCard';

interface Props {
    kpis: KPI;
}

export function KPICards({ kpis }: Props) {
    const { auth } = usePage().props as any;
    const [showRevenue, setShowRevenue] = useState(false);
    
    const canViewRevenue = auth.user.role === 'super_admin' || auth.user.role === 'admin_district';

    const variations = {
        dossiers: '+12%',
        proprietes: '+8%',
        demandeurs: '+15%',
        revenus: '+25%'
    };

    const safeKpis = {
        dossiers_ouverts: kpis.dossiers_ouverts ?? 0,
        dossiers_fermes: kpis.dossiers_fermes ?? 0,
        proprietes_disponibles: kpis.proprietes_disponibles ?? 0,
        proprietes_acquises: kpis.proprietes_acquises ?? 0,
        completion: kpis.completion ?? {
            taux: 0,
            dossiers_complets: 0,
            dossiers_incomplets: 0,
            total_dossiers: 0,
            proprietes_incompletes: 0,
            demandeurs_incomplets: 0,
        },
        superficie_details: kpis.superficie_details ?? {
            totale: 0,
            acquise: 0,
            disponible: 0,
        },
        demandeurs_details: kpis.demandeurs_details ?? {  // ✅ AJOUTER CETTE LIGNE
        total: 0,
        actifs: 0,
        acquis: 0,
        sans_propriete: 0,
        hommes: 0,
        femmes: 0,
        hommes_actifs: 0,
        femmes_actifs: 0,
    },
        demandeurs_actifs: kpis.demandeurs_actifs ?? 0,
        revenus_potentiels: kpis.revenus_potentiels ?? 0,
        nouveaux_dossiers: kpis.nouveaux_dossiers ?? 0,
        dossiers_en_retard: kpis.dossiers_en_retard ?? 0,
        temps_moyen_traitement: kpis.temps_moyen_traitement ?? 0,
        superficie_totale: kpis.superficie_totale ?? 0,
        demandeurs_sans_propriete: kpis.demandeurs_sans_propriete ?? 0,
        documents_generes_aujourdhui: kpis.documents_generes_aujourdhui ?? 0,
        utilisateurs_actifs_24h: kpis.utilisateurs_actifs_24h ?? 0,
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          
            {/* ✅ Dossiers - Composant fusionné */}
            <DossiersCard 
                ouverts={safeKpis.dossiers_ouverts}
                fermes={safeKpis.dossiers_fermes}
                nouveaux={safeKpis.nouveaux_dossiers}
                enRetard={safeKpis.dossiers_en_retard}
                completion={safeKpis.completion}
                variation={variations.dossiers}
            />

            {/* ✅ Propriétés - Composant amélioré */}
            <ProprietesCard 
                disponibles={safeKpis.proprietes_disponibles}
                acquises={safeKpis.proprietes_acquises}
                superficie={safeKpis.superficie_details}
            />

            {/* Cards de complétion */}
            <CompletionCards completion={safeKpis.completion} />

            {/* ✅ Demandeurs - Composant amélioré */}
            <DemandeursCard 
                details={safeKpis.demandeurs_details}
                variation={variations.demandeurs}
            />

            {/* Performance Système */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activité Système</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {safeKpis.documents_generes_aujourdhui !== undefined && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs">Documents générés</span>
                                </div>
                                <Badge variant="secondary">{safeKpis.documents_generes_aujourdhui}</Badge>
                            </div>
                        )}
                        {safeKpis.utilisateurs_actifs_24h !== undefined && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3 text-green-600" />
                                    <span className="text-xs">Utilisateurs actifs (24h)</span>
                                </div>
                                <Badge variant="secondary">{safeKpis.utilisateurs_actifs_24h}</Badge>
                            </div>
                        )}
                        {safeKpis.temps_moyen_traitement !== undefined && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-orange-600" />
                                    <span className="text-xs">Temps moyen</span>
                                </div>
                                <Badge variant="secondary">{safeKpis.temps_moyen_traitement}j</Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Revenus potentiels */}
            <Card className="hover:shadow-lg transition-shadow lg:col-span-2 md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus potentiels</CardTitle>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {canViewRevenue && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRevenue(!showRevenue)}
                                className="h-6 w-6 p-0"
                            >
                                {showRevenue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {canViewRevenue ? (
                        <>
                            <div className="text-2xl font-bold">
                                {showRevenue ? (
                                    `${safeKpis.revenus_potentiels.toLocaleString('fr-FR')} Ar`
                                ) : (
                                    <span className="select-none">••••••••</span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Total des demandes actives (non archivées)
                            </p>
                            {showRevenue && (
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">{variations.revenus}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                            <EyeOff className="h-8 w-8 mb-2" />
                            <p className="text-sm">Accès réservé aux administrateurs</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}