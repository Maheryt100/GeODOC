// Statistics/components/DossiersTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import type { DossiersStats, ChartData } from '../types';

interface Props {
    dossiers: DossiersStats;
    charts: ChartData;
}

export function DossiersTab({ dossiers, charts }: Props) {
    return (
        <div className="space-y-6">
            {/* Cards de statistiques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    icon={Folder}
                    title="Total dossiers"
                    value={dossiers.total.toString()}
                    subtitle={`Période sélectionnée`}
                    color="blue"
                />
                <StatCard 
                    icon={FolderOpen}
                    title="Dossiers ouverts"
                    value={dossiers.ouverts.toString()}
                    subtitle={`${Math.round((dossiers.ouverts / dossiers.total) * 100)}% du total`}
                    color="green"
                />
                <StatCard 
                    icon={Clock}
                    title="Durée moyenne"
                    value={`${dossiers.duree_moyenne} jours`}
                    subtitle="Temps de traitement"
                    color="purple"
                />
                <StatCard 
                    icon={AlertCircle}
                    title="En retard"
                    value={dossiers.en_retard.toString()}
                    subtitle="> 90 jours"
                    color="orange"
                />
            </div>

            {/* Répartition par statut */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par statut</CardTitle>
                        <CardDescription>État actuel des dossiers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FolderOpen className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="font-medium">Dossiers ouverts</p>
                                        <p className="text-sm text-muted-foreground">En cours de traitement</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{dossiers.ouverts}</p>
                                    <Badge variant="secondary">
                                        {Math.round((dossiers.ouverts / dossiers.total) * 100)}%
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Folder className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <p className="font-medium">Dossiers fermés</p>
                                        <p className="text-sm text-muted-foreground">Traitement terminé</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{dossiers.fermes}</p>
                                    <Badge variant="secondary">
                                        {Math.round((dossiers.fermes / dossiers.total) * 100)}%
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top communes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top communes</CardTitle>
                        <CardDescription>Communes les plus actives</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {charts.evolution_mensuelle && charts.evolution_mensuelle.length > 0 ? (
                                <p className="text-sm text-muted-foreground">Graphique à implémenter</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Évolution mensuelle */}
            <Card>
                <CardHeader>
                    <CardTitle>Évolution mensuelle</CardTitle>
                    <CardDescription>Ouvertures et fermetures sur 12 mois</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Graphique à implémenter avec Recharts
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}