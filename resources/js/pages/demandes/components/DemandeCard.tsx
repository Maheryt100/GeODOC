// pages/demandes/components/DemandeCard.tsx - VERSION OPTIMISÉE
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronDown, ChevronUp, MoreVertical,
    Lock, LockOpen, Eye, Archive, ArchiveRestore,
    Home, Users, DollarSign, AlertCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DemandeExpandedContent from './DemandeExpandedContent';

interface DemandeCardProps {
    doc: {
        id: number;
        id_propriete: number;
        propriete: any;
        demandeurs: any[];
        total_prix: number;
        status: string;
        status_consort: boolean;
        nombre_demandeurs: number;
    };
    isExpanded: boolean;
    onToggleExpand: (id: number) => void;
    onArchive: (doc: any) => void;
    onUnarchive: (doc: any) => void;
    onSelectDemande: (doc: any) => void;
}

export default function DemandeCard({
    doc,
    isExpanded,
    onToggleExpand,
    onArchive,
    onUnarchive,
    onSelectDemande
}: DemandeCardProps) {
    const isArchived = doc.status === 'archive';

    const formatNomComplet = (demandeur: any): string => {
        if (!demandeur) return 'N/A';
        
        const titre = demandeur.titre_demandeur || '';
        const nom = demandeur.nom_demandeur || '';
        const prenom = demandeur.prenom_demandeur || '';
        
        return `${titre} ${nom} ${prenom}`.trim();
    };

    const isDemandeurIncomplete = (dem: any): boolean => {
        return !dem?.date_naissance || !dem?.lieu_naissance || !dem?.date_delivrance || 
               !dem?.lieu_delivrance || !dem?.domiciliation || !dem?.occupation || !dem?.nom_mere;
    };

    const isProprieteIncomplete = (prop: any): boolean => {
        return !prop?.titre || !prop?.contenance || !prop?.proprietaire || 
               !prop?.nature || !prop?.vocation || !prop?.situation;
    };

    // ✅ AMÉLIORATION : Vérifier si les demandeurs existent vraiment
    const hasValidDemandeurs = doc.demandeurs && Array.isArray(doc.demandeurs) && doc.demandeurs.length > 0;
    
    const hasIncompleteData = hasValidDemandeurs
        ? doc.demandeurs.some((d: any) => isDemandeurIncomplete(d.demandeur)) || isProprieteIncomplete(doc.propriete)
        : isProprieteIncomplete(doc.propriete);

    const getCardClassName = (): string => {
        if (isArchived) {
            return 'bg-gray-50 dark:bg-gray-900/50';
        }
        if (hasIncompleteData) {
            return 'bg-red-50 dark:bg-red-950/20';
        }
        return 'hover:shadow-md transition-shadow';
    };

    // ✅ AMÉLIORATION : Afficher le premier demandeur OU un message
    const premierDemandeur = hasValidDemandeurs && doc.demandeurs[0]?.demandeur
        ? doc.demandeurs[0].demandeur
        : null;

    return (
        <Card className={`${getCardClassName()}`}>
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    {/* Bouton expand/collapse */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleExpand(doc.id)}
                        className="h-9 w-9 shrink-0 hover:bg-primary/10"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                        ) : (
                            <ChevronDown className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Contenu principal */}
                    <div 
                        className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer"
                        onClick={() => onSelectDemande(doc)}
                    >
                        {/* Propriété - 3 colonnes */}
                        <div className="md:col-span-3 space-y-1">
                            <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-green-600" />
                                <p className="text-xs text-muted-foreground font-medium">Propriété</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-lg">Lot {doc.propriete?.lot || 'N/A'}</p>
                                {isProprieteIncomplete(doc.propriete) && (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {doc.propriete?.titre ? `TNº${doc.propriete.titre}` : 'Sans titre'}
                            </p>
                        </div>

                        {/* Demandeurs - 4 colonnes */}
                        <div className="md:col-span-4 space-y-1">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <p className="text-xs text-muted-foreground font-medium">
                                    Demandeur{doc.nombre_demandeurs > 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {premierDemandeur ? (
                                    <>
                                        <p className="font-medium">
                                            {formatNomComplet(premierDemandeur)}
                                        </p>
                                        {hasIncompleteData && (
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        )}
                                    </>
                                ) : (
                                    <p className="font-medium text-muted-foreground italic">
                                        Aucun demandeur
                                    </p>
                                )}
                            </div>
                            {doc.nombre_demandeurs > 1 && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                    +{doc.nombre_demandeurs - 1} autre{doc.nombre_demandeurs > 2 ? 's' : ''}
                                </Badge>
                            )}
                        </div>

                        {/* Prix - 3 colonnes */}
                        <div className="md:col-span-3 space-y-1">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                <p className="text-xs text-muted-foreground font-medium">Prix total</p>
                            </div>
                            <p className="font-bold text-primary text-lg">
                                {doc.total_prix 
                                    ? new Intl.NumberFormat('fr-FR').format(doc.total_prix) 
                                    : '0'
                                } Ar
                            </p>
                        </div>

                        {/* Statut - 2 colonnes */}
                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                            {isArchived ? (
                                <Badge variant="outline" className="bg-gray-200 text-gray-700">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Archivée
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-700">
                                    <LockOpen className="h-3 w-3 mr-1" />
                                    Active
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Menu Actions */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => onSelectDemande(doc)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isArchived ? (
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUnarchive(doc);
                                    }}
                                    className="text-blue-600"
                                >
                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                    Désarchiver
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onArchive(doc);
                                    }}
                                    className="text-orange-600"
                                >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archiver
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Section expandée */}
                {isExpanded && (
                    <DemandeExpandedContent
                        doc={doc}
                        formatNomComplet={formatNomComplet}
                        isDemandeurIncomplete={isDemandeurIncomplete}
                    />
                )}
            </CardContent>
        </Card>
    );
}