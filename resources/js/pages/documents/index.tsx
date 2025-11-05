import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Demander, Dossier, Paginated } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Archive, ChevronDown, Ellipsis, FileCheck, FileOutput, FileText, Eye } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Index() {
    const { documents } = usePage<{documents: Paginated<Demander>}>().props;
    const { dossier } = usePage<{ dossier: Dossier }>().props;
    const [search, setSearch] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<Demander | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1); // Reset to first page on search

        router.get(route('documents.index', dossier.id), {
            search: e.target.value
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleArchive = (id: number) => {
        if (confirm("Êtes-vous sûr de vouloir archiver ce document ?")){
            router.post(route("document.archive"),{
                id: id,
                id_dossier: dossier.id,
            })
        }
    }

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: dossier.nom_dossier,
            href: '#',
        },
        {
            title: (
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
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
            href: route('dossiers.proprietes', dossier.id),
        },
    ];

    // Pagination logic
    const paginateDocuments = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return documents.data.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil(documents.data.length / itemsPerPage);

    // Pagination component
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
                                    Liste des documents du dossier ({documents.data.length})
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
                        <div className="mb-4">
                            <Input
                                placeholder="Recherche par lot, titre, nom, CIN..."
                                className="max-w-md"
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Lot/Titre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Demandeur</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Situation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Fokontany</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Propriétaire</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Superficie</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Nature</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Vocation</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Type opération</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Consort</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Prix Total</th>
                                        <th className="px-4 py-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="text-center text-muted-foreground py-8">
                                                Aucun document trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        paginateDocuments().map((document) => (
                                            <tr 
                                                key={document.id} 
                                                className="border-b hover:bg-muted/50 cursor-pointer"
                                                onClick={() => setSelectedDocument(document)}
                                            >
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    {document.propriete.lot}/ TNº{document.propriete.titre}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {document.demandeur.nom_demandeur} {document.demandeur.prenom_demandeur}
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
                                                <td className="px-4 py-3 text-sm">
                                                    <Badge variant={document.status_consort ? "default" : "secondary"} className="text-xs">
                                                        {document.status_consort ? "Avec" : "Sans"}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold">
                                                    {document.total_prix.toLocaleString()} Ar
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
                                                            <DropdownMenuItem asChild>
                                                                <a href={route('download.CSF', document.id)} className="flex items-center">
                                                                    <FileCheck className="mr-2 h-4 w-4" />
                                                                    Exporter CSF
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={route('document.download', document.id)} className="flex items-center">
                                                                    <FileOutput className="mr-2 h-4 w-4" />
                                                                    Exporter ADV
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-500"
                                                                onClick={() => handleArchive(document.id)}
                                                            >
                                                                <Archive className="mr-2 h-4 w-4" />
                                                                Archiver
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination />
                    </CardContent>
                </Card>
            </div>

            {/* Dialog détails du document */}
            <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>–
                        <DialogTitle className="text-2xl">Détails du document</DialogTitle>
                    </DialogHeader>
                    {selectedDocument && (
                        <div className="space-y-6">
                            {/* En-tête */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            Lot {selectedDocument.propriete.lot} - TN°{selectedDocument.propriete.titre}
                                        </h3>
                                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                                            {selectedDocument.demandeur.nom_demandeur} {selectedDocument.demandeur.prenom_demandeur}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Badge variant={selectedDocument.status_consort ? "default" : "secondary"}>
                                            {selectedDocument.status_consort ? "Avec consort" : "Sans consort"}
                                        </Badge>
                                        <Badge variant="outline" className="capitalize">
                                            {selectedDocument.propriete.type_operation}
                                        </Badge>
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

                            {/* Informations Demandeur */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Informations du demandeur</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">CIN</p>
                                        <p className="font-medium font-mono">{selectedDocument.demandeur.cin}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Sexe</p>
                                        <p className="font-medium">{selectedDocument.demandeur.sexe}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Occupation</p>
                                        <p className="font-medium">{selectedDocument.demandeur.occupation}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Domiciliation</p>
                                        <p className="font-medium">{selectedDocument.demandeur.domiciliation}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Téléphone</p>
                                        <p className="font-medium">{selectedDocument.demandeur.telephone || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Situation familiale</p>
                                        <p className="font-medium">{selectedDocument.demandeur.situation_familiale}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button asChild variant="outline">
                                    <a href={route('download.CSF', selectedDocument.id)}>
                                        <FileCheck className="mr-2 h-4 w-4" />
                                        CSF
                                    </a>
                                </Button>
                                <Button asChild variant="outline">
                                    <a href={route('document.download', selectedDocument.id)}>
                                        <FileOutput className="mr-2 h-4 w-4" />
                                        ADV
                                    </a>
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}