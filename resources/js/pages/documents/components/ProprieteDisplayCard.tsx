// documents/components/ProprieteDisplayCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Coins, Crown, Ruler } from 'lucide-react';
import { ProprieteWithDemandeurs } from '../types';
import { getDemandeurPrincipal, getConsorts } from '../validation';

interface ProprieteDisplayCardProps {
    propriete: ProprieteWithDemandeurs;
    showDemandeurs?: boolean;
    showPrice?: boolean;
    colorScheme?: 'violet' | 'emerald' | 'blue';
}

export default function ProprieteDisplayCard({
    propriete,
    showDemandeurs = true,
    showPrice = true,
    colorScheme = 'violet'
}: ProprieteDisplayCardProps) {
    
    const principal = getDemandeurPrincipal(propriete.demandeurs_lies || []);
    const consorts = getConsorts(propriete.demandeurs_lies || []);

    const formatContenance = (contenance: number): string => {
        const hectares = Math.floor(contenance / 10000);
        const reste = contenance % 10000;
        const ares = Math.floor(reste / 100);
        const centiares = reste % 100;
        
        const parts = [];
        if (hectares > 0) parts.push(`${hectares}Ha`);
        if (ares > 0) parts.push(`${ares}A`);
        parts.push(`${centiares}Ca`);
        
        return parts.join(' ');
    };

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

    const badgeColorClasses = {
        violet: 'bg-violet-600',
        emerald: 'bg-emerald-600',
        blue: 'bg-blue-600',
    };

    const borderColorClasses = {
        violet: 'border-violet-200 dark:border-violet-800',
        emerald: 'border-emerald-200 dark:border-emerald-800',
        blue: 'border-blue-200 dark:border-blue-800',
    };

    return (
        <Card className={`border-2 ${colorClasses[colorScheme]}`}>
            <CardContent className="p-4 space-y-4">
                {/* Infos propriété */}
                <div className="flex items-start gap-3">
                    <MapPin className={`h-5 w-5 ${iconColorClasses[colorScheme]} flex-shrink-0 mt-1`} />
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${badgeColorClasses[colorScheme]} text-white`}>
                                Lot {propriete.lot}
                            </Badge>
                            <Badge variant="outline">
                                TN°{propriete.titre}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Ruler className="h-3 w-3" />
                                    Contenance:
                                </span>
                                <div className="font-semibold">
                                    {formatContenance(propriete.contenance)}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Nature:</span>
                                <div className="font-semibold capitalize">
                                    {propriete.nature}
                                </div>
                            </div>
                        </div>

                        <div className="text-sm">
                            <span className="text-muted-foreground">Propriétaire:</span>
                            <div className="font-medium">{propriete.proprietaire}</div>
                        </div>
                    </div>
                </div>

                {/* Demandeurs */}
                {showDemandeurs && principal && (
                    <div className={`pt-3 border-t ${borderColorClasses[colorScheme]}`}>
                        <div className="flex items-start gap-3">
                            <Users className={`h-5 w-5 ${iconColorClasses[colorScheme]} flex-shrink-0 mt-1`} />
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-yellow-500 text-white">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Principal
                                    </Badge>
                                    <span className="font-semibold">
                                        {principal.nom} {principal.prenom}
                                    </span>
                                </div>
                                
                                {consorts.length > 0 && (
                                    <div className="text-sm space-y-1 ml-4">
                                        <div className="font-medium text-muted-foreground">
                                            Consorts ({consorts.length}) :
                                        </div>
                                        <ul className="space-y-1">
                                            {consorts.map((c, idx) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {c.ordre}
                                                    </Badge>
                                                    <span>{c.nom} {c.prenom}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="text-xs text-muted-foreground">
                                    {consorts.length > 0 
                                        ? `Document avec ${consorts.length + 1} demandeurs`
                                        : 'Document avec un seul demandeur'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prix */}
                {showPrice && propriete.demandeurs_lies && propriete.demandeurs_lies.length > 0 && (
                    <div className={`pt-3 border-t ${borderColorClasses[colorScheme]}`}>
                        <div className="flex items-center gap-2 text-sm">
                            <Coins className={`h-4 w-4 ${iconColorClasses[colorScheme]}`} />
                            <span className="text-muted-foreground">Prix total:</span>
                            <span className="font-semibold">
                                {new Intl.NumberFormat('fr-FR').format(
                                    propriete.demandeurs_lies[0]?.total_prix || 0
                                )} Ar
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}