import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { LineChartDotsCustom } from '@/components/line-chart-dots-custom';
import { BarChartMultiple } from '@/components/bar-chart-multiple';
import { ChartRadial } from '@/components/chart-radial';
import { BarChartInteractive } from '@/components/bar-chart-interactive';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];
interface Props {
    lineChartData: { nom_dossier: string; demandes_count: number; }[];
    barChartData:  { nom_dossier: string; demandeurs: number; proprietes: number; }[];
    chartRadialData:  { nom_dossier: string; demandeurs_sans_propriete: number; }[];
    barChartInteractiveData: { nom_dossier: string; prix: number; }[];
}
export default function Dashboard({ lineChartData, barChartData, chartRadialData, barChartInteractiveData}: Props) {
    const { flash } = usePage<SharedData>().props;
    useEffect(()=>{
        if (flash.message != null){
            toast.info(flash.message);
        }
    },[flash.message]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 lg:grid-cols-3">
                    <div className="">
                        <LineChartDotsCustom lineChartData={lineChartData}/>
                    </div>
                    <div className="">
                        <BarChartMultiple barChartData={barChartData}/>
                    </div>
                    <div className="">
                        <ChartRadial chartRadialData={chartRadialData} />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <BarChartInteractive barChartInteractiveData={barChartInteractiveData}/>
                </div>
            </div>
        </AppLayout>
    );
}
