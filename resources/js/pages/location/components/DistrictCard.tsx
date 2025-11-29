// resources/js/pages/location/components/DistrictCard.tsx

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2, AlertCircle, Pencil, Eye } from 'lucide-react';
import type { District } from '@/types';

interface DistrictCardProps {
    district: District;
    isComplete: boolean;
    isSuperAdmin: boolean;
    onEdit: () => void;
    onView: () => void;
}

const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined || price === 0) {
        return '0';
    }
    return price.toLocaleString('fr-FR');
};

export default function DistrictCard({ district, isComplete, isSuperAdmin, onEdit, onView }: DistrictCardProps) {
    return (
        <div
            className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                isComplete 
                    ? 'bg-green-50/50 border-green-200 hover:bg-green-50 dark:bg-green-950/20 dark:border-green-900 dark:hover:bg-green-950/30'
                    : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 dark:hover:bg-amber-950/30'
            }`}
        >
            <div className="flex items-center gap-3 flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    isComplete 
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-amber-100 dark:bg-amber-900'
                }`}>
                    <Building2 className={`h-4 w-4 ${
                        isComplete ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
                    }`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1">{district.nom_district}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Édilitaire: <span className="font-mono font-medium">{formatPrice(district.edilitaire)}</span> Ar/m²</span>
                        <span>Agricole: <span className="font-mono font-medium">{formatPrice(district.agricole)}</span> Ar/m²</span>
                        <span>Forestière: <span className="font-mono font-medium">{formatPrice(district.forestiere)}</span> Ar/m²</span>
                        <span>Touristique: <span className="font-mono font-medium">{formatPrice(district.touristique)}</span> Ar/m²</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
                {isComplete ? (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Complet
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Incomplet
                    </Badge>
                )}
                {isSuperAdmin ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="hover:bg-primary/10"
                    >
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onView}
                        className="hover:bg-primary/10"
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                    </Button>
                )}
            </div>
        </div>
    );
}