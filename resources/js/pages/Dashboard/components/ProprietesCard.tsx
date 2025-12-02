// Dashboard/components/ProprietesCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandPlot, TrendingUp, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuperficieDetails } from '../types';

interface Props {
    disponibles: number;
    acquises: number;
    superficie: SuperficieDetails;
}

export function ProprietesCard({ disponibles, acquises, superficie }: Props) {
    // Formattage de la superficie
    const formatSuperficie = (superficie: number): string => {
        if (superficie >= 10000) {
            return `${(superficie / 10000).toFixed(2)} ha`;
        }
        return `${superficie.toLocaleString('fr-FR')} m²`;
    };

    // Calculer le pourcentage acquis
    const total = disponibles + acquises;
    const pourcentageAcquis = total > 0 
        ? ((acquises / total) * 100).toFixed(1) 
        : 0;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
                <LandPlot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Nombre de propriétés */}
                <div className="flex items-baseline gap-2 mb-3">
                    <div className="text-2xl font-bold">{disponibles}</div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        En cours de traitement
                    </Badge>
                </div>

                {/* Propriétés acquises */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <span className="text-xs text-muted-foreground">Propriétés acquises</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{acquises}</span>
                        <Badge variant="secondary" className="text-xs">
                            {pourcentageAcquis}%
                        </Badge>
                    </div>
                </div>

                {/* Superficies détaillées */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Maximize2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Superficies</span>
                    </div>

                    {/* Superficie totale */}
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs font-medium">Total</span>
                        <span className="text-xs font-bold text-slate-700">
                            {formatSuperficie(superficie.totale)}
                        </span>
                    </div>

                    {/* Superficie disponible */}
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <span className="text-xs font-medium text-green-700">En cours</span>
                        <span className="text-xs font-bold text-green-700">
                            {formatSuperficie(superficie.disponible)}
                        </span>
                    </div>

                    {/* Superficie acquise */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <span className="text-xs font-medium text-blue-700">Acquise</span>
                        <span className="text-xs font-bold text-blue-700">
                            {formatSuperficie(superficie.acquise)}
                        </span>
                    </div>
                </div>

                {/* Tendance */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">+8% ce mois</span>
                </div>
            </CardContent>
        </Card>
    );
}