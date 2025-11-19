// pages/proprietes/index.tsx
// Composant de liste des propriétés AVEC MODALS DE DÉTAILS
// Utilisé par : dossiers/Show.tsx

import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, Ellipsis, Link2, UserPlus, Archive, ArchiveRestore, AlertTriangle } from 'lucide-react';
import type { Propriete, Dossier, Demandeur } from '@/types';
import ProprieteDetailDialog from '@/components/ProprieteDetailDialog';
import DemandeurDetailDialog from '@/components/DemandeurDetailDialog';

interface ProprietesIndexProps {
    proprietes: Propriete[];
    dossier: Dossier;
    demandeurs: Demandeur[];
    onDeletePropriete: (id: number) => void;
    onSelectPropriete?: (propriete: Propriete) => void;
    onArchivePropriete: (id: number) => void;
    onUnarchivePropriete: (id: number) => void;
    isPropertyIncomplete: (prop: Propriete) => boolean;
}

export default function ProprietesIndex({
    proprietes,
    dossier,
    demandeurs,
    onDeletePropriete,
    onSelectPropriete,
    onArchivePropriete,
    onUnarchivePropriete,
    isPropertyIncomplete
}: ProprietesIndexProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ✅ États pour les modals de détails
    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);
    const [selectedDemandeur, setSelectedDemandeur] = useState<Demandeur | null>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);

    const hasLinkedDemandeurs = (prop: Propriete): boolean => {
        return prop.demandeurs !== undefined && prop.demandeurs.length > 0;
    };

    const isPropertyArchived = (prop: Propriete): boolean => {
        return prop.is_archived === true;
    };

    // ✅ Handler pour ouvrir le détail propriété
    const handleSelectPropriete = (propriete: Propriete) => {
        setSelectedPropriete(propriete);
        setShowProprieteDetail(true);
    };

    // ✅ Handler pour ouvrir le détail demandeur depuis le modal propriété
    const handleSelectDemandeurFromPropriete = (demandeur: Demandeur) => {
        setSelectedDemandeur(demandeur);
        setShowDemandeurDetail(true);
    };

    // ✅ Handler pour ouvrir le détail propriété depuis le modal demandeur
    const handleSelectProprieteFromDemandeur = (propriete: Propriete) => {
        setSelectedPropriete(propriete);
        setShowProprieteDetail(true);
    };

    const paginateProprietes = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return proprietes.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil(proprietes.length / itemsPerPage);

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
                            <CardTitle>Propriétés</CardTitle>
                            <CardDescription>
                                Liste des propriétés du dossier ({proprietes.length})
                                {dossier.is_closed && (
                                    <span className="block mt-1 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Aucune modification possible (dossier fermé)
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                        
                        {demandeurs.length > 0 && !dossier.is_closed && (
                            <Button asChild size="sm">
                                <Link href={route('lier-demandeur.create', dossier.id)}>
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Lier un demandeur à un lot
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
                                    <th className="px-4 py-3 text-left text-sm font-medium">Lot</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Titre</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Dep/Vol</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Contenance</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Nature</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                                    <th className="px-4 py-3 w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {proprietes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted-foreground py-8">
                                            Aucune propriété enregistrée
                                        </td>
                                    </tr>
                                ) : (
                                    paginateProprietes().map((propriete) => {
                                        const isIncomplete = isPropertyIncomplete(propriete);
                                        const hasDemandeurs = hasLinkedDemandeurs(propriete);
                                        const isArchived = isPropertyArchived(propriete);
                                        
                                        const rowClass = isArchived
                                            ? 'border-b hover:bg-gray-100 dark:hover:bg-gray-800 bg-gray-50/80 dark:bg-gray-900/50 cursor-pointer'
                                            : isIncomplete 
                                                ? 'border-b hover:bg-red-50 dark:hover:bg-red-950/30 bg-red-50/50 dark:bg-red-950/20 cursor-pointer'
                                                : hasDemandeurs
                                                    ? 'border-b hover:bg-muted/50 cursor-pointer'
                                                    : 'border-b hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer';
                                        
                                        return (
                                            <tr 
                                                key={propriete.id} 
                                                className={rowClass} 
                                                onClick={() => handleSelectPropriete(propriete)}
                                            >
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {propriete.lot}
                                                        {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                        {isArchived && <Archive className="h-4 w-4 text-gray-500" />}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{propriete.titre ? `TNº${propriete.titre}` : '-'}</td>
                                                <td className="px-4 py-3 text-sm font-mono">
                                                    {propriete.dep_vol_complet || propriete.dep_vol || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{propriete.contenance ? `${propriete.contenance} m²` : '-'}</td>
                                                <td className="px-4 py-3 text-sm capitalize">{propriete.nature || '-'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={hasDemandeurs ? "default" : "secondary"} className="text-xs">
                                                            {hasDemandeurs ? "Avec demandeur" : "Sans demandeur"}
                                                        </Badge>
                                                        {isArchived && (
                                                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                                                Acquise
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Ellipsis className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleSelectPropriete(propriete)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Voir détails
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={route('proprietes.edit', propriete.id)}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Modifier
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={route('ajouter-demandeur.create', {
                                                                        id: dossier.id,
                                                                        id_propriete: propriete.id
                                                                    })}
                                                                    className="flex items-center"
                                                                >
                                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                                    Ajouter un demandeur
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {isArchived ? (
                                                                <DropdownMenuItem
                                                                    className="text-blue-600"
                                                                    onClick={() => onUnarchivePropriete(propriete.id)}
                                                                >
                                                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                                                    Désarchiver
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    className="text-green-600"
                                                                    onClick={() => onArchivePropriete(propriete.id)}
                                                                >
                                                                    <Archive className="mr-2 h-4 w-4" />
                                                                    Archiver (acquise)
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-red-500"
                                                                onClick={() => onDeletePropriete(propriete.id)}
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
            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={setShowProprieteDetail}
                onSelectDemandeur={handleSelectDemandeurFromPropriete}
                dossierClosed={dossier.is_closed}
            />

            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={setShowDemandeurDetail}
                proprietes={proprietes}
                onSelectPropriete={handleSelectProprieteFromDemandeur}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
            />
        </>
    );
}