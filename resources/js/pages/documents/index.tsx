import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Dossier, Paginated } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Archive, ChevronDown, Ellipsis, FileText, Eye, ArchiveRestore, Users, AlertCircle, FileOutput } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GroupedDocument {
    id: number;
    id_propriete: number;
    propriete: any;
    demandeurs: Array<{
        id: number;
        id_demandeur: number;
        demandeur: any;
        total_prix: number;
        status_consort: boolean;
        status: string;
    }>;
    demandeur: any;
    total_prix: number;
    status_consort: boolean;
    status: string;
    nombre_demandeurs: number;
}

export default function Index() {
    const { documents } = usePage<{documents: Paginated<GroupedDocument>}>().props;
    const { dossier } = usePage<{ dossier: Dossier }>().props;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'tous' | 'actifs' | 'archives'>('tous');
    const [selectedDocument, setSelectedDocument] = useState<GroupedDocument | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);

        router.get(route('dossiers.list', dossier.id), {
            search: e.target.value
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleArchive = (document: GroupedDocument) => {
        // ✅ Vérifier si les données sont complètes
        const isProprieteIncomplete = !document.propriete.titre || 
                                      !document.propriete.contenance || 
                                      !document.propriete.proprietaire || 
                                      !document.propriete.nature || 
                                      !document.propriete.vocation || 
                                      !document.propriete.situation;
        
        const hasIncompleteDemandeur = document.demandeurs.some(dem => 
            !dem.demandeur.date_naissance || 
            !dem.demandeur.lieu_naissance || 
            !dem.demandeur.date_delivrance || 
            !dem.demandeur.lieu_delivrance || 
            !dem.demandeur.domiciliation || 
            !dem.demandeur.occupation || 
            !dem.demandeur.nom_mere
        );

        if (isProprieteIncomplete || hasIncompleteDemandeur) {
            let errorMessage = "❌ Impossible d'archiver : données incomplètes détectées.\n\n";
            
            if (isProprieteIncomplete) {
                errorMessage += "📋 Propriété : Veuillez renseigner tous les champs obligatoires (titre, contenance, propriétaire, nature, vocation, situation).\n\n";
            }
            
            if (hasIncompleteDemandeur) {
                const incompleteDemandeurs = document.demandeurs
                    .filter(dem => 
                        !dem.demandeur.date_naissance || 
                        !dem.demandeur.lieu_naissance || 
                        !dem.demandeur.date_delivrance || 
                        !dem.demandeur.lieu_delivrance || 
                        !dem.demandeur.domiciliation || 
                        !dem.demandeur.occupation || 
                        !dem.demandeur.nom_mere
                    )
                    .map(dem => `${dem.demandeur.nom_demandeur} ${dem.demandeur.prenom_demandeur}`)
                    .join(', ');
                
                errorMessage += `👤 Demandeur(s) : ${incompleteDemandeurs}\n`;
                errorMessage += "Champs manquants possibles : date de naissance, lieu de naissance, date/lieu de délivrance CIN, domiciliation, occupation, nom de la mère.";
            }
            
            toast.error(errorMessage, { duration: 8000 });
            return;
        }

        if (confirm("Êtes-vous sûr de vouloir archiver ce document ? (La propriété sera marquée comme acquise)")){
            router.post(route("document.archive"),{
                id: document.id,
                id_dossier: dossier.id,
            }, {
                onSuccess: () => toast.success('Document archivé avec succès'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const handleUnarchive = (id: number) => {
        if (confirm("Êtes-vous sûr de vouloir désarchiver ce document ?")){
            router.post(route("document.unarchive"),{
                id: id,
                id_dossier: dossier.id,
            }, {
                onSuccess: () => toast.success('Document désarchivé avec succès'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: dossier.nom_dossier,
            href: route('dossiers.show', dossier.id),
        },
        {
            title: (
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1">
                        Documents
                        <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.list', dossier.id)}>Documents</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.demandeurs', dossier.id)}>Demandeurs</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.proprietes', dossier.id)}>Proprietes</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            href: route('dossiers.list', dossier.id),
        },
    ];

    // ✅ Fonctions de vérification
    const isProprieteIncomplete = (propriete: any) => {
        return !propriete.titre || 
               !propriete.contenance || 
               !propriete.proprietaire || 
               !propriete.nature || 
               !propriete.vocation || 
               !propriete.situation;
    };

    const isDemandeurIncomplete = (demandeur: any) => {
        return !demandeur.date_naissance || 
               !demandeur.lieu_naissance || 
               !demandeur.date_delivrance || 
               !demandeur.lieu_delivrance || 
               !demandeur.domiciliation || 
               !demandeur.occupation || 
               !demandeur.nom_mere;
    };

    const hasIncompleteData = (document: GroupedDocument) => {
        const propIncomplete = isProprieteIncomplete(document.propriete);
        const demIncomplete = document.demandeurs.some(dem => isDemandeurIncomplete(dem.demandeur));
        return propIncomplete || demIncomplete;
    };

    // ✅ Filtrage côté client
    const filteredDocuments = documents.data.filter(doc => {
        if (statusFilter === 'actifs') return doc.status === 'active';
        if (statusFilter === 'archives') return doc.status === 'archive';
        return true;
    });

    // ✅ Compteurs pour les filtres
    const totalActifs = documents.data.filter(d => d.status === 'active').length;
    const totalArchives = documents.data.filter(d => d.status === 'archive').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Liste des documents" />
            <Toaster position="top-right" richColors />
            
            <div className="flex flex-col gap-6 p-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>
                                    Liste des documents du dossier ({filteredDocuments.length}/{documents.data.length})
                                    <span className="ml-4 text-xs">
                                        <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></span>
                                        Données incomplètes
                                    </span>
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button asChild variant="outline" size="sm">
                                    <a href={route('export.list', dossier.id)}>
                                        <FileOutput className="mr-2 h-4 w-4" />
                                        Exporter données
                                    </a>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={route("documents.generate", dossier.id)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Générer documents
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex gap-4">
                            <Input
                                placeholder="Recherche par lot, titre, nom, CIN..."
                                className="max-w-md"
                                value={search}
                                onChange={handleSearch}
                            />
                            <Select value={statusFilter} onValueChange={(value: 'tous' | 'actifs' | 'archives') => {
                                setStatusFilter(value);
                            }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrer par statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tous">Tous ({documents.data.length})</SelectItem>
                                    <SelectItem value="actifs">
                                        Actifs ({totalActifs})
                                    </SelectItem>
                                    <SelectItem value="archives">
                                        Archivés ({totalArchives})
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Lot/Titre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Demandeur(s)</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Situation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Fokontany</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Propriétaire</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Superficie</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Nature</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Vocation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Type opération</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Prix Total</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                                        <th className="px-4 py-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocuments.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="text-center text-muted-foreground py-8">
                                                Aucun document trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDocuments.map((document) => {
                                            const isArchived = document.status === 'archive';
                                            const hasMultipleDemandeurs = document.nombre_demandeurs > 1;
                                            const isIncomplete = hasIncompleteData(document);
                                            
                                            const rowClass = isArchived
                                                ? 'border-b hover:bg-gray-100 dark:hover:bg-gray-800 bg-gray-50/80 dark:bg-gray-900/50 cursor-pointer'
                                                : isIncomplete
                                                    ? 'border-b hover:bg-red-50 dark:hover:bg-red-950/30 bg-red-50/50 dark:bg-red-950/20 cursor-pointer'
                                                    : 'border-b hover:bg-muted/50 cursor-pointer';

                                            return (
                                                <tr 
                                                    key={document.id} 
                                                    className={rowClass}
                                                    onClick={() => setSelectedDocument(document)}
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {document.propriete.lot}/ TNº{document.propriete.titre}
                                                            {isArchived && <Archive className="h-4 w-4 text-gray-500" />}
                                                             {isIncomplete && (
                                                                <span title="Données incomplètes">
                                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                {document.demandeur.nom_demandeur} {document.demandeur.prenom_demandeur}
                                                            </span>
                                                            {hasMultipleDemandeurs && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <Users className="h-3 w-3 mr-1" />
                                                                    +{document.nombre_demandeurs - 1}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {document.propriete.situation}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {dossier.fokontany}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {document.propriete.proprietaire}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {document.propriete.contenance} m²
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <Badge variant="outline" className="text-xs">
                                                            {document.propriete.nature}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {document.propriete.vocation}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm capitalize">
                                                        {document.propriete.type_operation}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold">
                                                        {document.total_prix.toLocaleString()} Ar
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {isArchived ? (
                                                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                                                <Archive className="mr-1 h-3 w-3" />
                                                                Archivé
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="default" className="text-xs">
                                                                Actif
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Ellipsis className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setSelectedDocument(document)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir détails
                                                                </DropdownMenuItem>
                                                                {isArchived ? (
                                                                    <DropdownMenuItem
                                                                        className="text-blue-600"
                                                                        onClick={() => handleUnarchive(document.id)}
                                                                    >
                                                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                                                        Désarchiver
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        className={hasIncompleteData(document) ? "text-gray-400" : "text-green-600"}
                                                                        onClick={() => handleArchive(document)}
                                                                        disabled={hasIncompleteData(document)}
                                                                    >
                                                                        <Archive className="mr-2 h-4 w-4" />
                                                                        Archiver
                                                                        {hasIncompleteData(document) && (
                                                                            <AlertCircle className="ml-2 h-3 w-3" />
                                                                        )}
                                                                    </DropdownMenuItem>
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
                        
                        {/* ✅ Pagination server-side */}
                        {documents.last_page > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('dossiers.list', dossier.id), { page: documents.current_page - 1 })}
                                    disabled={documents.current_page === 1}
                                >
                                    Précédent
                                </Button>
                                {Array.from({ length: documents.last_page }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={documents.current_page === page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => router.get(route('dossiers.list', dossier.id), { page })}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('dossiers.list', dossier.id), { page: documents.current_page + 1 })}
                                    disabled={documents.current_page === documents.last_page}
                                >
                                    Suivant
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog détails */}
            <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                <DialogContent className="max-w-5xl max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Détails du document</DialogTitle>
                    </DialogHeader>
                    {selectedDocument && (
                        <ScrollArea className="h-[calc(85vh-120px)] pr-4">
                            <div className="space-y-6">
                                {/* ✅ Avertissement si données incomplètes */}
                                {hasIncompleteData(selectedDocument) && selectedDocument.status !== 'archive' && (
                                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 p-4 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                                    ⚠️ Données incomplètes - Archivage impossible
                                                </h4>
                                                <p className="text-sm text-red-700 dark:text-red-300">
                                                    Ce document ne peut pas être archivé car certaines informations sont manquantes.
                                                    Veuillez compléter toutes les données obligatoires avant d'archiver.
                                                </p>
                                                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                                                    {isProprieteIncomplete(selectedDocument.propriete) && (
                                                        <li>• <strong>Propriété :</strong> Informations incomplètes (titre, contenance, propriétaire, nature, vocation, situation)</li>
                                                    )}
                                                    {selectedDocument.demandeurs.some(dem => isDemandeurIncomplete(dem.demandeur)) && (
                                                        <li>
                                                            • <strong>Demandeur(s) :</strong> {
                                                                selectedDocument.demandeurs
                                                                    .filter(dem => isDemandeurIncomplete(dem.demandeur))
                                                                    .map(dem => `${dem.demandeur.nom_demandeur} ${dem.demandeur.prenom_demandeur}`)
                                                                    .join(', ')
                                                            } (date/lieu naissance, CIN, domiciliation, occupation, nom de la mère)
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* En-tête */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                                Lot {selectedDocument.propriete.lot} - TN°{selectedDocument.propriete.titre}
                                            </h3>
                                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                                                {selectedDocument.nombre_demandeurs} demandeur(s)
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {selectedDocument.nombre_demandeurs > 1 && (
                                                <Badge variant="default">
                                                    <Users className="mr-1 h-3 w-3" />
                                                    Avec consorts
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="capitalize">
                                                {selectedDocument.propriete.type_operation}
                                            </Badge>
                                            {selectedDocument.status === 'archive' && (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                                    <Archive className="mr-1 h-3 w-3" />
                                                    Archivé
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Prix */}
                                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Prix total</p>
                                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                                        {selectedDocument.total_prix.toLocaleString()} Ar
                                    </p>
                                </div>

                                {/* Informations Propriété */}
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Informations de la propriété
                                        {isProprieteIncomplete(selectedDocument.propriete) && (
                                            <Badge variant="destructive" className="text-xs">
                                                <AlertCircle className="mr-1 h-3 w-3" />
                                                Données incomplètes
                                            </Badge>
                                        )}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Propriétaire</p>
                                            <p className="font-medium">{selectedDocument.propriete.proprietaire}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Contenance</p>
                                            <p className="font-medium">{selectedDocument.propriete.contenance} m²</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Nature</p>
                                            <p className="font-medium">{selectedDocument.propriete.nature}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Vocation</p>
                                            <p className="font-medium">{selectedDocument.propriete.vocation}</p>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <p className="text-sm text-muted-foreground">Situation</p>
                                            <p className="font-medium">{selectedDocument.propriete.situation}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* LISTE DE TOUS LES DEMANDEURS */}
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Demandeur{selectedDocument.nombre_demandeurs > 1 ? 's' : ''} 
                                        ({selectedDocument.nombre_demandeurs})
                                    </h4>
                                    <div className="space-y-4">
                                        {selectedDocument.demandeurs.map((dem, index) => (
                                            <div key={dem.id} className="border rounded-lg p-4 bg-muted/30">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h5 className="font-semibold text-lg flex items-center gap-2">
                                                        Demandeur {index + 1}
                                                        {isDemandeurIncomplete(dem.demandeur) && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                <AlertCircle className="mr-1 h-3 w-3" />
                                                                Incomplet
                                                            </Badge>
                                                        )}
                                                    </h5>
                                                    {index > 0 && (
                                                        <Badge variant="secondary">Consort</Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Nom complet</p>
                                                        <p className="font-medium">
                                                            {dem.demandeur.nom_demandeur} {dem.demandeur.prenom_demandeur}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">CIN</p>
                                                        <p className="font-medium font-mono">{dem.demandeur.cin}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Sexe</p>
                                                        <p className="font-medium">{dem.demandeur.sexe}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Occupation</p>
                                                        <p className="font-medium">{dem.demandeur.occupation}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Domiciliation</p>
                                                        <p className="font-medium">{dem.demandeur.domiciliation}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Téléphone</p>
                                                        <p className="font-medium">{dem.demandeur.telephone || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Situation familiale</p>
                                                        <p className="font-medium">{dem.demandeur.situation_familiale}</p>
                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Statut archivé */}
                                {selectedDocument.status === 'archive' && (
                                    <div className="border-t pt-4">
                                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-1">Statut du document</p>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                ✓ Document archivé - Propriété acquise
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
                                    {selectedDocument.status === 'archive' ? (
                                        <Button 
                                            variant="outline" 
                                            className="text-blue-600"
                                            onClick={() => {
                                                handleUnarchive(selectedDocument.id);
                                                setSelectedDocument(null);
                                            }}
                                        >
                                            <ArchiveRestore className="mr-2 h-4 w-4" />
                                            Désarchiver
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            className={hasIncompleteData(selectedDocument) ? "text-gray-400" : "text-green-600"}
                                            onClick={() => {
                                                handleArchive(selectedDocument);
                                                if (!hasIncompleteData(selectedDocument)) {
                                                    setSelectedDocument(null);
                                                }
                                            }}
                                            disabled={hasIncompleteData(selectedDocument)}
                                        >
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archiver
                                            {hasIncompleteData(selectedDocument) && (
                                                <AlertCircle className="ml-2 h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                                        Fermer
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}