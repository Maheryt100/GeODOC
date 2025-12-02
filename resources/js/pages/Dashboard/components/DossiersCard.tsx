// Dashboard/components/DossiersCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Folder, 
    FolderOpen, 
    FolderCheck, 
    FolderX,
    AlertCircle, 
    TrendingUp,
    FileQuestion
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompletionDetails } from '../types';

interface Props {
    ouverts: number;
    fermes: number;
    nouveaux: number;
    enRetard: number;
    completion: CompletionDetails;
    variation?: string;
}

export function DossiersCard({ 
    ouverts, 
    fermes, 
    nouveaux, 
    enRetard,
    completion,
    variation = '+12%' 
}: Props) {
    const total = ouverts + fermes;
    const tauxIncomplet = completion.total_dossiers > 0
        ? ((completion.dossiers_incomplets / completion.total_dossiers) * 100).toFixed(1)
        : 0;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dossiers</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Total et statut */}
                <div className="flex items-baseline gap-2 mb-3">
                    <div className="text-2xl font-bold">{total}</div>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        Total
                    </Badge>
                </div>

                {/* Statistiques principales */}
                <div className="space-y-2 mb-3 pb-3 border-b">
                    {/* Ouverts */}
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Ouverts</span>
                        </div>
                        <span className="text-sm font-bold text-green-700">{ouverts}</span>
                    </div>

                    {/* Fermés */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FolderCheck className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">Fermés</span>
                        </div>
                        <span className="text-sm font-bold text-blue-700">{fermes}</span>
                    </div>

                    {/* Incomplets */}
                    {completion.dossiers_incomplets > 0 && (
                        <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <FileQuestion className="h-3.5 w-3.5 text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">Incomplets</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-orange-700">
                                    {completion.dossiers_incomplets}
                                </span>
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                    {tauxIncomplet}%
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>

                {/* Informations supplémentaires */}
                <div className="space-y-2">
                    {/* Nouveaux ce mois */}
                    {nouveaux > 0 && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Nouveaux ce mois</span>
                            <Badge variant="secondary" className="text-xs">
                                {nouveaux}
                            </Badge>
                        </div>
                    )}

                    {/* Dossiers en retard */}
                    {enRetard > 0 && (
                        <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                <span className="text-xs font-medium text-red-700">
                                    En retard (&gt;90j)
                                </span>
                            </div>
                            <span className="text-sm font-bold text-red-700">{enRetard}</span>
                        </div>
                    )}

                    {/* Message d'action si incomplets */}
                    {completion.dossiers_incomplets > 0 && (
                        <div className="pt-2 border-t">
                            <p className="text-xs text-orange-700 font-medium">
                                ⚠️ Action requise
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {completion.dossiers_incomplets} dossier(s) sans demandeurs ou propriétés
                            </p>
                        </div>
                    )}
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