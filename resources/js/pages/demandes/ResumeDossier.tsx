// pages/demandes/ResumeDossier.tsx - VERSION REFACTORISÉE ET AMÉLIORÉE
import { useState, useEffect } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    FileText, Search, ArrowLeft, FileOutput
} from 'lucide-react';
import type { Dossier, BreadcrumbItem } from '@/types';
import DemandeDetailDialog from '@/pages/demandes/components/DemandeDetailDialog';
import DemandeurDetailDialog from '@/pages/demandeurs/components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DossierStats from './components/DossierStats';
import DemandesList from './components/DemandesList';

interface ResumeDossierProps {
    dossier: Dossier;
    documents: {
        data: Array<{
            id: number;
            id_propriete: number;
            propriete: any;
            demandeurs: any[];
            total_prix: number;
            status: string;
            status_consort: boolean;
            nombre_demandeurs: number;
        }>;
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function ResumeDossier({ dossier, documents }: ResumeDossierProps) {
    const { flash } = usePage<{ flash?: { message?: string; success?: string; error?: string } }>().props;
    
    const [search, setSearch] = useState('');
    const [selectedDemande, setSelectedDemande] = useState<any>(null);
    const [showDemandeDetail, setShowDemandeDetail] = useState(false);
    const [selectedDemandeur, setSelectedDemandeur] = useState<any>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);
    const [selectedPropriete, setSelectedPropriete] = useState<any>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archive'>('all');
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
    const [selectedDemandeForAction, setSelectedDemandeForAction] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Toast notifications
    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.message, flash?.success, flash?.error]);

    // Handlers
    const handleSelectDemande = (doc: any) => {
        const demandeData = {
            ...doc.demandeurs[0],
            propriete: doc.propriete,
            nombre_demandeurs: doc.nombre_demandeurs,
            demandeurs: doc.demandeurs
        };
        setSelectedDemande(demandeData);
        setShowDemandeDetail(true);
    };

    const handleSelectDemandeurFromDemande = (demandeur: any) => {
        setSelectedDemandeur(demandeur);
        setShowDemandeurDetail(true);
    };

    const handleSelectProprieteFromDemande = (propriete: any) => {
        setSelectedPropriete(propriete);
        setShowProprieteDetail(true);
    };

    const handleArchiveClick = (doc: any) => {
        setSelectedDemandeForAction(doc);
        setArchiveDialogOpen(true);
    };

    const handleUnarchiveClick = (doc: any) => {
        setSelectedDemandeForAction(doc);
        setUnarchiveDialogOpen(true);
    };

    const confirmArchive = () => {
        if (!selectedDemandeForAction || isProcessing) return;
        setIsProcessing(true);

        router.post(route('proprietes.archive'), 
            { id: selectedDemandeForAction.id_propriete },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Propriété archivée (acquise) avec succès');
                    setArchiveDialogOpen(false);
                    setSelectedDemandeForAction(null);
                },
                onError: (errors) => {
                    toast.error('Erreur', { description: Object.values(errors).join('\n') });
                },
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    const confirmUnarchive = () => {
        if (!selectedDemandeForAction || isProcessing) return;
        setIsProcessing(true);

        router.post(route('proprietes.unarchive'), 
            { id: selectedDemandeForAction.id_propriete },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Propriété désarchivée avec succès');
                    setUnarchiveDialogOpen(false);
                    setSelectedDemandeForAction(null);
                },
                onError: (errors) => {
                    toast.error('Erreur', { description: Object.values(errors).join('\n') });
                },
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    // Filtrage
    const filteredDocuments = documents.data.filter(doc => {
        const matchesSearch = search === '' || 
            doc.propriete?.lot.toLowerCase().includes(search.toLowerCase()) ||
            doc.demandeurs.some(d => 
                d.demandeur?.nom_demandeur.toLowerCase().includes(search.toLowerCase()) ||
                d.demandeur?.cin.includes(search)
            );
        
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Résumé des demandes', href: '#' }
    ];

    const activeCount = documents.data.filter(d => d.status === 'active').length;
    const archivedCount = documents.data.filter(d => d.status === 'archive').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Résumé - ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 space-y-6">
                {/* En-tête avec statistiques */}
                <Card className="shadow-lg bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {dossier.nom_dossier}
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Résumé de toutes les demandes du dossier
                                    </CardDescription>
                                </div>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                                className="shadow-sm"
                            >
                                <Link href={route('dossiers.show', dossier.id)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour au dossier
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DossierStats
                            totalDemandes={documents.total}
                            activeCount={activeCount}
                            archivedCount={archivedCount}
                            proprietesCount={dossier.proprietes_count}
                        />
                    </CardContent>
                </Card>

                {/* Filtres et recherche avec bouton générer */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par lot, nom ou CIN..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filterStatus === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('all')}
                        >
                            Toutes
                        </Button>
                        <Button
                            variant={filterStatus === 'active' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('active')}
                        >
                            Actives
                        </Button>
                        <Button
                            variant={filterStatus === 'archive' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('archive')}
                        >
                            Archivées
                        </Button>
                    </div>
                    <Button 
                        asChild 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        <Link href={route('documents.generate', dossier.id)}>
                            <FileOutput className="mr-2 h-4 w-4" />
                            Générer documents
                        </Link>
                    </Button>
                </div>

                {/* Liste des demandes */}
                <DemandesList
                    documents={filteredDocuments}
                    search={search}
                    filterStatus={filterStatus}
                    onArchive={handleArchiveClick}
                    onUnarchive={handleUnarchiveClick}
                    onSelectDemande={handleSelectDemande}
                />
            </div>

            {/* Modals */}
            <DemandeDetailDialog
                demande={selectedDemande}
                open={showDemandeDetail}
                onOpenChange={setShowDemandeDetail}
                onSelectDemandeur={handleSelectDemandeurFromDemande}
                onSelectPropriete={handleSelectProprieteFromDemande}
            />

            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={setShowDemandeurDetail}
                proprietes={dossier.proprietes || []}
                onSelectPropriete={handleSelectProprieteFromDemande}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
            />

            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={setShowProprieteDetail}
                onSelectDemandeur={handleSelectDemandeurFromDemande}
                dossierClosed={dossier.is_closed}
            />

            {/* Dialog archivage */}
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archiver la propriété (acquise)</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir archiver cette propriété ? 
                            <br /><br />
                            <strong>Propriété :</strong> Lot {selectedDemandeForAction?.propriete?.lot}
                            <br />
                            <strong>Demandeur(s) :</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)
                            <br /><br />
                            <span className="text-orange-600 font-semibold">
                                ⚠️ Toutes les demandes associées à cette propriété seront archivées.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmArchive}
                            disabled={isProcessing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isProcessing ? 'Archivage...' : 'Archiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog désarchivage */}
            <AlertDialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Désarchiver la propriété</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir désarchiver cette propriété ? 
                            <br />
                            <strong>Propriété :</strong> Lot {selectedDemandeForAction?.propriete?.lot}
                            <br />
                            <strong>Demandeur(s) :</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)
                            <br />
                            <br />
                            <span className="text-blue-600 font-semibold">
                                ℹ️ Toutes les demandes associées seront réactivées.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUnarchive}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isProcessing ? 'Désarchivage...' : 'Désarchiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}