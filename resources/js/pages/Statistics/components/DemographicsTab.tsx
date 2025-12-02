// Statistics/components/DemographicsTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DemographicsStats } from '../types';

interface Props {
    demographics: DemographicsStats;
}

export function DemographicsTab({ demographics }: Props) {
    const totalPersonnes = demographics.total_hommes + demographics.total_femmes;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par genre</CardTitle>
                        <CardDescription>Demandeurs avec propriété</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <span className="text-xl">👨</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">Hommes</p>
                                        <p className="text-sm text-muted-foreground">
                                            {demographics.hommes_avec_propriete} avec propriété
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{demographics.total_hommes}</p>
                                    <Badge variant="secondary">
                                        {demographics.pourcentage_hommes}%
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                                        <span className="text-xl">👩</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">Femmes</p>
                                        <p className="text-sm text-muted-foreground">
                                            {demographics.femmes_avec_propriete} avec propriété
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{demographics.total_femmes}</p>
                                    <Badge variant="secondary">
                                        {demographics.pourcentage_femmes}%
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par âge</CardTitle>
                        <CardDescription>
                            Âge moyen: {demographics.age_moyen} ans
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(demographics.tranches_age).map(([tranche, count]) => {
                                const percentage = totalPersonnes > 0 
                                    ? (count / totalPersonnes) * 100 
                                    : 0;
                                
                                return (
                                    <div key={tranche}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{tranche} ans</span>
                                            <span className="text-sm text-muted-foreground">
                                                {count} personnes
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}