// Dashboard/Index.tsx
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import GlobalSearch from '@/components/GlobalSearch';
import { KPICards } from './components/KPICards';
import { ActivitySection } from './components/ActivitySection';
import { ChartsSection } from './components/ChartsSection';
import { QuickActions } from './components/QuickActions';
import { AlertsSection } from './components/AlertsSection';
import type { DashboardProps } from './types';

export default function DashboardIndex({ kpis, charts, alerts, recentActivity }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* En-tête avec recherche */}
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
                    <p className="text-muted-foreground mb-4">
                        Vue d'ensemble de vos activités et statistiques
                    </p>
                    <GlobalSearch className="w-full" />
                </div>

                {/* Alertes */}
                <AlertsSection alerts={alerts} />

                {/* KPIs Principaux */}
                <KPICards kpis={kpis} />

                {/* Graphiques */}
                <ChartsSection charts={charts} />

                {/* Activité récente et Top communes */}
                <ActivitySection 
                    recentActivity={recentActivity}
                    topCommunes={charts.top_communes}
                />

                {/* Actions rapides */}
                <QuickActions />
            </div>
        </AppLayout>
    );
}