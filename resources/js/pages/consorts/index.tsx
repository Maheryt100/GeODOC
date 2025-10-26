
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Demandeur, Demandeurs } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Input } from '@/components/ui/input';
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
        demandeur?: Demandeur;
        allConsorts?: Demandeurs;
    };
    //console.log(allConsorts?.length);

    const handleCin = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('consorts.search'));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consorts" />
            <Toaster position={'top-right'} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <form onSubmit={handleCin} className='w-1/4'>
                    <div className={'flex flex-col md:flex-row space-x-8 space-y-4'}>
                        <Input type={'search'}
                               onChange={(e) => setData('cin', e.target.value)}
                               placeholder={'CIN demandeur principale....'}
                               maxLength={12}
                               minLength={12}
                               className={'min-w-[200px]'}
                        />
                        <Button type={'submit'} disabled={data.cin == ""} className='min-w-[200px]'>
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
                                <TableHead className={'text-center'}></TableHead>
                                <TableHead className={'text-center'}>Titre</TableHead>
                                <TableHead className={'text-center'}>Nom complet</TableHead>
                                <TableHead className={'text-center'}>CIN</TableHead>
                                <TableHead className={'text-center'}>Téléphone</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allConsorts && allConsorts.length > 0 ? (
                                allConsorts.map((consort: Demandeur, index: number) => (
                                    <TableRow key={index} className="text-center">
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{consort.titre_demandeur}</TableCell>
                                        <TableCell>{consort.nom_demandeur} {consort.prenom_demandeur}</TableCell>
                                        <TableCell>{consort.cin}</TableCell>
                                        <TableCell>{consort.telephone}</TableCell>
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
