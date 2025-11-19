// pages/demandeurs/index.tsx
// Composant de liste des demandeurs AVEC MODALS DE DÉTAILS
// Utilisé par : dossiers/Show.tsx

import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, Ellipsis, UserPlus, Link2, Archive } from 'lucide-react';
import type { Demandeur, Dossier, Propriete } from '@/types';
import DemandeurDetailDialog from '@/components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/components/ProprieteDetailDialog';


interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
}

interface DemandeursIndexProps {
    demandeurs: DemandeurWithProperty[];
    dossier: Dossier;
    proprietes: Propriete[];
    onDeleteDemandeur: (id: number) => void;
    onSelectDemandeur?: (demandeur: DemandeurWithProperty) => void;
    isDemandeurIncomplete: (dem: Demandeur) => boolean;
}

export default function DemandeursIndex({
    demandeurs,
    dossier,
    proprietes,
    onDeleteDemandeur,
    onSelectDemandeur,
    isDemandeurIncomplete
}: DemandeursIndexProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ✅ États pour les modals de détails
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

    // ✅ Handler pour ouvrir le détail demandeur
    const handleSelectDemandeur = (demandeur: DemandeurWithProperty) => {
        setSelectedDemandeur(demandeur);
        setShowDemandeurDetail(true);
    };

    // ✅ Handler pour ouvrir le détail propriété depuis le modal demandeur
    const handleSelectProprieteFromDemandeur = (propriete: Propriete) => {
        setSelectedPropriete(propriete);
        setShowProprieteDetail(true);
    };

    // ✅ Handler pour ouvrir le détail demandeur depuis le modal propriété
    const handleSelectDemandeurFromPropriete = (demandeur: Demandeur) => {
        const demandeurWithProperty = demandeurs.find(d => d.id === demandeur.id);
        if (demandeurWithProperty) {
            setSelectedDemandeur(demandeurWithProperty);
            setShowDemandeurDetail(true);
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
            <div className="flex justify-center items-center gap-2 mt-4">
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
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Demandeurs</CardTitle>
                            <CardDescription>
                                Liste des demandeurs du dossier ({demandeurs.length})
                                <span className="ml-2 text-xs block mt-2">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
                                        <span>Données incomplètes</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 ml-3">
                                        <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded"></span>
                                        <span>Sans propriété</span>
                                    </span>
                                </span>
                            </CardDescription>
                        </div>
                        {proprietes.length > 0 && !dossier.is_closed && (
                            <Button asChild size="sm">
                                <Link href={route('ajouter-demandeur.create', dossier.id)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Ajouter un demandeur à un lot
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Nom complet</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">CIN</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Domiciliation</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Situation</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Téléphone</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                                    <th className="px-4 py-3 w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {demandeurs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted-foreground py-8">
                                            Aucun demandeur enregistré
                                        </td>
                                    </tr>
                                ) : (
                                    paginateDemandeurs().map((demandeur) => {
                                        const isIncomplete = isDemandeurIncomplete(demandeur);
                                        const acquiredLots = getAcquiredLotsForDemandeur(demandeur.id);
                                        const hasAcquiredProperty = acquiredLots.length > 0;
                                        
                                        const rowClass = isIncomplete 
                                            ? 'border-b hover:bg-red-50 dark:hover:bg-red-950/30 bg-red-50/50 dark:bg-red-950/20 cursor-pointer' 
                                            : demandeur.hasProperty
                                                ? 'border-b hover:bg-muted/50 cursor-pointer'
                                                : 'border-b hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer';
                                        
                                        return (
                                            <tr 
                                                key={demandeur.id} 
                                                className={rowClass} 
                                                onClick={() => handleSelectDemandeur(demandeur)}
                                            >
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                                        {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                        {hasAcquiredProperty && (
                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                                                <Archive className="mr-1 h-3 w-3" />
                                                                Lot(s) acquis: {acquiredLots.join(', ')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{demandeur.cin}</td>
                                                <td className="px-4 py-3 text-sm">{demandeur.domiciliation || '-'}</td>
                                                <td className="px-4 py-3 text-sm">{demandeur.situation_familiale || '-'}</td>
                                                <td className="px-4 py-3 text-sm">{demandeur.telephone || '-'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Badge variant={demandeur.hasProperty ? "default" : "secondary"} className="text-xs">
                                                        {demandeur.hasProperty ? "Avec propriété" : "Sans propriété"}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={route('lier-demandeur.create', {
                                                                            id: dossier.id,
                                                                            id_demandeur: demandeur.id
                                                                        })}
                                                                        className="flex items-center"
                                                                    >
                                                                        <Link2 className="mr-2 h-4 w-4" />
                                                                        Lier à une propriété
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-500"
                                                                onClick={() => onDeleteDemandeur(demandeur.id)}
                                                            >
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

            {/* ✅ Modals de détails avec navigation entre eux */}
            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={setShowDemandeurDetail}
                proprietes={proprietes}
                onSelectPropriete={handleSelectProprieteFromDemandeur}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
            />

            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={setShowProprieteDetail}
                onSelectDemandeur={handleSelectDemandeurFromPropriete}
                dossierClosed={dossier.is_closed}
            />
        </>
    );
}