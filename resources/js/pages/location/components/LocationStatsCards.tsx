// resources/js/pages/location/components/LocationStatsCards.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LocationStatsCardsProps {
    totalDistricts: number;
    districtsWithPrices: number;
}

export default function LocationStatsCards({ totalDistricts, districtsWithPrices }: LocationStatsCardsProps) {
    const districtsMissing = totalDistricts - districtsWithPrices;
    const percentComplete = totalDistricts > 0 
        ? Math.round((districtsWithPrices / totalDistricts) * 100) 
        : 0;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Districts</CardTitle>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalDistricts}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Circonscriptions enregistrées
                    </p>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prix Configurés</CardTitle>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {districtsWithPrices}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {percentComplete}% des districts complétés
                    </p>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prix Manquants</CardTitle>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {districtsMissing}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Districts à configurer
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}