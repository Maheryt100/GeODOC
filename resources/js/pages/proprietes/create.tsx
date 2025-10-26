import AppLayout from '@/layouts/app-layout';
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BreadcrumbItem, Dossier } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export default function Create(){
    const { dossier } = usePage<{ dossier: Dossier }>().props;

    const dossierType = dossier.type;

    const {data, setData, post} = useForm({
        id_dossier: dossier.id,
        lot: '',
        propriete_mere: '',
        titre: '',
        titre_mere: '',
        proprietaire: '',
        contenance: '',
        charge: '',
        situation: '',
        nature: '',
        numero_FN: '',
        numero_requisition: '',
        date_requisition: '',
        date_inscription: '',
        dep_vol: '',
    });
    useEffect(() => {
        if (dossierType === 'immatriculation') {
            setData('propriete_mere', '');
            setData('titre_mere', '');
        }
    }, [dossierType]);

    const handleSubmit = (e: React.FormEvent) =>{
        e.preventDefault();
        if(data.nature == ''){
            toast.warning('Veuillez séléctionner la nature du propriété')
            return;
        }

        //console.log(data);
        post(route('proprietes.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation: ', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Formulaire envoyé avec succès !');
            },
        });
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
        {
            title: 'Insertion',
            href: '#',
        },
    ];
    return(
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster richColors position="top-right" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <form onSubmit={handleSubmit}>
                        <div className={'mt-15'}>
                            <div className={'my-auto mx-5'}>
                                <Select onValueChange={(e) => setData('nature', e)} required >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Nature" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="edilitaire">Edilitaire</SelectItem>
                                        <SelectItem value="agricole">Agricole</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                { dossierType == 'morcellement' && (
                                    <div className={'w-full '}>
                                        <Label>Propriété mère</Label>
                                        <Input type={'text'} value={data.propriete_mere}
                                               onChange={(e) => setData('propriete_mere', e.target.value)}
                                        />
                                    </div>
                                )}
                                { dossierType == 'morcellement' && (
                                    <div className={'w-full'}>
                                        <Label>Titre mère</Label>
                                        <Input type={'text'}
                                               value={data.titre_mere}
                                               onChange={(e) => setData('titre_mere', e.target.value)}
                                               placeholder={"12.54-B"}
                                        />
                                    </div>
                                )}
                                <div className={`${dossierType == 'morcellement' ? 'w-full' : 'w-1/4'}`}>
                                    <Label>Titre</Label>
                                    <Input type={'text'}
                                           onChange={(e) => setData('titre', e.target.value)}
                                           placeholder={"54.21-A"}
                                    />
                                </div>

                                <div className={`${dossierType == 'morcellement' ? 'w-full' : 'w-1/4'}`}>
                                    <Label>Nom propriété / Propriétaire</Label>
                                    <Input type={'text'} onChange={(e) => setData('proprietaire', e.target.value)}/>
                                </div>
                            </div>

                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Lot</Label>
                                    <Input type='text'
                                           onChange={(e) => setData('lot', e.target.value)}
                                           required
                                           placeholder={"T 45"}
                                    />
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Numero FNº</Label>
                                    <Input type={'text'}
                                           onChange={(e) => setData('numero_FN', e.target.value)}
                                           placeholder={"78-A/25"}
                                    />
                                </div>
                                { dossierType == 'immatriculation' && (
                                    <div className={'w-full md:w-1/4'}>
                                        <Label>Nº Requisition</Label>
                                        <Input type={'text'} value={data.numero_requisition}
                                               onChange={(e) => setData('numero_requisition', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Contenance</Label>
                                    <Input type={'number'} min={1} placeholder={'en m²'} onChange={(e) => setData('contenance', e.target.value)} />
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Charge</Label>
                                    <Input type={'text'} onChange={(e) => setData('charge', e.target.value)}/>
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Situation (sise à)</Label>
                                    <Input type={'text'} onChange={(e) => setData('situation', e.target.value)}/>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 m-5">
                                <div className="w-full md:w-1/4">
                                    <Label>date inscription</Label>
                                    <Input
                                        type="date"
                                        onChange={(e) => setData('date_inscription', e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <div className="w-full md:w-1/4">
                                    <Label>date requisition</Label>
                                    <Input
                                        type="date"
                                        onChange={(e) => setData('date_requisition', e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Dep Vol</Label>
                                    <Input type={'text'} onChange={(e) => setData('dep_vol', e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        <div className={'flex justify-end mx-10 mt-10'}>
                            <Button type={'submit'} className={'w-[200px]'}>Valider</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
