// Dashboard/components/ActivitySection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import type { Activity, TopCommune } from '../types';

interface Props {
    recentActivity: Activity[];
    topCommunes: TopCommune[];
}

export function ActivitySection({ recentActivity, topCommunes }: Props) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Top communes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Top 5 Communes
                    </CardTitle>
                    <CardDescription>
                        Communes avec le plus de dossiers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {topCommunes && topCommunes.length > 0 ? (
                        <div className="space-y-3">
                            {topCommunes.map((commune: TopCommune, index: number) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Badge 
                                            variant="outline" 
                                            className="w-8 h-8 flex items-center justify-center font-bold"
                                        >
                                            {index + 1}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{commune.commune}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {commune.fokontany} • {commune.type_commune}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {commune.count} dossiers
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucune donnée disponible
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Activité récente
                    </CardTitle>
                    <CardDescription>
                        Dernières actions sur la plateforme
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentActivity && recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.slice(0, 5).map((activity: Activity) => (
                                <div 
                                    key={activity.id} 
                                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activity.user} • {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucune activité récente
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}