// ✅ CORRECTION MAJEURE : Gestion correcte des propriétés archivées

import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, Ellipsis, Link2, Archive, ArchiveRestore, LandPlot } from 'lucide-react';
import type { Propriete, Dossier, Demandeur } from '@/types';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';
import DemandeurDetailDialog from '@/pages/demandeurs/components/DemandeurDetailDialog';

export default function ProprietesIndex({
    proprietes,
    dossier,
    demandeurs,
    onDeletePropriete,
    onArchivePropriete,
    onUnarchivePropriete,
    isPropertyIncomplete,
    onLinkDemandeur,
    onDissociate
}: any) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);
    const [selectedDemandeur, setSelectedDemandeur] = useState<Demandeur | null>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);

    /**
     * ✅ CORRECTION FINALE : Vérifier les demandeurs ACTIFS uniquement
     * LOGIQUE : Une propriété a des demandeurs SI au moins UNE demande est ACTIVE
     */
    const hasLinkedDemandeurs = (prop: Propriete): boolean => {
        if (prop.demandes && Array.isArray(prop.demandes) && prop.demandes.length > 0) {
            // ✅ Vérifier qu'il y a au moins UNE demande ACTIVE
            return prop.demandes.some(d => d.status === 'active');
        }
        
        // Fallback : ancien système (pour compatibilité)
        return prop.demandeurs !== undefined && prop.demandeurs.length > 0;
    };

    /**
     * ✅ CORRECTION FINALE : Détecter si acquise (toutes demandes archivées)
     * LOGIQUE : 
     * - Propriété ACQUISE = AU MOINS 1 demande archivée ET AUCUNE demande active
     * - Propriété VIDE = Aucune demande du tout
     * - Propriété ACTIVE = Au moins 1 demande active
     */
    const isPropertyArchived = (prop: Propriete): boolean => {
        // 1. Vérifier d'abord is_archived calculé côté serveur
        if (prop.is_archived === true) {
            return true;
        }
        
        // 2. Vérifier via les demandes locales
        if (prop.demandes && Array.isArray(prop.demandes) && prop.demandes.length > 0) {
            const hasActiveDemandes = prop.demandes.some(d => d.status === 'active');
            const hasArchivedDemandes = prop.demandes.some(d => d.status === 'archive');
            
            // ✅ LOGIQUE CORRECTE : Acquise = AUCUNE active ET au moins UNE archivée
            return !hasActiveDemandes && hasArchivedDemandes;
        }
        
        // 3. Aucune demande = pas archivée (juste vide)
        return false;
    };

    /**
     * ✅ NOUVEAU : Vérifier si propriété est complètement vide (jamais liée)
     */
    const isPropertyEmpty = (prop: Propriete): boolean => {
        return !prop.demandes || prop.demandes.length === 0;
    };

    // Handlers
    const handleSelectPropriete = (propriete: Propriete) => {
        setShowDemandeurDetail(false);
        setTimeout(() => {
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleSelectDemandeurFromPropriete = (demandeur: Demandeur) => {
        setShowProprieteDetail(false);
        const demandeurComplet = demandeurs.find((d: { id: number; }) => d.id === demandeur.id) || demandeur;
        setTimeout(() => {
            setSelectedDemandeur(demandeurComplet);
            setShowDemandeurDetail(true);
        }, 100);
    };

    const handleSelectProprieteFromDemandeur = (propriete: Propriete) => {
        setShowDemandeurDetail(false);
        setTimeout(() => {
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleCloseProprieteDialog = (open: boolean) => {
        setShowProprieteDetail(open);
        if (!open) {
            setTimeout(() => setSelectedPropriete(null), 300);
        }
    };

    const handleCloseDemandeurDialog = (open: boolean) => {
        setShowDemandeurDetail(open);
        if (!open) {
            setTimeout(() => setSelectedDemandeur(null), 300);
        }
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
                <div className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <LandPlot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Propriétés</h2>
                                <p className="text-sm text-muted-foreground">
                                    {proprietes.length} propriété{proprietes.length > 1 ? 's' : ''} enregistrée{proprietes.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        
                        {/* ✅ LÉGENDE AMÉLIORÉE */}
                        <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-200 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-800"></div>
                                <span>Données incomplètes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-200 dark:bg-amber-900/50 rounded border border-amber-300 dark:border-amber-800"></div>
                                <span>Sans demandeur</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-200 dark:bg-green-900/50 rounded border border-green-300 dark:border-green-800"></div>
                                <span>Acquise</span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/30 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lot</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titre</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dep/Vol</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contenance</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nature</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {proprietes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <LandPlot className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="font-medium text-muted-foreground">Aucune propriété enregistrée</p>
                                            <p className="text-sm text-muted-foreground/70 mt-1">Commencez par ajouter une propriété au dossier</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginateProprietes().map((propriete: Propriete) => {
                                        const isIncomplete = isPropertyIncomplete(propriete);
                                        const hasDemandeurs = hasLinkedDemandeurs(propriete);
                                        const isArchived = isPropertyArchived(propriete);
                                        
                                        // ✅ CORRECTION : Classes CSS selon statut
                                        const rowClass = isArchived
                                            ? 'hover:bg-green-50/50 dark:hover:bg-green-900/20 bg-green-50/30 dark:bg-green-900/10 cursor-pointer transition-colors'
                                            : isIncomplete 
                                                ? 'hover:bg-red-50/50 dark:hover:bg-red-950/20 bg-red-50/30 dark:bg-red-950/10 cursor-pointer transition-colors'
                                                : hasDemandeurs
                                                    ? 'hover:bg-muted/30 cursor-pointer transition-colors'
                                                    : 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20 bg-amber-50/30 dark:bg-amber-950/10 cursor-pointer transition-colors';
                                        
                                        return (
                                            <tr 
                                                key={propriete.id} 
                                                className={rowClass} 
                                                onClick={() => handleSelectPropriete(propriete)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{propriete.lot}</span>
                                                        {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                                                        {isArchived && <Archive className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {propriete.titre ? `TNº${propriete.titre}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                                                    {propriete.dep_vol_complet || propriete.dep_vol || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {propriete.contenance ? `${propriete.contenance} m²` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground capitalize">
                                                    {propriete.nature || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {/* ✅ CORRECTION CRITIQUE : Badge selon statut */}
                                                        {isArchived ? (
                                                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-400">
                                                                <Archive className="mr-1 h-3 w-3" />
                                                                Acquise
                                                            </Badge>
                                                        ) : hasDemandeurs ? (
                                                            <Badge variant="default" className="text-xs">
                                                                Avec demandeur
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Sans demandeur
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                                                            {!dossier.is_closed && (
                                                                <>
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={route('proprietes.edit', propriete.id)} className="flex items-center">
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Modifier
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    {!isArchived && (
                                                                        <DropdownMenuItem onClick={() => onLinkDemandeur?.(propriete)}>
                                                                            <Link2 className="mr-2 h-4 w-4" />
                                                                            Lier un demandeur
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator />
                                                                    {isArchived ? (
                                                                        <DropdownMenuItem className="text-blue-600" onClick={() => onUnarchivePropriete(propriete.id)}>
                                                                            <ArchiveRestore className="mr-2 h-4 w-4" />
                                                                            Désarchiver
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem className="text-green-600" onClick={() => onArchivePropriete(propriete.id)}>
                                                                            <Archive className="mr-2 h-4 w-4" />
                                                                            Archiver (acquise)
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem className="text-red-500" onClick={() => onDeletePropriete(propriete.id)}>
                                                                        <Trash className="mr-2 h-4 w-4" />
                                                                        Supprimer
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
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

            {/* Dialogues */}
            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={handleCloseProprieteDialog}
                onSelectDemandeur={handleSelectDemandeurFromPropriete}
                dossierClosed={dossier.is_closed}
                onDissociate={onDissociate}
                demandeursDossier={demandeurs}
            />

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
        </>
    );
}