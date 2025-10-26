import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { BreadcrumbItem, Dossier, SharedData } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export default function Create(){
    const { dossier } = usePage<{
        dossier: Dossier;
    }>().props;

    const{data, setData, post} = useForm({
        'titre_demandeur': '',
        'nom_demandeur': '',
        'prenom_demandeur': '',
        'date_naissance': '',
        'lieu_naissance': '',
        'sexe': '',
        'occupation': '',
        'nom_pere': '',
        'nom_mere': '',
        'cin': '',
        'date_delivrance': '',
        'lieu_delivrance': '',
        'date_delivrance_duplicata': '',
        'lieu_delivrance_duplicata': '',
        'domiciliation': '',
        'nationalite': '',
        'situation_familiale': '',
        'regime_matrimoniale': '',
        'date_mariage': '',
        'lieu_mariage': '',
        'marie_a': '',
        'telephone': '',
        'id_dossier': dossier.id,
    });

    useEffect(() => {
        if (data.situation_familiale != "Marié(e)"){
            setData('marie_a', '');
            setData('date_mariage', '');
            setData('lieu_mariage', '');
        }
    }, [data.situation_familiale]);
    const handleTitre = (value: string) =>{
        setData('titre_demandeur', value);
        setData('sexe', value === 'Monsieur' ? 'Homme' : 'Femme');
    }
    const handleSubmit = (e: React.FormEvent)=>{
        e.preventDefault();
        console.log(data);

        const cin = data.cin;
        const cinIsValid = /^\d+$/.test(cin);

        if (!cinIsValid) {
            toast.error("Le CIN ne doit contenir que des chiffres (pas de lettres ni de caractères spéciaux).");
            return;
        }
        if (data.id_dossier == 0){
            toast.error('Veuillez séléctionner un dossier!');
            return;
        }
        post(route('demandeurs.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error(messages);
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
                            <Link href={route('dossiers.list', dossier.id)}>Liste document</Link>
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster position={'top-right'}/>
            <Head title={'Insertion Demandeur'}/>
            <div className="relative mt-2 min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-3">
                <form onSubmit={handleSubmit} >
                    <div className={'border rounded-md p-6'}>
                            <div className={'flex w-3/4 flex-col md:flex-row my-3 gap-4 justify-center'}>
                                <div className={'w-1/3'}>
                                    <Label>Titre</Label>
                                    <Select
                                        required
                                        value={data.titre_demandeur}
                                        onValueChange={(e) => handleTitre(e)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={'Titre Demandeur'}/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={'Monsieur'}>Monsieur</SelectItem>
                                                <SelectItem value={'Madame'}>Madame</SelectItem>
                                                <SelectItem value={'Mademoiselle'}>Mademoiselle</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={'w-full'}>
                                    <Label>Nom</Label>
                                    <Input type={'text'}
                                           value={data.nom_demandeur}
                                           onChange={(e) => setData('nom_demandeur',e.target.value)}
                                           placeholder={'John'}
                                           required
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Prénom</Label>
                                    <Input type={'text'}
                                           value={data.prenom_demandeur}
                                           onChange={(e) => setData('prenom_demandeur',e.target.value)}
                                           placeholder={'Doe'}
                                    />
                                </div>
                            </div>
                            <div className={'flex w-1/2 my-8 flex-col md:flex-row gap-4'}>
                                <div className={'w-full'}>
                                    <Label>Date de naissance</Label>
                                    <Input type={'date'}
                                       value={data.date_naissance}
                                       onChange={(e) => setData('date_naissance', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Lieu de naissance</Label>
                                    <Input type={'text'}
                                       value={data.lieu_naissance}
                                        onChange={(e) => setData('lieu_naissance', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <input type="hidden" value={data.sexe} />
                            <div className={'w-1/2'}>
                                <Label>CIN</Label>
                                <InputOTP maxLength={12} minLength={12}
                                          value={data.cin}
                                          onChange={(value) => setData('cin',value)}
                                          required
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0}/>
                                        <InputOTPSlot index={1}/>
                                        <InputOTPSlot index={2}/>
                                    </InputOTPGroup>
                                    <InputOTPSeparator/>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3}/>
                                        <InputOTPSlot index={4}/>
                                        <InputOTPSlot index={5}/>
                                    </InputOTPGroup>
                                    <InputOTPSeparator/>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={6}/>
                                        <InputOTPSlot index={7}/>
                                        <InputOTPSlot index={8}/>
                                    </InputOTPGroup>
                                    <InputOTPSeparator/>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={9}/>
                                        <InputOTPSlot index={10}/>
                                        <InputOTPSlot index={11}/>
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            <div className={'flex flex-col w-full md:flex-row gap-4 my-8'}>
                                <div className={'w-full'}>
                                    <Label>Date Délivrance</Label>
                                    <Input type={'date'}
                                        onChange={(e) => setData('date_delivrance', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Lieu Délivrance</Label>
                                    <Input type={'text'}
                                        onChange={(e) => setData('lieu_delivrance', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Date Délivrance Duplicata</Label>
                                    <Input type={'date'}
                                           onChange={(e) => setData('date_delivrance_duplicata', e.target.value)}
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Lieu Délivrance Duplicata</Label>
                                    <Input type={'text'}
                                           onChange={(e) => setData('lieu_delivrance_duplicata', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={'flex flex-col w-3/4 md:flex-row gap-4 my-8'}>
                                <div className={'w-full'}>
                                    <Label>Occupation</Label>
                                    <Input type={'text'}
                                        onChange={(e)=>setData('occupation', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Domiciliation</Label>
                                    <Input type={'text'}
                                           onChange={(e)=>setData('domiciliation', e.target.value)}
                                           required
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Téléphone</Label>
                                    <Input type={'text'}
                                           onChange={(e)=>setData('telephone', e.target.value)}
                                           maxLength={10}
                                    />
                                </div>
                            </div>
                            <div className={'flex flex-col w-1/2 md:flex-row gap-4 my-8'}>
                                <div className={'w-1/3'}>
                                    <Label>Situation Familiale</Label>
                                    <Select
                                        required
                                        onValueChange={(e) => setData('situation_familiale', e)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={'Situation Familiale'}/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={'Célibataire'}>Célibataire</SelectItem>
                                                <SelectItem value={'Marié(e)'}>Marié(e)</SelectItem>
                                                <SelectItem value={'Veuf/Veuve'}>Veuf/Veuve</SelectItem>
                                                <SelectItem value={'Divorcé(e)'}>Divorcé(e)</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={'w-1/3'}>
                                    <Label>Régime matrimonial</Label>
                                    <Select
                                        onValueChange={(e) => setData('regime_matrimoniale', e)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={'Régime Matrimonial'}/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={'zara-mira'}>Zara-Mira</SelectItem>
                                                <SelectItem value={'kitay telo an-dalana'}>kitay telo an-dalana</SelectItem>
                                                <SelectItem value={'Séparations des biens'}>Séparations des biens</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Nationalité</Label>
                                    <Input type={'text'}
                                           onChange={(e)=>setData('nationalite',e.target.value)}
                                           required
                                    />
                                </div>
                            </div>
                            <div className={'flex flex-col w-1/2 md:flex-row gap-4 my-8'}>
                                <div className={'w-full'}>
                                    <Label>Nom Complet Père</Label>
                                    <Input type={'text'}
                                        onChange={(e)=>setData('nom_pere',e.target.value)}
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Nom Complet Mère</Label>
                                    <Input type={'text'}
                                           onChange={(e)=>setData('nom_mere',e.target.value)}
                                    />
                                </div>
                            </div>
                            {data.situation_familiale== "Marié(e)" &&(
                                <div className={'flex flex-col w-3/4 md:flex-row gap-4 my-8'}>
                                    <div className={'w-full'}>
                                        <Label>Marié(e) à</Label>
                                        <Input type={'text'}
                                               onChange={(e)=>setData('marie_a',e.target.value)}
                                        />
                                    </div>
                                    <div className={'w-full'}>
                                        <Label>Date de Mariage</Label>
                                        <Input type={'date'}
                                               onChange={(e)=>setData('date_mariage',e.target.value)}
                                        />
                                    </div>
                                    <div className={'w-full'}>
                                        <Label>Lieu de Mariage</Label>
                                        <Input type={'text'}
                                               onChange={(e)=>setData('lieu_mariage',e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="text-right">
                                <Button type="submit">Valider</Button>
                            </div>
                        </div>
                </form>
            </div>
        </AppLayout>
    );
}
