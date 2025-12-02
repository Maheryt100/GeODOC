// Dashboard/components/CompletionCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle2, 
    AlertTriangle, 
    User,
    LandPlot,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompletionDetails } from '../types';

interface Props {
    completion: CompletionDetails;
}

export function CompletionCards({ completion }: Props) {
    // Calculer les pourcentages
    const tauxIncomplet = completion.total_dossiers > 0
        ? ((completion.dossiers_incomplets / completion.total_dossiers) * 100).toFixed(1)
        : 0;

    return (
        <>
            {/* Card 1: Taux de complétion global */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2 mb-3">
                        <div className="text-2xl font-bold">{completion.taux}%</div>
                        <Badge 
                            variant={completion.taux >= 80 ? "default" : "secondary"}
                            className={cn(
                                "text-xs",
                                completion.taux >= 80 && "bg-green-500 hover:bg-green-600"
                            )}
                        >
                            {completion.taux >= 80 ? "Excellent" : 
                             completion.taux >= 60 ? "Bon" : 
                             completion.taux >= 40 ? "Moyen" : "Faible"}
                        </Badge>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="w-full bg-muted rounded-full h-2.5 mb-3">
                        <div 
                            className={cn(
                                "h-2.5 rounded-full transition-all duration-500",
                                completion.taux >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                                completion.taux >= 60 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                                completion.taux >= 40 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                                "bg-gradient-to-r from-orange-500 to-red-500"
                            )}
                            style={{ width: `${completion.taux}%` }}
                        />
                    </div>
                    
                    {/* Statistiques */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-muted-foreground">Complets:</span>
                            <span className="font-semibold">{completion.dossiers_complets}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-orange-600" />
                            <span className="text-muted-foreground">Incomplets:</span>
                            <span className="font-semibold">{completion.dossiers_incomplets}</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Total: {completion.total_dossiers} dossier(s)
                    </p>
                </CardContent>
            </Card>

            {/* Card 2: Données incomplètes (Propriétés & Demandeurs) */}
            <Card className="hover:shadow-lg transition-shadow border-amber-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Données incomplètes</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* Propriétés incomplètes */}
                        <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <LandPlot className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-medium">Propriétés</span>
                            </div>
                            <Badge 
                                variant={completion.proprietes_incompletes > 0 ? "destructive" : "secondary"}
                                className="text-xs"
                            >
                                {completion.proprietes_incompletes}
                            </Badge>
                        </div>
                        
                        {/* Demandeurs incomplets */}
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Demandeurs</span>
                            </div>
                            <Badge 
                                variant={completion.demandeurs_incomplets > 0 ? "destructive" : "secondary"}
                                className="text-xs"
                            >
                                {completion.demandeurs_incomplets}
                            </Badge>
                        </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        Champs obligatoires manquants
                    </p>
                    
                    {(completion.proprietes_incompletes > 0 || completion.demandeurs_incomplets > 0) && (
                        <div className="flex items-center gap-1 mt-2 text-amber-700">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-xs font-medium">À compléter prioritairement</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}