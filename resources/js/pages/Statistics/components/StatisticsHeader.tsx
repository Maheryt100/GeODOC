// Statistics/components/StatisticsHeader.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, FileDown } from 'lucide-react';
import type { StatisticsFilters } from '../types';

interface Props {
    filters: StatisticsFilters;
}

export function StatisticsHeader({ filters }: Props) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = () => {
        setIsExporting(true);
        window.location.href = route('statistiques.export-pdf', {
            period: filters.period,
            date_from: filters.period === 'custom' ? filters.date_from : null,
            date_to: filters.period === 'custom' ? filters.date_to : null,
            district_id: filters.district_id !== null ? filters.district_id : null,
        });
        setTimeout(() => setIsExporting(false), 2000);
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">Statistiques</h1>
                <p className="text-muted-foreground mt-1">
                    Analyse détaillée de vos données
                </p>
            </div>
            <Button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="gap-2"
            >
                {isExporting ? (
                    <>
                        <Activity className="h-4 w-4 animate-spin" />
                        Génération...
                    </>
                ) : (
                    <>
                        <FileDown className="h-4 w-4" />
                        Exporter PDF
                    </>
                )}
            </Button>
        </div>
    );
}