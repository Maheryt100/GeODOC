// Dashboard/components/DemandeursCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemandeurDetails } from '../types';

interface Props {
    details: DemandeurDetails;
    variation?: string;
}

export function DemandeursCard({ details, variation = '+15%' }: Props) {
    // Calculer les pourcentages
    const pourcentageActifs = details.total > 0 
        ? ((details.actifs / details.total) * 100).toFixed(1) 
        : 0;
    
    const pourcentageAcquis = details.total > 0 
        ? ((details.acquis / details.total) * 100).toFixed(1) 
        : 0;
    
    const pourcentageHommes = details.total > 0 
        ? ((details.hommes / details.total) * 100).toFixed(0) 
        : 0;
    
    const pourcentageFemmes = details.total > 0 
        ? ((details.femmes / details.total) * 100).toFixed(0) 
        : 0;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Demandeurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Total et actifs */}
                <div className="flex items-baseline gap-2 mb-3">
                    <div className="text-2xl font-bold">{details.total}</div>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        Total
                    </Badge>
                </div>

                {/* Statuts */}
                <div className="space-y-2 mb-3 pb-3 border-b">
                    {/* Demandeurs actifs (en cours) */}
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs font-medium text-green-700">En cours</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-700">{details.actifs}</span>
                            <Badge variant="secondary" className="text-xs">
                                {pourcentageActifs}%
                            </Badge>
                        </div>
                    </div>

                    {/* Demandeurs ayant acquis */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">Acquis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-700">{details.acquis}</span>
                            <Badge variant="secondary" className="text-xs">
                                {pourcentageAcquis}%
                            </Badge>
                        </div>
                    </div>

                    {/* Sans propriété */}
                    {details.sans_propriete > 0 && (
                        <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <UserX className="h-3.5 w-3.5 text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">Sans propriété</span>
                            </div>
                            <span className="text-sm font-bold text-orange-700">
                                {details.sans_propriete}
                            </span>
                        </div>
                    )}
                </div>

                {/* Répartition par genre */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Par genre</span>
                    </div>

                    {/* Hommes */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs">Hommes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{details.hommes}</span>
                            <Badge variant="outline" className="text-xs">
                                {pourcentageHommes}%
                            </Badge>
                        </div>
                    </div>

                    {/* Femmes */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="w-2 h-2 rounded-full bg-pink-500" />
                            <span className="text-xs">Femmes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{details.femmes}</span>
                            <Badge variant="outline" className="text-xs">
                                {pourcentageFemmes}%
                            </Badge>
                        </div>
                    </div>

                    {/* Barre de progression genre */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="flex h-full rounded-full overflow-hidden">
                            <div 
                                className="bg-blue-500 transition-all duration-500"
                                style={{ width: `${pourcentageHommes}%` }}
                            />
                            <div 
                                className="bg-pink-500 transition-all duration-500"
                                style={{ width: `${pourcentageFemmes}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Tendance */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">{variation} ce mois</span>
                </div>
            </CardContent>
        </Card>
    );
}