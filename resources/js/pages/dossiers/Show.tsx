// pages/dossiers/Show.tsx
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    LandPlot, Pencil, Lock, LockOpen, FileOutput, 
    MapPin, Calendar, Building2 
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Dossier, Demandeur, Propriete, SharedData, BreadcrumbItem } from '@/types';
import { CloseDossierDialog } from '@/components/CloseDossierDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import des nouveaux composants d'association
import { LinkDemandeurDialog } from '@/components/associations/LinkDemandeurDialog';
import { LinkProprieteDialog } from '@/components/associations/LinkProprieteDialog';

// Import des composants de liste
import DemandeursIndex from '@/pages/demandeurs/index';
import ProprietesIndex from '@/pages/proprietes/index';

import AttachmentsSection from '@/components/AttachmentsSection';

interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
}

// Interface pour les demandeurs de base (pour AttachmentsSection)
interface BaseDemandeur {
    id: number;
    nom_demandeur: string;
    prenom_demandeur: string;
    cin: string;
   
}

// Interface pour les propriétés de base (pour AttachmentsSection)
interface BasePropriete {
    id: number;
    lot: string;
    titre: string | null;
}

interface PageProps {
    dossier: Dossier & {
        demandeurs: Demandeur[];
        proprietes: Propriete[];
        pieces_jointes_count?: number;
    };
    permissions?: {
        canEdit: boolean;
        canDelete: boolean;
        canClose: boolean;
        canArchive: boolean;
        canExport: boolean;
    };
    [key: string]: any;
}

export default function Show() {
    const { dossier, permissions } = usePage<PageProps>().props;
    const { flash } = usePage<SharedData>().props;

    const userPermissions = permissions || {
        canEdit: true,
        canDelete: true,
        canClose: true,
        canArchive: true,
        canExport: true,
    };
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteType, setDeleteType] = useState<'dossier' | 'definitif'>('dossier');
    const [itemToDelete, setItemToDelete] = useState<{ type: 'demandeur' | 'propriete', id: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    
    // États pour les dialogues d'association
    const [linkDemandeurOpen, setLinkDemandeurOpen] = useState(false);
    const [linkProprieteOpen, setLinkProprieteOpen] = useState(false);
    const [selectedProprieteForLink, setSelectedProprieteForLink] = useState<Propriete | null>(null);
    const [selectedDemandeurForLink, setSelectedDemandeurForLink] = useState<Demandeur | null>(null);

    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.message, flash?.success, flash?.error]);

    // ========== HANDLERS D'ASSOCIATION ==========
    const handleLinkDemandeur = (propriete: Propriete) => {
        setSelectedProprieteForLink(propriete);
        setLinkDemandeurOpen(true);
    };

    const handleLinkPropriete = (demandeur: Demandeur) => {
        setSelectedDemandeurForLink(demandeur);
        setLinkProprieteOpen(true);
    };

    // ========== HANDLERS EXISTANTS ==========
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
                    id_dossier: dossier.id, 
                    id_demandeur: itemToDelete.id 
                }), 
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Demandeur retiré du dossier');
                        setDeleteDialogOpen(false);
                        setItemToDelete(null);
                    },
                    onError: (errors) => {
                        toast.error('Erreur', { description: Object.values(errors).join('\n') });
                    },
                    onFinish: () => setIsDeleting(false)
                }
            );
        } else {
            router.delete(
                route('demandeurs.destroyDefinitive', itemToDelete.id), 
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Demandeur supprimé définitivement');
                        setDeleteDialogOpen(false);
                        setItemToDelete(null);
                    },
                    onError: (errors) => {
                        toast.error('Erreur', { description: Object.values(errors).join('\n') });
                    },
                    onFinish: () => setIsDeleting(false)
                }
            );
        }
    };

    const handleDeletePropriete = (id: number) => {
        if (confirm('Voulez-vous vraiment supprimer cette propriété ?')) {
            router.delete(route('proprietes.destroy', id), {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété supprimée'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const handleArchivePropriete = (id: number) => {
        if (confirm('Archiver cette propriété (acquise) ?')) {
            router.post(route('proprietes.archive'), { id }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété archivée'),
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

    // ========== HELPERS ==========
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

    const allDemandeurs = getAllDemandeurs();
    const proprietes = dossier.proprietes || [];

    const isPropertyIncomplete = (prop: Propriete): boolean => {
        return !prop.titre || !prop.contenance || !prop.proprietaire || !prop.nature || !prop.vocation || !prop.situation;
    };

    const isDemandeurIncomplete = (dem: Demandeur): boolean => {
        return !dem.date_naissance || !dem.lieu_naissance || !dem.date_delivrance || 
               !dem.lieu_delivrance || !dem.domiciliation || !dem.occupation || !dem.nom_mere;
    };

    // Convertir les demandeurs et propriétés pour AttachmentsSection
    const baseDemandeursForAttachments: BaseDemandeur[] = allDemandeurs.map(d => ({
        id: d.id,
        nom_demandeur: d.nom_demandeur,
        prenom_demandeur: d.prenom_demandeur ?? "",
        cin: d.cin,
    }));

    const baseProprietesForAttachments: BasePropriete[] = proprietes.map(p => ({
        id: p.id,
        lot: p.lot,
        titre: p.titre,
    }));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dossier ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 p-6">
                {/* Alerte si dossier fermé */}
                {dossier.is_closed && (
                    <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                        <Lock className="h-4 w-4" />
                        <AlertTitle>Dossier fermé</AlertTitle>
                        <AlertDescription className="space-y-2">
                            <p>
                                Fermé le <strong>{new Date(dossier.date_fermeture!).toLocaleDateString('fr-FR')}</strong>
                                {dossier.closedBy && <> par <strong>{dossier.closedBy.name}</strong></>}
                            </p>
                            {dossier.motif_fermeture && (
                                <p className="text-sm italic">Motif : {dossier.motif_fermeture}</p>
                            )}
                            <p className="text-sm">
                                Aucune modification possible. Seuls les administrateurs peuvent rouvrir ce dossier.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Section Informations du Dossier */}
                <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                        {dossier.nom_dossier}
                                    </CardTitle>
                                    {dossier.is_closed ? (
                                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                            <Lock className="mr-1 h-3 w-3" />
                                            Fermé
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                            <LockOpen className="mr-1 h-3 w-3" />
                                            Ouvert
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {dossier.can_close && (
                                    <Button
                                        variant={dossier.is_closed ? "default" : "destructive"}
                                        size="sm"
                                        onClick={() => setCloseDialogOpen(true)}
                                        className={dossier.is_closed 
                                            ? "bg-green-600 hover:bg-green-700" 
                                            : "bg-orange-600 hover:bg-orange-700"
                                        }
                                    >
                                        {dossier.is_closed ? (
                                            <>
                                                <LockOpen className="mr-2 h-4 w-4" />
                                                Rouvrir
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="mr-2 h-4 w-4" />
                                                Fermer
                                            </>
                                        )}
                                    </Button>
                                )}

                                {dossier.can_modify && (
                                    <Button asChild variant="outline" size="sm" disabled={dossier.is_closed && !dossier.can_close}>
                                        <Link href={route('dossiers.edit', dossier.id)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Link>
                                    </Button>
                                )}
                                
                                {!dossier.is_closed && (
                                    <Button asChild variant="default" size="sm">
                                        <Link href={route('nouveau-lot.create', dossier.id)}>
                                            <LandPlot className="mr-2 h-4 w-4" />
                                            Nouvelle entrée
                                        </Link>
                                    </Button>
                                )}
                                
                                <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Link href={route('documents.generate', dossier.id)}>
                                        <FileOutput className="mr-2 h-4 w-4" />
                                        Générer documents
                                    </Link>
                                </Button>
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
                            <Badge variant="secondary">{allDemandeurs.length} Demandeur{allDemandeurs.length > 1 ? 's' : ''}</Badge>
                            <Badge variant="secondary">{proprietes.length} Propriété{proprietes.length > 1 ? 's' : ''}</Badge>
                            <Badge variant="outline">Ouvert le {new Date(dossier.date_ouverture).toLocaleDateString('fr-FR')}</Badge>
                            {dossier.is_closed && dossier.date_fermeture && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                    <Lock className="mr-1 h-3 w-3" />
                                    Fermé le {new Date(dossier.date_fermeture).toLocaleDateString('fr-FR')}
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Listes avec boutons d'association */}
                <DemandeursIndex
                    demandeurs={allDemandeurs}
                    dossier={dossier}
                    proprietes={proprietes}
                    onSelectDemandeur={(dem) => console.log('Sélectionné:', dem)}
                    onDeleteDemandeur={handleDeleteDemandeur}
                    onLinkPropriete={handleLinkPropriete}
                    isDemandeurIncomplete={isDemandeurIncomplete}
                />

                <ProprietesIndex
                    proprietes={proprietes}
                    dossier={dossier}
                    demandeurs={allDemandeurs}
                    onSelectPropriete={(prop) => console.log('Sélectionné:', prop)}
                    onDeletePropriete={handleDeletePropriete}
                    onArchivePropriete={handleArchivePropriete}
                    onUnarchivePropriete={handleUnarchivePropriete}
                    onLinkDemandeur={handleLinkDemandeur}
                    isPropertyIncomplete={isPropertyIncomplete}
                />
                
                {/* Section Pièces Jointes - Corrigée */}
                <div className="mt-6">
                    <AttachmentsSection
                        attachableType="Dossier"
                        attachableId={dossier.id}
                        title="Documents du Dossier"
                        canUpload={userPermissions.canEdit && !dossier.is_closed}
                        canDelete={userPermissions.canDelete && !dossier.is_closed}
                        canVerify={userPermissions.canClose}
                        initialCount={dossier.pieces_jointes_count || 0}
                        demandeurs={baseDemandeursForAttachments}
                        proprietes={baseProprietesForAttachments}
                        showRelated={true}
                    />
                </div>
            </div>

            {/* Dialogues d'association */}
            {selectedProprieteForLink && (
                <LinkDemandeurDialog
                    open={linkDemandeurOpen}
                    onOpenChange={setLinkDemandeurOpen}
                    propriete={selectedProprieteForLink}
                    demandeursDossier={allDemandeurs}
                    dossierId={dossier.id}
                />
            )}

            {selectedDemandeurForLink && (
                <LinkProprieteDialog
                    open={linkProprieteOpen}
                    onOpenChange={setLinkProprieteOpen}
                    demandeur={selectedDemandeurForLink}
                    proprietesDossier={proprietes}
                    dossierId={dossier.id}
                />
            )}

            {/* Dialog fermeture/réouverture */}
            <CloseDossierDialog
                dossier={{
                    ...dossier,
                    date_fermeture: dossier.date_fermeture ?? undefined,
                }}
                open={closeDialogOpen}
                onOpenChange={setCloseDialogOpen}
            />

            {/* AlertDialog suppression demandeur */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le demandeur</AlertDialogTitle>
                        <AlertDialogDescription>Choisissez le type de suppression</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer ${
                                deleteType === 'dossier' ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setDeleteType('dossier')}
                        >
                            <input type="radio" checked={deleteType === 'dossier'} onChange={() => setDeleteType('dossier')} className="mr-3" />
                            <strong>Retirer du dossier uniquement</strong>
                        </div>
                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer ${
                                deleteType === 'definitif' ? 'border-red-500 bg-red-50' : ''
                            }`}
                            onClick={() => setDeleteType('definitif')}
                        >
                            <input type="radio" checked={deleteType === 'definitif'} onChange={() => setDeleteType('definitif')} className="mr-3" />
                            <strong className="text-red-600">Supprimer définitivement</strong>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteDemandeur}
                            disabled={isDeleting}
                            className={deleteType === 'definitif' ? 'bg-red-600' : ''}
                        >
                            {isDeleting ? 'Suppression...' : deleteType === 'dossier' ? 'Retirer' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}