import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Dossier, Paginated, Propriete, SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Download, Ellipsis, MapPinPlus, Pencil, Trash } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { Toaster } from '@/components/ui/sonner';

export default function Index() {
    const { proprietes } = usePage<{proprietes: Paginated<Propriete> }>().props;

    const { dossier } = usePage<{ dossier: Dossier; }>().props;
    const { delete: destroy } = useForm();
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState("");

    const handleDelete = (id: number) => {
        // console.log(id);
        if(confirm('voulez vous vraiment supprimer ce propriété ? ')){
            destroy(route(`proprietes.destroy`, id));
        }
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);

        router.get(route('proprietes.search', dossier.id), {
            search: e.target.value
        }, {
            preserveState: true,
            replace: true,
        });
    }

    useEffect(() => {
        if (flash.message != null) {
            toast.info(flash.message);
        }
    }, [flash.message]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: dossier.nom_dossier,
            href: '#',
        },
        {
            title: (
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
                        Propriétés
                        <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.proprietes', dossier.id)}>Proprietes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.demandeurs', dossier.id)}>Demandeurs</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.list', dossier.id)}>Liste</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            href: route('dossiers.proprietes', dossier.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Propriété liste" />
            <Toaster position={'top-right'}/>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className={"w-full flex justify-between mt-6 px-5"}>
                    <div className={"flex flex-col md:flex-row"}>
                        <Input type={'search'}
                               placeholder={'Recherche...'}
                               className="min-w-[200px]"
                               value={search}
                               onChange={handleSearch}
                        />
                    </div>
                    <Button asChild>
                        <Link href={route('proprietes.create', dossier.id)}>
                            <MapPinPlus />
                            Inserer Propriété
                        </Link>
                    </Button>
                </div>

                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className={'m-10 border rounded-md'}>
                        <Table>
                            <TableCaption>
                                <Pagination>
                                    <PaginationContent>
                                        {proprietes.links.map((link, index: number) => {
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
                                                        dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                                                    />
                                                </PaginationItem>
                                            );
                                        })}
                                    </PaginationContent>
                                </Pagination>
                            </TableCaption>
                            <TableCaption>Liste des Propriétés</TableCaption>
                            <TableHeader className={'w-[100px]'}>
                                <TableRow>
                                    <TableHead className={'text-center'}>Lot</TableHead>
                                    <TableHead className={'text-center'}>Titre</TableHead>
                                    <TableHead className={'text-center'}>Contenance</TableHead>
                                    <TableHead className={'text-center'}>Nom Propriété</TableHead>
                                    <TableHead className={'text-center'}>Nature</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proprietes.data.map((propriete) => (
                                    <TableRow key={propriete.id}>
                                        <TableCell className={'text-center'}>{propriete.lot}</TableCell>
                                        <TableCell className={'text-center'}>TNº{propriete.titre}</TableCell>
                                        <TableCell className={'text-center'}>{propriete.contenance} m²</TableCell>
                                        <TableCell className={'text-center'}>{propriete.proprietaire}</TableCell>
                                        <TableCell className={'text-center'}>{propriete.nature}</TableCell>
                                        <TableCell className={'text-center'}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Ellipsis className={'opacity-50'}/>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>
                                                        <Link href={route('proprietes.edit', propriete.id)} className={'w-full flex gap-2 items-center'}>
                                                            <Pencil/>
                                                            Modifier
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                    >
                                                        <a href={route('proprietes.requisition', { dossier: dossier.id, id: propriete.id })}
                                                           className={'w-full flex gap-2 items-center'}>
                                                            <Download/>
                                                            Réquisition
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className={'text-red-500'}
                                                        onClick={() => {handleDelete(propriete.id);
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
