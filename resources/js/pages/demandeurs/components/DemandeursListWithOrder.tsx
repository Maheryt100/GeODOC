// demandeurs/components/DemandeursListWithOrder.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, User, Unlink, Archive } from 'lucide-react';
import type { Demandeur } from '@/types';

interface DemandeurWithOrder {
    demandeur: Demandeur;
    ordre: number;
    status: 'active' | 'archive';
    total_prix: number;
}

interface DemandeursListWithOrderProps {
    demandeurs: DemandeurWithOrder[];
    onSelectDemandeur?: (demandeur: Demandeur) => void;
    onDissociate?: (demandeur: Demandeur) => void;
    canDissociate?: boolean;
    showPrices?: boolean;
}

export default function DemandeursListWithOrder({
    demandeurs,
    onSelectDemandeur,
    onDissociate,
    canDissociate = true,
    showPrices = false
}: DemandeursListWithOrderProps) {
    
    // Séparer actifs et archivés
    const demandeursActifs = demandeurs.filter(d => d.status === 'active');
    const demandeursArchives = demandeurs.filter(d => d.status === 'archive');

    const formatNomComplet = (demandeur: Demandeur): string => {
        return [
            demandeur.titre_demandeur,
            demandeur.nom_demandeur,
            demandeur.prenom_demandeur
        ].filter(Boolean).join(' ');
    };

    const formatPrix = (prix: number): string => {
        return new Intl.NumberFormat('fr-FR').format(prix) + ' Ar';
    };

    const renderDemandeur = (item: DemandeurWithOrder, isArchived: boolean = false) => {
        const isPrincipal = item.ordre === 1;
        
        return (
            <div
                key={`${item.demandeur.id}-${item.ordre}`}
                className={`p-4 border rounded-lg transition ${
                    isArchived 
                        ? 'bg-green-50/50 dark:bg-green-900/10' 
                        : 'hover:bg-muted/50'
                }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <button
                        onClick={() => onSelectDemandeur?.(item.demandeur)}
                        className="flex-1 text-left hover:text-primary transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {/* ✅ Badge ordre avec icône */}
                            {isPrincipal ? (
                                <Badge variant="default" className="text-xs gap-1">
                                    <Crown className="h-3 w-3" />
                                    Principal
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-xs gap-1">
                                    <User className="h-3 w-3" />
                                    Consort #{item.ordre}
                                </Badge>
                            )}
                        </div>
                        
                        <p className="font-medium">
                            {formatNomComplet(item.demandeur)}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                            CIN: {item.demandeur.cin}
                        </p>
                        {item.demandeur.domiciliation && (
                            <p className="text-sm text-muted-foreground">
                                {item.demandeur.domiciliation}
                            </p>
                        )}
                        
                        {/* ✅ Afficher le prix si demandé */}
                        {showPrices && (
                            <p className="text-sm font-semibold text-primary mt-2">
                                Prix : {formatPrix(item.total_prix)}
                            </p>
                        )}
                    </button>
                    
                    <div className="flex items-center gap-2">
                        {/* Badge statut */}
                        {isArchived ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                <Archive className="mr-1 h-3 w-3" />
                                Acquis
                            </Badge>
                        ) : (
                            <Badge variant="default" className="text-xs">
                                Actif
                            </Badge>
                        )}
                        
                        {/* Bouton dissocier (seulement pour actifs) */}
                        {!isArchived && canDissociate && onDissociate && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDissociate(item.demandeur);
                                }}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                                <Unlink className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Demandeurs actifs */}
            {demandeursActifs.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Demandeurs actifs ({demandeursActifs.length})
                    </h4>
                    {demandeursActifs
                        .sort((a, b) => a.ordre - b.ordre) // ✅ Trier par ordre
                        .map(item => renderDemandeur(item, false))}
                </div>
            )}
            
            {/* Demandeurs archivés */}
            {demandeursArchives.length > 0 && (
                <div className="space-y-2">
                    {demandeursActifs.length > 0 && (
                        <div className="border-t pt-4" />
                    )}
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Ayant acquis ({demandeursArchives.length})
                    </h4>
                    {demandeursArchives
                        .sort((a, b) => a.ordre - b.ordre)
                        .map(item => renderDemandeur(item, true))}
                </div>
            )}
            
            {/* Aucun demandeur */}
            {demandeurs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun demandeur associé</p>
                </div>
            )}
        </div>
    );
}