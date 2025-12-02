// Statistics/components/PerformanceTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import type { PerformanceStats } from '../types';

interface Props {
    performance: PerformanceStats;
}

export function PerformanceTab({ performance }: Props) {
    const getCompletionColor = (rate: number) => {
        if (rate >= 80) return 'text-green-600';
        if (rate >= 50) return 'text-orange-600';
        return 'text-red-600';
    };

    const getCompletionBg = (rate: number) => {
        if (rate >= 80) return 'bg-green-500';
        if (rate >= 50) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Cards de statistiques */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard 
                    icon={CheckCircle}
                    title="Taux de complétion"
                    value={`${performance.taux_completion}%`}
                    subtitle="Dossiers complets"
                    color="blue"
                />
                <StatCard 
                    icon={Clock}
                    title="Temps moyen"
                    value={`${performance.temps_moyen_traitement} jours`}
                    subtitle="Durée de traitement"
                    color="purple"
                />
                <StatCard 
                    icon={AlertCircle}
                    title="Dossiers en retard"
                    value={performance.dossiers_en_retard.toString()}
                    subtitle="> 90 jours"
                    color="orange"
                />
            </div>

            {/* Indicateur de complétion détaillé */}
            <Card>
                <CardHeader>
                    <CardTitle>Indicateur de complétion</CardTitle>
                    <CardDescription>Qualité globale des données</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Barre de progression principale */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Taux global</span>
                                <span className={`text-3xl font-bold ${getCompletionColor(performance.taux_completion)}`}>
                                    {performance.taux_completion}%
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-4">
                                <div 
                                    className={`${getCompletionBg(performance.taux_completion)} h-4 rounded-full transition-all duration-500`}
                                    style={{ width: `${performance.taux_completion}%` }}
                                />
                            </div>
                        </div>

                        {/* Légende */}
                        <div className="grid gap-2 pt-4">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-muted-foreground">Excellent (≥ 80%)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="text-muted-foreground">Moyen (50-79%)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-muted-foreground">Faible (&lt; 50%)</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Métriques de performance */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Temps de traitement */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Efficacité du traitement
                        </CardTitle>
                        <CardDescription>Analyse des délais</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Temps moyen</span>
                                    <span className="text-2xl font-bold">
                                        {performance.temps_moyen_traitement} jours
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Basé sur les dossiers fermés
                                </p>
                            </div>

                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm font-medium">En retard</span>
                                    </div>
                                    <span className="text-2xl font-bold text-orange-600">
                                        {performance.dossiers_en_retard}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Dossiers ouverts depuis plus de 90 jours
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recommandations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Recommandations
                        </CardTitle>
                        <CardDescription>Actions suggérées</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {performance.taux_completion < 80 && (
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                        Améliorer la complétion des données
                                    </p>
                                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                        Compléter les informations manquantes dans les dossiers
                                    </p>
                                </div>
                            )}

                            {performance.dossiers_en_retard > 0 && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                        Traiter les dossiers en retard
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                        {performance.dossiers_en_retard} dossier(s) nécessite(nt) une attention urgente
                                    </p>
                                </div>
                            )}

                            {performance.temps_moyen_traitement > 60 && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Optimiser les processus
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                        Le délai moyen pourrait être réduit par une meilleure organisation
                                    </p>
                                </div>
                            )}

                            {performance.taux_completion >= 80 && performance.dossiers_en_retard === 0 && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                        Excellente performance !
                                    </p>
                                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                        Continuez sur cette lancée
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}