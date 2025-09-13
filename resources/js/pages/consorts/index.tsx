
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Archive, Ellipsis, Eye, Pencil } from 'lucide-react';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Consorts',
        href: '/consorts',
    },
];

export default function Index() {
    //const { flash } = usePage().props as { flash: { demandeur?: any; allConsorts: any } };
    const { data, setData, post} = useForm({
        cin: ''
    });
    const { demandeur, allConsorts } = usePage().props as {
        demandeur?: any;
        allConsorts?: Array;
    };
    //console.log(allConsorts?.length);

    const handleCin = (e: React.FormEvent) => {
        e.preventDefault();
        post('search',{
            onSuccess: (page) => {
                const { demandeur, allConsorts } = page.props as {
                    demandeur?: any;
                    allConsorts?: any;
                };
                //console.log(allConsorts.length);
            }
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consorts" />
            <Toaster position={'top-right'} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <form onSubmit={handleCin} >
                    <div className={'w-1/4 flex gap-6'}>
                        <Input type={'search'}
                               onChange={(e) => setData('cin', e.target.value)}
                               placeholder={'CIN demandeur principale....'}
                               maxLength={12}
                               minLength={12}
                        />
                        <Button type={'submit'} disabled={data.cin == ""}>
                            Rechercher
                        </Button>
                    </div>
                </form>
                <div>
                    {demandeur && (
                        <div>
                            <Label className={'pb-1 border-b-2'}>Demandeur principale :</Label>
                            <div className={'flex mx-5 my-2'}>
                                {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                            </div>
                        </div>

                    )}
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <Table>
                        <TableCaption>Liste de consorts</TableCaption>
                        <TableHeader>

                            <TableRow>
                                <TableHead className={'text-center'}>Titre</TableHead>
                                <TableHead className={'text-center'}>Nom complet</TableHead>
                                <TableHead className={'text-center'}>CIN</TableHead>
                                <TableHead className={'text-center'}>Téléphone</TableHead>
                                <TableHead className={'text-center'}>Action</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allConsorts && allConsorts.length > 0 ? (
                                allConsorts.map((consort: any, index: number) => (
                                    <TableRow key={index} className="text-center">
                                        <TableCell>{consort.titre_demandeur}</TableCell>
                                        <TableCell>{consort.nom_demandeur} {consort.prenom_demandeur}</TableCell>
                                        <TableCell>{consort.cin}</TableCell>
                                        <TableCell>{consort.telephone}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Ellipsis className={'opacity-50'}/>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem
                                                    >
                                                        <Link href={`documents/${document.id}/show`} className={'w-full flex gap-2 items-center'}>
                                                            <Eye/>
                                                            Voir
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Link href={`documents/${document.id}/edit`} className={'w-full flex gap-2 items-center'}>
                                                            <Pencil/>
                                                            Modifier
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {handleArchive(document.id);
                                                        }}
                                                    >
                                                        <Archive/>
                                                        Archiver
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        Aucun consort trouvé
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
