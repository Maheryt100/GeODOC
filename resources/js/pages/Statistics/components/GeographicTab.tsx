// Statistics/components/GeographicTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Map } from 'lucide-react';
import type { GeographicStats } from '../types';

interface Props {
    geographic: GeographicStats;
}

export function GeographicTab({ geographic }: Props) {
    return (
        <div className="space-y-6">
            {/* Top communes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Top 10 communes
                    </CardTitle>
                    <CardDescription>Communes les plus actives</CardDescription>
                </CardHeader>
                <CardContent>
                    {geographic.top_communes && geographic.top_communes.length > 0 ? (
                        <div className="space-y-3">
                            {geographic.top_communes.map((commune, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{commune.commune}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {commune.fokontany}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {commune.type_commune}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{commune.count}</p>
                                        <p className="text-xs text-muted-foreground">dossiers</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Map className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-sm">Aucune donnée géographique disponible</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Carte interactive (placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle>Répartition géographique</CardTitle>
                    <CardDescription>Visualisation cartographique</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
                        <div className="text-center text-muted-foreground">
                            <Map className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p>Carte interactive à implémenter</p>
                            <p className="text-sm mt-2">Intégration possible avec Leaflet ou MapBox</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}