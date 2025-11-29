import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, Ellipsis, Link2, Archive, Users } from 'lucide-react';
import type { Demandeur, Dossier, Propriete } from '@/types';
import DemandeurDetailDialog from '@/pages/demandeurs/components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';

interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
}

interface DemandeursIndexProps {
    demandeurs: DemandeurWithProperty[];
    dossier: Dossier;
    proprietes: Propriete[];
    onDeleteDemandeur: (id: number) => void;
    onSelectDemandeur?: (demandeur: DemandeurWithProperty) => void;
    onLinkPropriete?: (demandeur: Demandeur) => void;
    isDemandeurIncomplete: (dem: Demandeur) => boolean;
    onDissociate: (
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => void;
}

export default function DemandeursIndex({
    demandeurs,
    dossier,
    proprietes,
    onDeleteDemandeur,
    isDemandeurIncomplete,
    onLinkPropriete,
    onDissociate
}: DemandeursIndexProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [selectedDemandeur, setSelectedDemandeur] = useState<DemandeurWithProperty | null>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);
    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);

    const getAcquiredLotsForDemandeur = (demandeurId: number): string[] => {
        const lots: string[] = [];
        proprietes.forEach(prop => {
            if (prop.is_archived === true) {
                const isLinked = prop.demandeurs?.some((d: any) => d.id === demandeurId);
                if (isLinked) {
                    lots.push(prop.lot);
                }
            }
        });
        return lots;
    };

    // ✅ Handler pour ouvrir le dialogue de demandeur
    const handleSelectDemandeur = (demandeur: DemandeurWithProperty) => {
        // ✅ Fermer l'autre dialogue d'abord
        setShowProprieteDetail(false);
        
        // ✅ Ouvrir après un court délai
        setTimeout(() => {
            setSelectedDemandeur(demandeur);
            setShowDemandeurDetail(true);
        }, 100);
    };

    // ✅ Handler pour ouvrir le dialogue de propriété
    const handleSelectProprieteFromDemandeur = (propriete: Propriete) => {
        // ✅ Fermer le dialogue de demandeur d'abord
        setShowDemandeurDetail(false);
        
        // ✅ Ouvrir le dialogue de propriété après un délai
        setTimeout(() => {
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    // ✅ Handler pour revenir au dialogue de demandeur
    const handleSelectDemandeurFromPropriete = (demandeur: Demandeur) => {
        // ✅ Fermer le dialogue de propriété d'abord
        setShowProprieteDetail(false);
        
        const demandeurWithProperty = demandeurs.find(d => d.id === demandeur.id);
        if (demandeurWithProperty) {
            // ✅ Ouvrir le dialogue de demandeur après un délai
            setTimeout(() => {
                setSelectedDemandeur(demandeurWithProperty);
                setShowDemandeurDetail(true);
            }, 100);
        }
    };

    // ✅ Fermeture propre du dialogue de demandeur
    const handleCloseDemandeurDialog = (open: boolean) => {
        setShowDemandeurDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedDemandeur(null);
            }, 300);
        }
    };

    // ✅ Fermeture propre du dialogue de propriété
    const handleCloseProprieteDialog = (open: boolean) => {
        setShowProprieteDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedPropriete(null);
            }, 300);
        }
    };

    const paginateDemandeurs = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return demandeurs.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil(demandeurs.length / itemsPerPage);

    const Pagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-center items-center gap-2 mt-6 pb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Précédent
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                    >
                        {page}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Suivant
                </Button>
            </div>
        );
    };

    return (
        <>
            <Card className="border-0 shadow-lg">
                <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Demandeurs</h2>
                                <p className="text-sm text-muted-foreground">
                                    {demandeurs.length} demandeur{demandeurs.length > 1 ? 's' : ''} enregistré{demandeurs.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        
                        <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-200 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-800"></div>
                                <span>Données incomplètes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-200 dark:bg-amber-900/50 rounded border border-amber-300 dark:border-amber-800"></div>
                                <span>Sans propriété</span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/30 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom complet</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">CIN</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domiciliation</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Situation</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {demandeurs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="font-medium text-muted-foreground">Aucun demandeur enregistré</p>
                                            <p className="text-sm text-muted-foreground/70 mt-1">Commencez par ajouter un demandeur au dossier</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginateDemandeurs().map((demandeur) => {
                                        const isIncomplete = isDemandeurIncomplete(demandeur);
                                        const acquiredLots = getAcquiredLotsForDemandeur(demandeur.id);
                                        const hasAcquiredProperty = acquiredLots.length > 0;
                                        
                                        const rowClass = isIncomplete 
                                            ? 'hover:bg-red-50/50 dark:hover:bg-red-950/20 bg-red-50/30 dark:bg-red-950/10 cursor-pointer transition-colors' 
                                            : demandeur.hasProperty
                                                ? 'hover:bg-muted/30 cursor-pointer transition-colors'
                                                : 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20 bg-amber-50/30 dark:bg-amber-950/10 cursor-pointer transition-colors';
                                        
                                        return (
                                            <tr 
                                                key={demandeur.id} 
                                                className={rowClass} 
                                                onClick={() => handleSelectDemandeur(demandeur)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                                        </span>
                                                        {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                                                        {hasAcquiredProperty && (
                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
                                                                <Archive className="mr-1 h-3 w-3" />
                                                                Lot(s): {acquiredLots.join(', ')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                                                    {demandeur.cin}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {demandeur.domiciliation || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {demandeur.situation_familiale || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {demandeur.telephone || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={demandeur.hasProperty ? "default" : "secondary"} className="text-xs">
                                                        {demandeur.hasProperty ? "Avec propriété" : "Sans propriété"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Ellipsis className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleSelectDemandeur(demandeur)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Voir détails
                                                            </DropdownMenuItem>
                                                            {!dossier.is_closed && (
                                                                <>
                                                                    <DropdownMenuItem asChild>
                                                                        <Link
                                                                            href={route('demandeurs.edit', {
                                                                                id_dossier: dossier.id,
                                                                                id_demandeur: demandeur.id
                                                                            })}
                                                                            className="flex items-center"
                                                                        >
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Modifier
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    {proprietes.length > 0 && (
                                                                        <DropdownMenuItem onClick={() => onLinkPropriete?.(demandeur)}>
                                                                            <Link2 className="mr-2 h-4 w-4" />
                                                                            Lier à une propriété
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-500" onClick={() => onDeleteDemandeur(demandeur.id)}>
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination />
                </CardContent>
            </Card>

            {/* ✅ Dialogues avec gestion stricte de fermeture */}
            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={handleCloseDemandeurDialog}
                proprietes={proprietes}
                onSelectPropriete={handleSelectProprieteFromDemandeur}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
                onDissociate={onDissociate}
            />

            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={handleCloseProprieteDialog}
                onSelectDemandeur={handleSelectDemandeurFromPropriete}
                dossierClosed={dossier.is_closed}
                onDissociate={onDissociate}
            />
        </>
    );
}