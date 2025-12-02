// Statistics/components/DemandeursTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';
import { StatCard } from './StatCard';
import type { DemandeursStats, ChartData } from '../types';

interface Props {
    demandeurs: DemandeursStats;
    charts: ChartData;
}

export function DemandeursTab({ demandeurs, charts }: Props) {
    return (
        <div className="space-y-6">
            {/* Cards de statistiques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    icon={Users}
                    title="Total demandeurs"
                    value={demandeurs.total.toString()}
                    subtitle={`Âge moyen: ${demandeurs.age_moyen} ans`}
                    color="blue"
                />
                <StatCard 
                    icon={Activity}
                    title="Demandeurs actifs"
                    value={demandeurs.actifs.toString()}
                    subtitle="Avec demandes actives"
                    color="green"
                />
                <StatCard 
                    icon={UserCheck}
                    title="Avec propriété"
                    value={demandeurs.avec_propriete.toString()}
                    subtitle={`${Math.round((demandeurs.avec_propriete / demandeurs.total) * 100)}% du total`}
                    color="purple"
                />
                <StatCard 
                    icon={UserX}
                    title="Sans propriété"
                    value={demandeurs.sans_propriete.toString()}
                    subtitle="À traiter"
                    color="orange"
                />
            </div>

            {/* Répartition détaillée */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Statut des demandeurs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Statut des demandeurs</CardTitle>
                        <CardDescription>Répartition par état</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="font-medium">Actifs</p>
                                        <p className="text-sm text-muted-foreground">Avec demandes en cours</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{demandeurs.actifs}</p>
                                    <Badge variant="secondary">
                                        {Math.round((demandeurs.actifs / demandeurs.total) * 100)}%
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <UserCheck className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <p className="font-medium">Avec propriété</p>
                                        <p className="text-sm text-muted-foreground">Au moins une propriété</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{demandeurs.avec_propriete}</p>
                                    <Badge variant="secondary">
                                        {Math.round((demandeurs.avec_propriete / demandeurs.total) * 100)}%
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <UserX className="h-8 w-8 text-orange-600" />
                                    <div>
                                        <p className="font-medium">Sans propriété</p>
                                        <p className="text-sm text-muted-foreground">Aucune propriété associée</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold">{demandeurs.sans_propriete}</p>
                                    <Badge variant="secondary">
                                        {Math.round((demandeurs.sans_propriete / demandeurs.total) * 100)}%
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Informations complémentaires */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations démographiques</CardTitle>
                        <CardDescription>Vue d'ensemble</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Âge moyen</span>
                                    <span className="text-2xl font-bold">{demandeurs.age_moyen} ans</span>
                                </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Taux d'activation</span>
                                    <span className="text-2xl font-bold">
                                        {Math.round((demandeurs.actifs / demandeurs.total) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-background rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                                        style={{ width: `${Math.round((demandeurs.actifs / demandeurs.total) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Avec propriété</span>
                                    <span className="text-2xl font-bold">
                                        {Math.round((demandeurs.avec_propriete / demandeurs.total) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-background rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                        style={{ width: `${Math.round((demandeurs.avec_propriete / demandeurs.total) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}