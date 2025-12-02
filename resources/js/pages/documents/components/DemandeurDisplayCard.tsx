// documents/components/DemandeurDisplayCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Phone, MapPin, Briefcase } from 'lucide-react';
import { Demandeur } from '@/types';

interface DemandeurDisplayCardProps {
    demandeur: Demandeur;
    ordre?: number;
    isPrincipal?: boolean;
    colorScheme?: 'violet' | 'emerald' | 'blue';
}

export default function DemandeurDisplayCard({
    demandeur,
    ordre,
    isPrincipal = false,
    colorScheme = 'blue'
}: DemandeurDisplayCardProps) {
    
    const colorClasses = {
        violet: 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20',
        emerald: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20',
        blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
    };

    const iconColorClasses = {
        violet: 'text-violet-600 dark:text-violet-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        blue: 'text-blue-600 dark:text-blue-400',
    };

    return (
        <Card className={`border-2 ${colorClasses[colorScheme]}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <Users className={`h-5 w-5 ${iconColorClasses[colorScheme]} flex-shrink-0 mt-1`} />
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {isPrincipal && (
                                <Badge className="bg-yellow-500 text-white">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Principal
                                </Badge>
                            )}
                            {!isPrincipal && ordre && (
                                <Badge variant="outline">
                                    Ordre {ordre}
                                </Badge>
                            )}
                            <span className="font-semibold">
                                {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">CIN:</span>
                                <div className="font-mono text-xs">{demandeur.cin}</div>
                            </div>
                            {demandeur.occupation && (
                                <div>
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        Occupation:
                                    </span>
                                    <div className="font-medium text-xs">{demandeur.occupation}</div>
                                </div>
                            )}
                        </div>

                        {demandeur.domiciliation && (
                            <div className="text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Domiciliation:
                                </span>
                                <div className="font-medium text-xs">{demandeur.domiciliation}</div>
                            </div>
                        )}

                        {demandeur.telephone && (
                            <div className="text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Téléphone:
                                </span>
                                <div className="font-medium text-xs">{demandeur.telephone}</div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}