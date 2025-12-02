// Statistics/components/ProprietesTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandPlot, CheckCircle, Clock, MapPin } from 'lucide-react';
import { StatCard } from './StatCard';
import type { ProprietesStats, ChartData } from '../types';

interface Props {
    proprietes: ProprietesStats;
    charts: ChartData;
}

export function ProprietesTab({ proprietes, charts }: Props) {
    const formatSuperficie = (superficie: number) => {
        return new Intl.NumberFormat('fr-FR').format(superficie);
    };

    return (
        <div className="space-y-6">
            {/* Cards de statistiques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    icon={LandPlot}
                    title="Total propriétés"
                    value={proprietes.total.toString()}
                    subtitle={`Superficie totale: ${formatSuperficie(proprietes.superficie_totale)} m²`}
                    color="blue"
                />
                <StatCard 
                    icon={Clock}
                    title="Disponibles"
                    value={proprietes.disponibles.toString()}
                    subtitle="Avec demandes actives"
                    color="green"
                />
                <StatCard 
                    icon={CheckCircle}
                    title="Acquises"
                    value={proprietes.acquises.toString()}
                    subtitle="Toutes demandes archivées"
                    color="purple"
                />
                <StatCard 
                    icon={MapPin}
                    title="Sans demande"
                    value={proprietes.sans_demande.toString()}
                    subtitle="Aucune demande associée"
                    color="orange"
                />
            </div>

            {/* Superficie détaillée */}
            <Card>
                <CardHeader>
                    <CardTitle>Superficie moyenne</CardTitle>
                    <CardDescription>Par propriété</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">
                        {formatSuperficie(proprietes.superficie_moyenne)} m²
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Basé sur {proprietes.total} propriétés
                    </p>
                </CardContent>
            </Card>

            {/* Graphiques */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Répartition par nature */}
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par nature</CardTitle>
                        <CardDescription>Distribution des types de terrains</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {charts.repartition_nature && charts.repartition_nature.length > 0 ? (
                                charts.repartition_nature.map((item) => {
                                    const total = charts.repartition_nature.reduce((sum, i) => sum + i.value, 0);
                                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    
                                    return (
                                        <div key={item.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium capitalize">{item.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {item.value} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Répartition par vocation */}
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par vocation</CardTitle>
                        <CardDescription>Distribution des vocations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {charts.repartition_vocation && charts.repartition_vocation.length > 0 ? (
                                charts.repartition_vocation.map((item) => {
                                    const total = charts.repartition_vocation.reduce((sum, i) => sum + i.value, 0);
                                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    
                                    return (
                                        <div key={item.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium capitalize">{item.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {item.value} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}