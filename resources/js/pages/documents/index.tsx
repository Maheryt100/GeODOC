import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Demander, Dossier, Paginated } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Archive, ChevronDown, Ellipsis, FileCheck, FileOutput, FolderPlus } from 'lucide-react';
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


export default function Index() {
    const { documents } = usePage<{documents: Paginated<Demander>}>().props;
    const { dossier } = usePage<{ dossier: Dossier }>().props;
    const [search, setSearch] = useState('');

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
            <Toaster className={'opacity-50'} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className={"flex mx-5 gap-6 md:gap-0 flex-col md:flex-row justify-between"}>
                    <Input
                        placeholder="Recherche.."
                        className="max-w-3xs"
                        value={search}
                        onChange={handleSearch}
                    />
                    <Button asChild className={"max-w-40"}>
                        <Link href={route("lier.document", dossier.id)}>
                            <FolderPlus/>
                            Lier un document
                        </Link>
                    </Button>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className={'mt-5 mx-10 flex justify-center md:justify-end'}>
                        <a href={route('export.list', dossier.id)}>
                            <Button>
                                <FileOutput/>
                                Exporter les données
                            </Button>
                        </a>
                    </div>
                    <div className={'m-10 border rounded-md'}>
                        <Table>
                            <TableCaption>Liste des Documents</TableCaption>
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
                                {documents.data.map((document) => (
                                    <TableRow key={document.id}>
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
                                            <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
                                                {document.propriete.nature}
                                            </span>
                                        </TableCell>
                                        <TableCell className={'text-center'}>
                                            <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs">
                                                {document.propriete.vocation}
                                            </span>
                                        </TableCell>
                                        <TableCell className={'text-center capitalize'}>
                                            {document.propriete.type_operation}
                                        </TableCell>
                                        <TableCell className={'text-center'}>
                                            {document.status_consort ? (
                                                <span className="text-orange-600 font-medium">Avec</span>
                                            ) : (
                                                <span className="text-gray-500">Sans</span>
                                            )}
                                        </TableCell>
                                        <TableCell className={'text-center font-semibold'}>
                                            {document.total_prix.toLocaleString()} Ar
                                        </TableCell>
                                        <TableCell className={'text-center'}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Ellipsis className={'opacity-50'}/>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>
                                                        <a href={route('download.CSF', document.id)} className={'w-full flex gap-2 items-center'}>
                                                            <FileCheck/>
                                                            Exporter CSF
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <a href={route('document.download', document.id)} className={'w-full flex gap-2 items-center'}>
                                                            <FileOutput/>
                                                            Exporter ADV
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {handleArchive(document.id);}}
                                                    >
                                                        <Archive/>
                                                        Archiver
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}