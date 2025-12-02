// Statistics/components/OverviewTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, LandPlot, Users, DollarSign } from 'lucide-react';
import { StatCard } from './StatCard';
import type { Stats } from '../types';

interface Props {
    stats: Stats;
}

export function OverviewTab({ stats }: Props) {
    const overview = stats.overview;
    const proprietes = stats.proprietes;
    const demandeurs = stats.demandeurs;
    const financials = stats.financials;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    icon={Activity}
                    title="Total dossiers"
                    value={overview.total_dossiers.toString()}
                    subtitle={`${overview.dossiers_ouverts} ouverts, ${overview.dossiers_fermes} fermés`}
                    trend={overview.taux_croissance}
                    color="blue"
                />
                <StatCard 
                    icon={LandPlot}
                    title="Propriétés"
                    value={proprietes.total.toString()}
                    subtitle={`${proprietes.disponibles} disponibles`}
                    trend={8}
                    color="green"
                />
                <StatCard 
                    icon={Users}
                    title="Demandeurs"
                    value={demandeurs.total.toString()}
                    subtitle={`${demandeurs.avec_propriete} avec propriété`}
                    trend={15}
                    color="purple"
                />
                <StatCard 
                    icon={DollarSign}
                    title="Revenus"
                    value={`${(financials.total_revenus_potentiels / 1000000).toFixed(1)}M Ar`}
                    subtitle="Potentiel total"
                    trend={25}
                    color="orange"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Évolution mensuelle</CardTitle>
                    <CardDescription>Activité sur les 12 derniers mois</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Graphique d'évolution (à implémenter avec Recharts)
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}