// pages/dossiers/Show.tsx - VERSION CORRIGÉE GESTION DIALOGUES
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useEffect, useState, useCallback } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Dossier, Demandeur, Propriete, SharedData, BreadcrumbItem } from '@/types';
import type { BaseDemandeur, BasePropriete } from '@/pages/PiecesJointes/pieces-jointes';
import { CloseDossierDialog } from '@/pages/dossiers/components/CloseDossierDialog';

import { LinkDemandeurDialog } from '../DemandeursProprietes/associations/LinkDemandeurDialog';
import { LinkProprieteDialog } from '../DemandeursProprietes/associations/LinkProprieteDialog';
import { DissociateDialog } from '../DemandeursProprietes/associations/DissociateDialog';

import DossierInfoSection from '@/pages/dossiers/components/DossierInfoSection';
import DemandeursIndex from '@/pages/demandeurs/index';
import ProprietesIndex from '@/pages/proprietes/index';
import PiecesJointesIndex from '@/pages/PiecesJointes/Index';

interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
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

    const proprietes = dossier.proprietes || [];

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
    
    // ✅ États pour la liaison - AVEC GESTION STRICTE
    const [linkDemandeurOpen, setLinkDemandeurOpen] = useState(false);
    const [linkProprieteOpen, setLinkProprieteOpen] = useState(false);
    const [selectedProprieteForLink, setSelectedProprieteForLink] = useState<Propriete | null>(null);
    const [selectedDemandeurForLink, setSelectedDemandeurForLink] = useState<Demandeur | null>(null);

    // ✅ État pour la dissociation
    const [dissociateDialogOpen, setDissociateDialogOpen] = useState(false);
    const [dissociateData, setDissociateData] = useState<{
        demandeurId: number;
        proprieteId: number;
        demandeurNom: string;
        proprieteLot: string;
        type: 'from-demandeur' | 'from-propriete';
        autresDemandeurs?: number;
    } | null>(null);
    const [isDissociating, setIsDissociating] = useState(false);

    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.message, flash?.success, flash?.error]);

    // ✅ CORRECTION MAJEURE : Fermeture complète des dialogues de liaison
    const handleCloseLinkDemandeurDialog = useCallback(() => {
        setLinkDemandeurOpen(false);
        // ✅ Délai pour éviter les conflits d'état
        setTimeout(() => {
            setSelectedProprieteForLink(null);
        }, 300);
    }, []);

    const handleCloseLinkProprieteDialog = useCallback(() => {
        setLinkProprieteOpen(false);
        // ✅ Délai pour éviter les conflits d'état
        setTimeout(() => {
            setSelectedDemandeurForLink(null);
        }, 300);
    }, []);

    // ✅ Gestionnaires de liaison avec vérifications strictes
    const handleLinkDemandeur = useCallback((propriete: Propriete) => {
        if (dossier.is_closed) {
            toast.error('Impossible de lier : le dossier est fermé');
            return;
        }
        if (propriete.is_archived) {
            toast.error('Impossible de lier : la propriété est archivée (acquise)');
            return;
        }
        
        // ✅ FERMER TOUS LES AUTRES DIALOGUES D'ABORD
        setLinkProprieteOpen(false);
        setDissociateDialogOpen(false);
        
        // ✅ Ouvrir le dialogue après un court délai
        setTimeout(() => {
            setSelectedProprieteForLink(propriete);
            setLinkDemandeurOpen(true);
        }, 100);
    }, [dossier.is_closed]);

    const handleLinkPropriete = useCallback((demandeur: Demandeur) => {
        if (dossier.is_closed) {
            toast.error('Impossible de lier : le dossier est fermé');
            return;
        }
        
        // ✅ FERMER TOUS LES AUTRES DIALOGUES D'ABORD
        setLinkDemandeurOpen(false);
        setDissociateDialogOpen(false);
        
        // ✅ Ouvrir le dialogue après un court délai
        setTimeout(() => {
            setSelectedDemandeurForLink(demandeur);
            setLinkProprieteOpen(true);
        }, 100);
    }, [dossier.is_closed]);

    // ✅ Gestionnaire de dissociation avec fermeture des autres dialogues
    const handleDissociate = useCallback((
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => {
        console.log('🔗 handleDissociate appelé:', {
            demandeurId,
            proprieteId,
            demandeurNom,
            proprieteLot,
            type,
            dossierClosed: dossier.is_closed
        });

        if (dossier.is_closed) {
            console.warn('⚠️ Dissociation bloquée : dossier fermé');
            toast.error('Impossible de dissocier : le dossier est fermé');
            return;
        }

        const propriete = proprietes.find(p => {
            const pId = typeof p.id === 'number' ? p.id : parseInt(p.id);
            const propId = typeof proprieteId === 'number' ? proprieteId : parseInt(proprieteId);
            return pId === propId;
        });

        if (!propriete) {
            console.error('❌ Propriété introuvable:', proprieteId);
            toast.error('Propriété introuvable');
            return;
        }

        if (propriete.is_archived) {
            console.warn('⚠️ Dissociation bloquée : propriété archivée');
            toast.error('Impossible de dissocier : la propriété est archivée (acquise)');
            return;
        }

        const autresDemandeurs = propriete.demandes?.filter(d => {
            const demandeIdDemandeur = typeof d.id_demandeur === 'number' 
                ? d.id_demandeur 
                : parseInt(d.id_demandeur);
            const currentDemandeurId = typeof demandeurId === 'number'
                ? demandeurId
                : parseInt(demandeurId);
                
            const isOtherDemandeur = demandeIdDemandeur !== currentDemandeurId;
            const isActive = d.status === 'active';
            
            return isOtherDemandeur && isActive;
        }).length || 0;

        console.log('📊 Comptage des autres demandeurs:', {
            total_demandes: propriete.demandes?.length || 0,
            autres_actifs: autresDemandeurs,
            demandeur_courant: demandeurId
        });

        // ✅ FERMER TOUS LES AUTRES DIALOGUES
        setLinkDemandeurOpen(false);
        setLinkProprieteOpen(false);
        
        // ✅ Ouvrir le dialogue de dissociation après un délai
        setTimeout(() => {
            setDissociateData({
                demandeurId,
                proprieteId,
                demandeurNom,
                proprieteLot,
                type,
                autresDemandeurs
            });
            setDissociateDialogOpen(true);
        }, 100);

        console.log('✅ Dialogue de dissociation ouvert');
    }, [dossier.is_closed, proprietes]);

    // ✅ Confirmation de la dissociation
    const confirmDissociate = useCallback(() => {
        if (!dissociateData || isDissociating) {
            console.warn('⚠️ Confirmation ignorée:', { 
                hasDissociateData: !!dissociateData, 
                isDissociating 
            });
            return;
        }

        console.log('🚀 Envoi de la demande de dissociation:', dissociateData);

        setIsDissociating(true);

        router.post(route('association.dissociate'), {
            id_demandeur: dissociateData.demandeurId,
            id_propriete: dissociateData.proprieteId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                const message = dissociateData.type === 'from-demandeur'
                    ? `Propriété Lot ${dissociateData.proprieteLot} dissociée avec succès`
                    : `${dissociateData.demandeurNom} dissocié de la propriété avec succès`;
                
                console.log('✅ Dissociation réussie');
                toast.success(message);
                
                // ✅ Fermer et nettoyer
                setDissociateDialogOpen(false);
                setTimeout(() => {
                    setDissociateData(null);
                }, 300);
            },
            onError: (errors) => {
                console.error('❌ Erreur dissociation:', errors);
                toast.error('Erreur', {
                    description: Object.values(errors).join('\n')
                });
            },
            onFinish: () => {
                console.log('🏁 Requête terminée');
                setIsDissociating(false);
            }
        });
    }, [dissociateData, isDissociating]);

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
                        setTimeout(() => setItemToDelete(null), 300);
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
                        setTimeout(() => setItemToDelete(null), 300);
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
                if (prop.demandes) {
                    prop.demandes.forEach((demande) => {
                        const d = demande.demandeur;
                        if (d && !demandeursMap.has(d.id)) {
                            demandeursMap.set(d.id, { ...d, hasProperty: true });
                        } else if (d) {
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

    const isPropertyIncomplete = (prop: Propriete): boolean => {
        return !prop.titre || !prop.contenance || !prop.proprietaire || !prop.nature || !prop.vocation || !prop.situation;
    };

    const isDemandeurIncomplete = (dem: Demandeur): boolean => {
        return !dem.date_naissance || !dem.lieu_naissance || !dem.date_delivrance || 
               !dem.lieu_delivrance || !dem.domiciliation || !dem.occupation || !dem.nom_mere;
    };

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

            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                
                <DossierInfoSection
                    dossier={dossier}
                    demandeursCount={allDemandeurs.length}
                    proprietesCount={proprietes.length}
                    onCloseToggle={() => setCloseDialogOpen(true)}
                />

                <DemandeursIndex
                    demandeurs={allDemandeurs}
                    dossier={dossier}
                    proprietes={proprietes}
                    onSelectDemandeur={(dem) => console.log('Sélectionné:', dem)}
                    onDeleteDemandeur={handleDeleteDemandeur}
                    onLinkPropriete={handleLinkPropriete}
                    onDissociate={handleDissociate}
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
                    onDissociate={handleDissociate}
                    isPropertyIncomplete={isPropertyIncomplete}
                />
                
                <PiecesJointesIndex
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

            {/* ✅ Dialogue de liaison demandeur - AVEC GESTION STRICTE */}
            {selectedProprieteForLink && (
                <LinkDemandeurDialog
                    open={linkDemandeurOpen}
                    onOpenChange={handleCloseLinkDemandeurDialog}
                    propriete={selectedProprieteForLink}
                    demandeursDossier={allDemandeurs}
                    dossierId={dossier.id}
                />
            )}

            {/* ✅ Dialogue de liaison propriété - AVEC GESTION STRICTE */}
            {selectedDemandeurForLink && (
                <LinkProprieteDialog
                    open={linkProprieteOpen}
                    onOpenChange={handleCloseLinkProprieteDialog}
                    demandeur={selectedDemandeurForLink}
                    proprietesDossier={proprietes}
                    dossierId={dossier.id}
                />
            )}

            {/* ✅ Dialogue de dissociation */}
            <DissociateDialog
                open={dissociateDialogOpen}
                onOpenChange={(open) => {
                    setDissociateDialogOpen(open);
                    if (!open) {
                        setTimeout(() => setDissociateData(null), 300);
                    }
                }}
                data={dissociateData}
                isProcessing={isDissociating}
                onConfirm={confirmDissociate}
            />

            <CloseDossierDialog
                dossier={{
                    ...dossier,
                    date_fermeture: dossier.date_fermeture ?? undefined,
                }}
                open={closeDialogOpen}
                onOpenChange={setCloseDialogOpen}
            />

            {/* Dialogue de suppression de demandeur */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le demandeur</AlertDialogTitle>
                        <AlertDialogDescription>Choisissez le type de suppression</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                deleteType === 'dossier' ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setDeleteType('dossier')}
                        >
                            <input type="radio" checked={deleteType === 'dossier'} onChange={() => setDeleteType('dossier')} className="mr-3" />
                            <strong>Retirer du dossier uniquement</strong>
                        </div>
                        <div 
                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                deleteType === 'definitif' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''
                            }`}
                            onClick={() => setDeleteType('definitif')}
                        >
                            <input type="radio" checked={deleteType === 'definitif'} onChange={() => setDeleteType('definitif')} className="mr-3" />
                            <strong className="text-red-600 dark:text-red-400">Supprimer définitivement</strong>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteDemandeur}
                            disabled={isDeleting}
                            className={deleteType === 'definitif' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {isDeleting ? 'Suppression...' : deleteType === 'dossier' ? 'Retirer' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}