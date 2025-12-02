// pages/Statistics/Index.tsx
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsHeader } from './components/StatisticsHeader';
import { StatisticsFilters } from './components/StatisticsFilters';
import { OverviewTab } from './components/OverviewTab';
import { DemographicsTab } from './components/DemographicsTab';
import { FinancialsTab } from './components/FinancialsTab';
import { DossiersTab } from './components/DossiersTab';
import { ProprietesTab } from './components/ProprietesTab';
import { DemandeursTab } from './components/DemandeursTab';
import { GeographicTab } from './components/GeographicTab';
import { PerformanceTab } from './components/PerformanceTab';
import type { StatisticsProps } from './types';

export default function StatisticsIndex({ stats, charts, filters, districts }: StatisticsProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Statistiques', href: '#' }
        ]}>
            <Head title="Statistiques" />

            <div className="flex flex-col gap-6 p-6">
                <StatisticsHeader filters={filters} />
                
                <StatisticsFilters filters={filters} districts={districts} />

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-8">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
                        <TabsTrigger value="proprietes">Propriétés</TabsTrigger>
                        <TabsTrigger value="demandeurs">Demandeurs</TabsTrigger>
                        <TabsTrigger value="demographics">Démographie</TabsTrigger>
                        <TabsTrigger value="financials">Finances</TabsTrigger>
                        <TabsTrigger value="geographic">Géographie</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <OverviewTab stats={stats} />
                    </TabsContent>

                    <TabsContent value="demographics" className="space-y-6">
                        <DemographicsTab demographics={stats.demographics} />
                    </TabsContent>

                    <TabsContent value="financials" className="space-y-6">
                        <FinancialsTab financials={stats.financials} />
                    </TabsContent>

                    <TabsContent value="dossiers">
                        <DossiersTab dossiers={stats.dossiers} charts={charts} />
                    </TabsContent>

                    <TabsContent value="proprietes">
                        <ProprietesTab proprietes={stats.proprietes} charts={charts} />
                    </TabsContent>

                    <TabsContent value="demandeurs">
                        <DemandeursTab demandeurs={stats.demandeurs} charts={charts} />
                    </TabsContent>

                    <TabsContent value="geographic">
                        <GeographicTab geographic={stats.geographic} />
                    </TabsContent>

                    <TabsContent value="performance">
                        <PerformanceTab performance={stats.performance} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}