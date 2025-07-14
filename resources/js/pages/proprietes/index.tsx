import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Ellipsis, Eye, MapPinPlus, Pencil, Trash } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Pagination,
    PaginationContent, PaginationEllipsis,
    PaginationItem,
    PaginationLink, PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { useEffect } from 'react';
import { toast } from 'sonner';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Propriété',
        href: '/proprietes',
    },
];

export default function Index( { propriete }) {
    const proprietes = propriete.data;
    console.log(propriete.data);
    const { delete: destroy } = useForm();
    const { message } = usePage().props as { message?: string };
    const handleDelete = (id: number) => {
        console.log(id);
        if(confirm('voulez vous vraiment supprimer ce propriété ? ')){
            destroy(route(`proprietes.destroy`, id));
        }
    }

    useEffect(() => {
        if (message) {
            toast.success(message); // ou toast.error, selon le message
        }
    }, [message]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Propriété liste" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div>
                    <Button asChild>
                        <Link href="/proprietes/create">
                            <MapPinPlus />
                            Inserer Propriété
                        </Link>
                    </Button>
                </div>

                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className={'m-10 border rounded-md'}>
                        <Table>
                            <TableCaption>Liste des Propriétés</TableCaption>
                            <TableCaption>
                                <Pagination>
                                    <PaginationContent>
                                        {propriete.links.map((link: any, index: number) => {
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
                                    <TableHead className={'text-center'}>Lot</TableHead>
                                    <TableHead className={'text-center'}>Titre</TableHead>
                                    <TableHead className={'text-center'}>Contenance</TableHead>
                                    <TableHead className={'text-center'}>Nom Propriété</TableHead>
                                    <TableHead className={'text-center'}>Nature</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proprietes.map((propriete) => (
                                    <TableRow key={propriete.id}>
                                        <TableCell className={'text-center'}>{propriete.lot}</TableCell>
                                        <TableCell className={'text-center'}>{propriete.titre}</TableCell>
                                        <TableCell className={'text-center'}>{propriete.contenance}</TableCell>
                                        <TableCell className={'text-center'}>{propriete.proprietaire}</TableCell>
                                        <TableCell className={'text-center'}>{propriete.nature}</TableCell>
                                        <TableCell className={'text-center'}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Ellipsis className={'opacity-50'}/>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem
                                                    >
                                                        <Link href={`proprietes/${propriete.id}/show`} className={'w-full flex gap-2 items-center'}>
                                                            <Eye/>
                                                            Voir
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Link href={`proprietes/${propriete.id}/edit`} className={'w-full flex gap-2 items-center'}>
                                                            <Pencil/>
                                                            Modifier
                                                        </Link>
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
