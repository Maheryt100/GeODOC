// import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Ellipsis, Eye, Pencil, Trash, UserPlus } from 'lucide-react';
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
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Demandeurs',
        href: '/demandeurs',
    },
];
export default function Index({demandeur}) {
    const demandeurs = demandeur.data;
    const { flash } = usePage().props;
    const { delete: destroy } = useForm();

    useEffect (() => {
        if (flash.message !== null){
            toast.success(flash.message);
        }
    },[flash])
    const handleDelete = async (id:number) => {
        if(confirm('voulez vous vraiment supprimer cette Demandeur? ')){
            destroy(route('demandeurs.destroy', id));
        }
    }
    console.log(demandeurs);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <Toaster position={'top-right'}/>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div>
                    <Button asChild>
                        <Link href="/demandeurs/create">
                            <UserPlus/>
                            Inserer Demandeur
                        </Link>
                    </Button>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div>
                        <Table>
                            <TableCaption>Liste des Demandeur</TableCaption>
                            <TableCaption>
                                <Pagination>
                                    <PaginationContent>
                                        {demandeur.links.map((link: any, index: number) => {
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
                                    <TableHead className={'text-center'}>Titre</TableHead>
                                    <TableHead className={'text-center'}>Nom</TableHead>
                                    <TableHead className={'text-center'}>CIN</TableHead>
                                    <TableHead className={'text-center'}>Domiciliation</TableHead>
                                    <TableHead className={'text-center'}>Situation Familiale</TableHead>
                                    <TableHead className={'text-center'}>Téléphone</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {demandeurs.map((demandeur) => (
                                    <TableRow key={demandeur.id}>
                                        <TableCell className={'text-center'}>{demandeur.titre_demandeur}</TableCell>
                                        <TableCell className={'text-center'}>{demandeur.nom_demandeur} {demandeur.prenom_demandeur}</TableCell>
                                        <TableCell className={'text-center'}>{demandeur.cin}</TableCell>
                                        <TableCell className={'text-center'}>{demandeur.domiciliation}</TableCell>
                                        <TableCell className={'text-center'}>{demandeur.situation_familiale}</TableCell>
                                        <TableCell className={'text-center'}>{demandeur.telephone}</TableCell>
                                        <TableCell className={'text-center'}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Ellipsis className={'opacity-50'}/>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem
                                                    >
                                                        <Link href={`demandeurs/${demandeur.id}/show`} className={'w-full flex gap-2 items-center'}>
                                                            <Eye/>
                                                            Voir
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Link href={`demandeurs/${demandeur.id}/edit`} className={'w-full flex gap-2 items-center'}>
                                                            <Pencil/>
                                                            Modifier
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className={'text-red-500'}
                                                        onClick={() => {handleDelete(demandeur.id);
                                                        }}
                                                    >
                                                        <Trash className={'text-red-500'}/>
                                                        Supprimer
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
