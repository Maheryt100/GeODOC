import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    LandPlot, Pencil, Trash, Ellipsis, List, UserPlus, Link2, 
    AlertCircle, Eye, MapPin, Calendar, Building2, FileOutput, 
    Archive, ArchiveRestore, Unlink
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Dossier, Demandeur, Propriete, SharedData, BreadcrumbItem } from '@/types';

interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
}

interface PageProps {
    dossier: Dossier & {
        demandeurs: Demandeur[];
        proprietes: Propriete[];
    };
    [key: string]: unknown;
}

export default function Show() {
    const { dossier } = usePage<PageProps>().props;
    const { flash } = usePage<SharedData>().props;
    const [selectedDemandeur, setSelectedDemandeur] = useState<DemandeurWithProperty | null>(null);
    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteType, setDeleteType] = useState<'dossier' | 'definitif'>('dossier');
    const [itemToDelete, setItemToDelete] = useState<{ type: 'demandeur' | 'propriete', id: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [currentDemandeurPage, setCurrentDemandeurPage] = useState(1);
    const [currentProprietePage, setCurrentProprietePage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.message, flash?.success, flash?.error]);

    const handleDeleteDemandeur = (id: number) => {
        setItemToDelete({ type: 'demandeur', id });
        setDeleteType('dossier');
        setDeleteDialogOpen(true);
    };

    const confirmDeleteDemandeur = () => {
        if (!itemToDelete || itemToDelete.type !== 'demandeur' || isDeleting) return;

        setIsDeleting(true);

        if (deleteType === 'dossier') {
            router.delete(
                route('demandeurs.destroy', { 
                    dossier: dossier.id, 
                    demandeur: itemToDelete.id 
                }), 
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Demandeur retiré du dossier avec succès');
                        setDeleteDialogOpen(false);
                        setItemToDelete(null);
                        setIsDeleting(false);
                    },
                    onError: (errors) => {
                        console.error('Erreurs:', errors);
                        toast.error('Erreur lors de la suppression', { 
                            description: Object.values(errors).join('\n') 
                        });
                        setIsDeleting(false);
                    },
                    onFinish: () => {
                        setIsDeleting(false);
                    }
                }
            );
        } else {
            router.delete(
                route('demandeurs.destroy.definitive', itemToDelete.id), 
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Demandeur supprimé définitivement avec succès');
                        setDeleteDialogOpen(false);
                        setItemToDelete(null);
                        setIsDeleting(false);
                    },
                    onError: (errors) => {
                        console.error('Erreurs:', errors);
                        toast.error('Erreur lors de la suppression', { 
                            description: Object.values(errors).join('\n') 
                        });
                        setIsDeleting(false);
                    },
                    onFinish: () => {
                        setIsDeleting(false);
                    }
                }
            );
        }
    };

    const handleDeletePropriete = (id: number) => {
        if (confirm('Voulez-vous vraiment supprimer cette propriété ?')) {
            router.delete(route('proprietes.destroy', id), {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété supprimée avec succès'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const handleDissociate = (demandeurId: number, proprieteId: number, demandeurNom: string) => {
        if (confirm(`Êtes-vous sûr de vouloir dissocier ${demandeurNom} de cette propriété ?`)) {
            router.post(route('demandeur-propriete.dissociate'), {
                id_demandeur: demandeurId,
                id_propriete: proprieteId,
            }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Demandeur dissocié de la propriété'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const handleArchivePropriete = (id: number) => {
        if (confirm('Archiver cette propriété ? (La propriété sera marquée comme acquise)')) {
            router.post(route('proprietes.archive'), { id }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété archivée (acquise)'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const handleUnarchivePropriete = (id: number) => {
        if (confirm('Désarchiver cette propriété ?')) {
            router.post(route('proprietes.unarchive'), { id }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété désarchivée'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const getAllDemandeurs = (): DemandeurWithProperty[] => {
        const demandeursMap = new Map<number, DemandeurWithProperty>();
        
        if (dossier.demandeurs) {
            dossier.demandeurs.forEach((d: Demandeur) => {
                if (!demandeursMap.has(d.id)) {
                    demandeursMap.set(d.id, { ...d, hasProperty: false });
                }
            });
        }
        
        if (dossier.proprietes) {
            dossier.proprietes.forEach((prop: Propriete) => {
                if (prop.demandeurs) {
                    prop.demandeurs.forEach((d: Demandeur) => {
                        if (!demandeursMap.has(d.id)) {
                            demandeursMap.set(d.id, { ...d, hasProperty: true });
                        } else {
                            const existing = demandeursMap.get(d.id);
                            if (existing) {
                                demandeursMap.set(d.id, { ...existing, hasProperty: true });
                            }
                        }
                    });
                }
            });
        }
        
        return Array.from(demandeursMap.values());
    };


    // Récupérer les lots acquis pour un demandeur
    const getAcquiredLotsForDemandeur = (demandeurId: number): string[] => {
        const lots: string[] = [];
        
        proprietes.forEach(prop => {
            if (isPropertyArchived(prop)) {
                const isLinked = prop.demandeurs?.some((d: any) => d.id === demandeurId);
                if (isLinked) {
                    lots.push(prop.lot);
                }
            }
        });
        
        return lots;
    };

    const allDemandeurs = getAllDemandeurs();
    const proprietes = dossier.proprietes || [];

    // Vérifier si toutes les propriétés sont archivées
    const allProprietesArchived = proprietes.length > 0 && proprietes.every(p => 
        p.demandeurs && p.demandeurs.every((d: any) => d.status === 'archive')
    );

    const isPropertyIncomplete = (prop: Propriete): boolean => {
        return !prop.titre || !prop.contenance || !prop.proprietaire || !prop.nature || !prop.vocation || !prop.situation;
    };

    const isDemandeurIncomplete = (dem: Demandeur): boolean => {
        return !dem.date_naissance || !dem.lieu_naissance || !dem.date_delivrance || 
               !dem.lieu_delivrance || !dem.domiciliation || !dem.occupation || !dem.nom_mere;
    };

    const hasLinkedDemandeurs = (prop: Propriete): boolean => {
        return prop.demandeurs !== undefined && prop.demandeurs.length > 0;
    };

    const isPropertyArchived = (prop: Propriete): boolean => {
        // ✅ FIX: Une propriété n'est archivée QUE SI elle a des demandes archivées ET aucune demande active
        // Si pas de demandeurs du tout, elle n'est PAS archivée
        if (!prop.demandeurs || prop.demandeurs.length === 0) {
            return false; // ✅ Propriété sans demandeur = NON archivée
        }
        
        const hasActiveDemandes = prop.demandeurs.some((d: any) => d.status === 'active');
        const hasArchivedDemandes = prop.demandeurs.some((d: any) => d.status === 'archive');
        
        // Archivée = au moins une demande archivée ET aucune demande active
        return hasArchivedDemandes && !hasActiveDemandes;
    };
    const paginateDemandeurs = () => {
        const startIndex = (currentDemandeurPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return allDemandeurs.slice(startIndex, endIndex);
    };

    const paginateProprietes = () => {
        const startIndex = (currentProprietePage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return proprietes.slice(startIndex, endIndex);
    };

    const totalDemandeurPages = Math.ceil(allDemandeurs.length / itemsPerPage);
    const totalProprietePages = Math.ceil(proprietes.length / itemsPerPage);

    const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Précédent
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Suivant
                </Button>
            </div>
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dossier ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 p-6">
                {/* Section Informations du Dossier */}
                <Card className={`border-2 ${allProprietesArchived ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                        {dossier.nom_dossier}
                                    </CardTitle>
                                    {allProprietesArchived && (
                                        <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                                            <Archive className="mr-1 h-3 w-3" />
                                            Dossier terminé
                                        </Badge>
                                    )}
                                </div>
                                
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('dossiers.edit', dossier.id)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                <Button asChild variant="default" size="sm">
                                    <Link href={route('nouveau-lot.create', dossier.id)}>
                                        <LandPlot className="mr-2 h-4 w-4" />
                                        Nouveau Lot + Demandeur(s)
                                    </Link>
                                </Button>
                                
                                <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Link href={route('documents.generate', dossier.id)}>
                                        <FileOutput className="mr-2 h-4 w-4" />
                                        Générer documents
                                    </Link>
                                </Button>
                            
                                {/* <Button asChild variant="outline" size="sm">
                                    <Link href={route('dossiers.list', dossier.id)}>
                                        <List className="mr-2 h-4 w-4" />
                                        Liste
                                    </Link>
                                </Button> */}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Circonscription</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{dossier.circonscription}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Commune</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{dossier.type_commune} {dossier.commune}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fokontany</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{dossier.fokontany}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2 lg:col-span-3">
                                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Période de descente</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                        Du {new Date(dossier.date_descente_debut).toLocaleDateString('fr-FR')} au {new Date(dossier.date_descente_fin).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6 pt-4 border-t">
                            <Badge variant="secondary" className="text-sm">
                                {allDemandeurs.length} Demandeur{allDemandeurs.length > 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                                {proprietes.length} Propriété{proprietes.length > 1 ? 's' : ''}
                            </Badge>
                            {allProprietesArchived && (
                                <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-300">
                                    Toutes les propriétés sont acquises
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Section Demandeurs */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Demandeurs</CardTitle>
                                <CardDescription>
                                    Liste des demandeurs du dossier ({allDemandeurs.length})
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
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('demandeurs.create', dossier.id)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Nouveau
                                    </Link>
                                </Button>
                                {proprietes.length > 0 && (
                                    <Button asChild size="sm">
                                        <Link href={route('ajouter-demandeur.create', dossier.id)}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Ajouter un demandeur à un lot
                                        </Link>
                                    </Button>
                                )}
                            </div>
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
                                    {allDemandeurs.length === 0 ? (
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
                                                <tr key={demandeur.id} className={rowClass} onClick={() => setSelectedDemandeur(demandeur)}>
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                                            {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                            {/* ✅ Badge pour propriétés acquises */}
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
                                                                <DropdownMenuItem onClick={() => setSelectedDemandeur(demandeur)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir détails
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={route('demandeurs.edit', {
                                                                            dossier: dossier.id,
                                                                            demandeur: demandeur.id
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
                                                                    onClick={() => handleDeleteDemandeur(demandeur.id)}
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
                        <Pagination
                            currentPage={currentDemandeurPage}
                            totalPages={totalDemandeurPages}
                            onPageChange={setCurrentDemandeurPage}
                        />
                    </CardContent>
                </Card>

                {/* Section Propriétés */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Propriétés</CardTitle>
                                <CardDescription>
                                    Liste des propriétés du dossier ({proprietes.length})
                                    <span className="ml-2 text-xs">
                                        <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded mr-1"></span>
                                        Sans demandeur
                                        <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded ml-3 mr-1"></span>
                                        Informations incomplètes
                                        <span className="inline-block w-3 h-3 bg-gray-200 border border-gray-400 rounded ml-3 mr-1"></span>
                                        Archivée
                                    </span>
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('proprietes.create', dossier.id)}>
                                        <LandPlot className="mr-2 h-4 w-4" />
                                        Nouvelle
                                    </Link>
                                </Button>
                                {allDemandeurs.length > 0 && (
                                    <Button asChild size="sm">
                                        <Link href={route('lier-demandeur.create', dossier.id)}>
                                            <Link2 className="mr-2 h-4 w-4" />
                                            Lier un demandeur à un lot
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Lot</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Titre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Contenance</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Propriétaire</th>
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
                                                <tr key={propriete.id} className={rowClass} onClick={() => setSelectedPropriete(propriete)}>
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {propriete.lot}
                                                            {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                            {isArchived && <Archive className="h-4 w-4 text-gray-500" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{propriete.titre ? `TNº${propriete.titre}` : '-'}</td>
                                                    <td className="px-4 py-3 text-sm">{propriete.contenance ? `${propriete.contenance} m²` : '-'}</td>
                                                    <td className="px-4 py-3 text-sm">{propriete.proprietaire || '-'}</td>
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
                                                                <DropdownMenuItem onClick={() => setSelectedPropriete(propriete)}>
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
                                                                        onClick={() => handleUnarchivePropriete(propriete.id)}
                                                                    >
                                                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                                                        Désarchiver
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        className="text-green-600"
                                                                        onClick={() => handleArchivePropriete(propriete.id)}
                                                                    >
                                                                        <Archive className="mr-2 h-4 w-4" />
                                                                        Archiver (acquise)
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    className="text-red-500"
                                                                    onClick={() => handleDeletePropriete(propriete.id)}
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
                        <Pagination
                            currentPage={currentProprietePage}
                            totalPages={totalProprietePages}
                            onPageChange={setCurrentProprietePage}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Demandeur - AMÉLIORÉ */}
            <Dialog open={!!selectedDemandeur} onOpenChange={() => setSelectedDemandeur(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Détails du demandeur
                        </DialogTitle>
                    </DialogHeader>
                    {selectedDemandeur && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                    {selectedDemandeur.titre_demandeur} {selectedDemandeur.nom_demandeur} {selectedDemandeur.prenom_demandeur}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={selectedDemandeur.hasProperty ? "default" : "secondary"}>
                                        {selectedDemandeur.hasProperty ? "Associé à une propriété" : "Non associé"}
                                    </Badge>
                                    {isDemandeurIncomplete(selectedDemandeur) && (
                                        <Badge variant="destructive" className="text-xs">
                                            <AlertCircle className="mr-1 h-3 w-3" />
                                            Données incomplètes
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">CIN</p>
                                    <p className="font-medium font-mono">{selectedDemandeur.cin}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Sexe</p>
                                    <p className="font-medium">{selectedDemandeur.sexe}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                                    <p className="font-medium">{selectedDemandeur.date_naissance ? new Date(selectedDemandeur.date_naissance).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Lieu de naissance</p>
                                    <p className="font-medium">{selectedDemandeur.lieu_naissance || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Nationalité</p>
                                    <p className="font-medium">{selectedDemandeur.nationalite || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Occupation</p>
                                    <p className="font-medium">{selectedDemandeur.occupation || '-'}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informations CIN</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Date de délivrance</p>
                                        <p className="font-medium">{selectedDemandeur.date_delivrance ? new Date(selectedDemandeur.date_delivrance).toLocaleDateString('fr-FR') : '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Lieu de délivrance</p>
                                        <p className="font-medium">{selectedDemandeur.lieu_delivrance || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informations familiales</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Nom du père</p>
                                        <p className="font-medium">{selectedDemandeur.nom_pere || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Nom de la mère</p>
                                        <p className="font-medium">{selectedDemandeur.nom_mere || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Situation familiale</p>
                                        <p className="font-medium">{selectedDemandeur.situation_familiale || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Régime matrimonial</p>
                                        <p className="font-medium">{selectedDemandeur.regime_matrimoniale || '-'}</p>
                                    </div>
                                    {selectedDemandeur.marie_a && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Marié(e) à</p>
                                            <p className="font-medium">{selectedDemandeur.marie_a}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Domiciliation</p>
                                        <p className="font-medium">{selectedDemandeur.domiciliation || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Téléphone</p>
                                        <p className="font-medium">{selectedDemandeur.telephone || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button asChild variant="outline">
                                    <Link href={route('demandeurs.edit', { dossier: dossier.id, demandeur: selectedDemandeur.id })}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedDemandeur(null)}>
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog Propriété - AMÉLIORÉ */}
            <Dialog open={!!selectedPropriete} onOpenChange={() => setSelectedPropriete(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Détails de la propriété
                        </DialogTitle>
                    </DialogHeader>
                    {selectedPropriete && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                                            Lot {selectedPropriete.lot}
                                        </h3>
                                        {selectedPropriete.titre && (
                                            <p className="text-green-700 dark:text-green-300 mt-1">Titre Nº{selectedPropriete.titre}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {selectedPropriete.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                        </Badge>
                                        {isPropertyArchived(selectedPropriete) && (
                                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                                <Archive className="mr-1 h-3 w-3" />
                                                Acquise
                                            </Badge>
                                        )}
                                        {isPropertyIncomplete(selectedPropriete) && (
                                            <Badge variant="destructive" className="text-xs">
                                                <AlertCircle className="mr-1 h-3 w-3" />
                                                Données incomplètes
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Propriétaire</p>
                                    <p className="font-medium">{selectedPropriete.proprietaire || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Contenance</p>
                                    <p className="font-medium">{selectedPropriete.contenance ? `${selectedPropriete.contenance} m²` : '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Nature</p>
                                    <p className="font-medium capitalize">{selectedPropriete.nature || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Vocation</p>
                                    <p className="font-medium">{selectedPropriete.vocation || '-'}</p>
                                </div>
                            </div>

                            {selectedPropriete.type_operation === 'morcellement' && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Informations du morcellement</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Propriété mère</p>
                                            <p className="font-medium">{selectedPropriete.propriete_mere || '-'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Titre mère</p>
                                            <p className="font-medium">{selectedPropriete.titre_mere || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informations cadastrales</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Numéro FN</p>
                                        <p className="font-medium font-mono">{selectedPropriete.numero_FN || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Dep/Vol</p>
                                        <p className="font-medium">{selectedPropriete.dep_vol || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Réquisition</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Numéro de réquisition</p>
                                        <p className="font-medium font-mono">{selectedPropriete.numero_requisition || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Date de réquisition</p>
                                        <p className="font-medium">{selectedPropriete.date_requisition ? new Date(selectedPropriete.date_requisition).toLocaleDateString('fr-FR') : '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Date d'inscription</p>
                                        <p className="font-medium">{selectedPropriete.date_inscription ? new Date(selectedPropriete.date_inscription).toLocaleDateString('fr-FR') : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Autres informations</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Situation</p>
                                        <p className="font-medium">{selectedPropriete.situation || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Charge</p>
                                        <p className="font-medium">{selectedPropriete.charge || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedPropriete.demandeurs && selectedPropriete.demandeurs.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Demandeurs associés ({selectedPropriete.demandeurs.length})</h4>
                                    <div className="space-y-2">
                                        {selectedPropriete.demandeurs.map((dem) => (
                                            <div key={dem.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div>
                                                    <p className="font-medium dark:text-gray-100">{dem.titre_demandeur} {dem.nom_demandeur} {dem.prenom_demandeur}</p>
                                                    <p className="text-sm text-muted-foreground">CIN: {dem.cin}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPropriete(null);
                                                            setSelectedDemandeur({ ...dem, hasProperty: true });
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => handleDissociate(dem.id, selectedPropriete.id, `${dem.nom_demandeur} ${dem.prenom_demandeur}`)}
                                                    >
                                                        <Unlink className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button asChild variant="outline">
                                    <Link href={route('proprietes.edit', selectedPropriete.id)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                {isPropertyArchived(selectedPropriete) ? (
                                    <Button 
                                        variant="outline" 
                                        className="text-blue-600"
                                        onClick={() => {
                                            handleUnarchivePropriete(selectedPropriete.id);
                                            setSelectedPropriete(null);
                                        }}
                                    >
                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                        Désarchiver
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="outline" 
                                        className="text-green-600"
                                        onClick={() => {
                                            handleArchivePropriete(selectedPropriete.id);
                                            setSelectedPropriete(null);
                                        }}
                                    >
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archiver
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setSelectedPropriete(null)}>
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* AlertDialog pour suppression demandeur */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le demandeur</AlertDialogTitle>
                        <AlertDialogDescription>
                            Choisissez le type de suppression :
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                deleteType === 'dossier' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => setDeleteType('dossier')}
                        >
                            <div className="flex items-start gap-3">
                                <input 
                                    type="radio" 
                                    checked={deleteType === 'dossier'} 
                                    onChange={() => setDeleteType('dossier')}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-semibold">Retirer du dossier uniquement</p>
                                    <p className="text-sm text-muted-foreground">
                                        Le demandeur sera retiré de ce dossier mais restera dans la base de données.
                                        Il pourra être réutilisé dans d'autres dossiers.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                deleteType === 'definitif' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-border'
                            }`}
                            onClick={() => setDeleteType('definitif')}
                        >
                            <div className="flex items-start gap-3">
                                <input 
                                    type="radio" 
                                    checked={deleteType === 'definitif'} 
                                    onChange={() => setDeleteType('definitif')}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-semibold text-red-600 dark:text-red-400">Supprimer définitivement</p>
                                    <p className="text-sm text-muted-foreground">
                                        ⚠️ Le demandeur sera supprimé de tous les dossiers et de toutes les propriétés.
                                        Cette action est irréversible.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteDemandeur}
                            disabled={isDeleting}
                            className={deleteType === 'definitif' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {isDeleting ? 'Suppression...' : deleteType === 'dossier' ? 'Retirer du dossier' : 'Supprimer définitivement'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}