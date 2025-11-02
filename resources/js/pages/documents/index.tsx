import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Demander, Dossier, Paginated } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Archive, ChevronDown, Ellipsis, FileCheck, FileOutput, FolderPlus, FileText, Eye } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
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

export default function Index() {
    const { documents } = usePage<{documents: Paginated<Demander>}>().props;
    const { dossier } = usePage<{ dossier: Dossier }>().props;
    const [search, setSearch] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<Demander | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Liste des documents" />
            <Toaster position="top-right" richColors />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className={"flex mx-5 gap-6 md:gap-0 flex-col md:flex-row justify-between"}>
                    <Input
                        placeholder="Recherche par lot, titre, nom, CIN..."
                        className="max-w-md"
                        value={search}
                        onChange={handleSearch}
                    />
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route("lier.document", dossier.id)}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Lier un document
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={route("documents.generate", dossier.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Générer des documents
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className={'mt-5 mx-10 flex justify-center md:justify-end'}>
                        <a href={route('export.list', dossier.id)}>
                            <Button variant="outline">
                                <FileOutput className="mr-2 h-4 w-4" />
                                Exporter les données
                            </Button>
                        </a>
                    </div>
                    <div className={'m-10 border rounded-md'}>
                        <Table>
                            <TableCaption>Liste des Documents ({documents.data.length})</TableCaption>
                            <TableCaption>
                                <Pagination>
                                    <PaginationContent>
                                        {documents.links.map((link, index: number) => {
                                            const isPrevious = link.label.includes('Previous') || link.label.includes('&laquo;');
                                            const isNext = link.label.includes('Next') || link.label.includes('&raquo;');
                                            const isEllipsis = link.label === '...';

                                            if (isEllipsis) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                );
                                            }

                                            if (!link.url) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <span className="px-3 py-1 text-muted-foreground cursor-not-allowed">
                                                          {link.label.replace(/&laquo;|&raquo;/g, '')}
                                                        </span>
                                                    </PaginationItem>
                                                );
                                            }

                                            if (isPrevious) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationPrevious href={link.url} />
                                                    </PaginationItem>
                                                );
                                            }

                                            if (isNext) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationNext href={link.url} />
                                                    </PaginationItem>
                                                );
                                            }

                                            return (
                                                <PaginationItem key={index}>
                                                    <PaginationLink
                                                        href={link.url}
                                                        isActive={link.active}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                </PaginationItem>
                                            );
                                        })}
                                    </PaginationContent>
                                </Pagination>
                            </TableCaption>
                            <TableHeader className={'w-[100px]'}>
                                <TableRow>
                                    <TableHead className={'text-center'}>Lot/Titre</TableHead>
                                    <TableHead className={'text-center'}>Demandeur</TableHead>
                                    <TableHead className={'text-center'}>Situation</TableHead>
                                    <TableHead className={'text-center'}>Fokontany</TableHead>
                                    <TableHead className={'text-center'}>Nom Propriétaire</TableHead>
                                    <TableHead className={'text-center'}>Superficie</TableHead>
                                    <TableHead className={'text-center'}>Nature</TableHead>
                                    <TableHead className={'text-center'}>Vocation</TableHead>
                                    <TableHead className={'text-center'}>Type opération</TableHead>
                                    <TableHead className={'text-center'}>Consort</TableHead>
                                    <TableHead className={'text-center'}>Prix Total</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                                            Aucun document trouvé
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.data.map((document) => (
                                        <TableRow 
                                            key={document.id} 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setSelectedDocument(document)}
                                        >
                                            <TableCell className={'text-center'}>
                                                {document.propriete.lot}/ TNº{document.propriete.titre}
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                {document.demandeur.nom_demandeur} {document.demandeur.prenom_demandeur}
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                {document.propriete.situation}
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                {dossier.fokontany}
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                {document.propriete.proprietaire}
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                {document.propriete.contenance} m²
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                                                    {document.propriete.nature}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                                                    {document.propriete.vocation}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={'text-center capitalize'}>
                                                {document.propriete.type_operation}
                                            </TableCell>
                                            <TableCell className={'text-center'}>
                                                {document.status_consort ? (
                                                    <Badge variant="secondary">Avec</Badge>
                                                ) : (
                                                    <span className="text-gray-500">Sans</span>
                                                )}
                                            </TableCell>
                                            <TableCell className={'text-center font-semibold'}>
                                                {document.total_prix.toLocaleString()} Ar
                                            </TableCell>
                                            <TableCell className={'text-center'} onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Ellipsis className={'h-4 w-4'}/>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setSelectedDocument(document)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Voir détails
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <a href={route('download.CSF', document.id)} className={'flex items-center'}>
                                                                <FileCheck className="mr-2 h-4 w-4" />
                                                                Exporter CSF
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <a href={route('document.download', document.id)} className={'flex items-center'}>
                                                                <FileOutput className="mr-2 h-4 w-4" />
                                                                Exporter ADV
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-500"
                                                            onClick={() => {handleArchive(document.id);}}
                                                        >
                                                            <Archive className="mr-2 h-4 w-4" />
                                                            Archiver
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Dialog détails du document */}
            <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
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
                            <div>
                                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Informations de la propriété
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Propriétaire</p>
                                        <p className="font-medium">{selectedDocument.propriete.proprietaire}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Contenance</p>
                                        <p className="font-medium">{selectedDocument.propriete.contenance} m²</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nature</p>
                                        <p className="font-medium">{selectedDocument.propriete.nature}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Vocation</p>
                                        <p className="font-medium">{selectedDocument.propriete.vocation}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">Situation</p>
                                        <p className="font-medium">{selectedDocument.propriete.situation}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Informations Demandeur */}
                            <div>
                                <h4 className="font-semibold text-lg mb-3">Informations du demandeur</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">CIN</p>
                                        <p className="font-medium font-mono">{selectedDocument.demandeur.cin}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Sexe</p>
                                        <p className="font-medium">{selectedDocument.demandeur.sexe}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Occupation</p>
                                        <p className="font-medium">{selectedDocument.demandeur.occupation}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Domiciliation</p>
                                        <p className="font-medium">{selectedDocument.demandeur.domiciliation}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Téléphone</p>
                                        <p className="font-medium">{selectedDocument.demandeur.telephone || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Situation familiale</p>
                                        <p className="font-medium">{selectedDocument.demandeur.situation_familiale}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button asChild variant="outline">
                                    <a href={route('download.CSF', selectedDocument.id)}>
                                        <FileCheck className="mr-2 h-4 w-4" />
                                        Télécharger CSF
                                    </a>
                                </Button>
                                <Button asChild>
                                    <a href={route('document.download', selectedDocument.id)}>
                                        <FileOutput className="mr-2 h-4 w-4" />
                                        Télécharger ADV
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}