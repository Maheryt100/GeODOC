import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Demandeur, Dossier, Paginated, SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Ellipsis, Eye, Pencil, Trash, UserPlus, UserRoundSearch } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';


export default function Index() {
    const { demandeurs } = usePage<{demandeurs: Paginated<Demandeur> }>().props;
    const { dossier } = usePage<{
        dossier: Dossier;
    }>().props;

    const { flash } = usePage<SharedData>().props;
    const { delete: destroy } = useForm();
    const [cin, setCin] = useState("");
    const [search, setSearch] = useState("");

    useEffect (() => {

        if (flash.message !== null){
            toast.info(flash.message);
        }
    },[flash]);

    const handleDelete = async (id:number) => {
        if(confirm('voulez vous vraiment supprimer cette Demandeur? ')){
            destroy(route('demandeurs.destroy', { dossier: dossier.id, demandeur: id }));
        }
    }
    const [filter, setFilter] = useState("");

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>{
        setSearch(e.target.value);

        router.get(route('demandeurs.search', dossier.id), {
            search: e.target.value
        }, {
            preserveState: true,
            replace: true,
        });
    }
    const handleSearchCin= (e: React.FormEvent) =>{
        e.preventDefault();
        const cinIsValid = /^\d+$/.test(cin);
        if(!cinIsValid){
            toast.warning("CIN invalide, le CIN doit comporter que 12 chiffres!");
            return;
        }
        router.post(route('demandeurs.searchCin'),{
            id_dossier: dossier.id,
            cin: cin
        })
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
                        Demandeurs
                        <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.demandeurs', dossier.id)}>Demandeurs</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.proprietes', dossier.id)}>Proprietes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={route('dossiers.list', dossier.id)}>Documents</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            href: route('dossiers.proprietes', dossier.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <Toaster position={'top-right'}/>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className={"w-full flex justify-between bo mt-6 px-5"}>
                    <div className="flex flex-col md:flex-row">
                        <Input type={'text'}
                               placeholder={"Recherche..."}
                               value={search}
                               onChange={handleSearch}
                               maxLength={30}
                               className="min-w-[200px]"
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <Dialog>

                            <DialogTrigger asChild>
                                <Button>
                                    <UserRoundSearch/>
                                    Demandeur Existant
                                </Button>
                            </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <form onSubmit={handleSearchCin}>
                                        <DialogHeader>
                                            <DialogTitle>Recherche par CIN</DialogTitle>
                                            <DialogDescription>
                                                Rechercher un demandeur dans un autre dossier par CIN pour l'insérer dans ce dossier.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 mb-3.5">
                                            <div className="grid gap-3">
                                                <Label htmlFor="cin">CIN</Label>
                                                <Input id="cin"
                                                       name="cin"
                                                       minLength={12}
                                                       maxLength={12}
                                                       onChange={(e) => setCin(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="submit">Rechercher</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                        </Dialog>
                        <Button asChild>
                            <Link href={route("demandeurs.create", dossier.id)}>
                                <UserPlus/>
                                Inserer un demandeur
                            </Link>
                        </Button>
                    </div>
                </div>
                {dossier && (
                    <div className={"m-3"}>
                        <div >
                            <p>Dossier: <strong>{dossier.nom_dossier}</strong></p>
                        </div>
                    </div>
                )}
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className={'m-6 border rounded-md'}>
                        <Table>
                            <TableCaption>Liste des Demandeur</TableCaption>
                            <TableCaption>
                                <Pagination>
                                    <PaginationContent>
                                        {demandeurs.links.map((link, index: number) => {
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
                                {demandeurs.data.map((demandeur) => (
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
                                                        <Link href={route('demandeurs.edit', {dossier: dossier.id, demandeur: demandeur.id})}
                                                              className={'w-full flex gap-2 items-center'}>
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
