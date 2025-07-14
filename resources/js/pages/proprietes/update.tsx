import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function Update({propriete}){
    const { district: districts } = usePage().props;
    const [districtOpen, setDistrictOpen] = useState(false);
    const [circonscriptionOpen, setCirconscriptionOpen] = useState(false);
    const [districtName, setDistrictName] = useState("");
    const [circonscriptionName, setCirconscriptionName] = useState("");
    const { data, setData, put } = useForm({
        id_district: propriete.id_district ?? '',
        commune: propriete.commune ?? '',
        quartier: propriete.quartier ?? '',
        lot: propriete.lot ?? '',
        propriete_mere: propriete.propriete_mere ?? '',
        titre: propriete.titre ?? '',
        proprietaire: propriete.proprietaire ?? '',
        type: propriete.type ?? '',
        contenance: propriete.contenance ?? '',
        charge: propriete.charge ?? '',
        situation: propriete.situation ?? '',
        circonscription: propriete.circonscription ?? '',
        nature: propriete.nature ?? '',
    });

    useEffect(() => {
        if (data.type === 'immatriculation') {
            setData('propriete_mere', '');
        }
    }, [data.type]);
    const handleSubmit = (e: React.FormEvent) =>{
        e.preventDefault();
        if(data.id_district == ''){
            toast.error('Veuillez séléctionner un district')
            return;
        }else if(data.type == ''){
            toast.error('Veuillez séléctionner le type du propriété. Immatriculation ou Morcellement');
            return;
        }else if(data.nature == ''){
            toast.warning('Veuillez séléctionner la nature du propriété')
            return;
        }

        // console.log(data);
        put(route('proprietes.update', propriete.id), {
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
    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Formulaire Propriété',
                    href: '/propriete/create',
                },
            ]}
        >
            <Head title={'update'}/>
            <Toaster richColors position="top-right" />
            <Breadcrumb className={'m-5'}>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/proprietes">Propriété</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Modification</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <form onSubmit={handleSubmit}>

                        <div className={'flex flex-col md:flex-row gap-6 justify-center'}>
                            <div className={'m-5 w-full'}>
                                <RadioGroup value={data.type} onValueChange={(e) => setData('type', e)}  className={'flex'}>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="morcellement" id="r1" />
                                        <Label htmlFor="r1" className={'hover:cursor-pointer'}>Morcellement</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="immatriculation" id="r2"/>
                                        <Label htmlFor="r2" className={'hover:cursor-pointer'}>Immatriculation</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className={'my-auto w-full'}>
                                <Select value={data.nature} onValueChange={(e) => setData('nature', e)} required >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Nature" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="edilitaire">Edilitaire</SelectItem>
                                        <SelectItem value="agricole">Agricole</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className={'my-auto w-full'}>
                                <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={'outline'}
                                            role={'combobox'}
                                            aria-expanded={districtOpen}
                                            className={'w-[200px]'}
                                        >
                                            { districtName || "District"}
                                            <ChevronsUpDown className={'opacity-50'}/>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un district" className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>Aucun district ne correspond</CommandEmpty>
                                                <CommandGroup>
                                                    { districts.map((district) => (
                                                        <CommandItem
                                                            key={district.id}
                                                            value={district.nom_district}
                                                            onSelect={() => {
                                                                setDistrictName(district.nom_district);
                                                                setCirconscriptionName(district.nom_district);
                                                                setData('id_district', district.id);
                                                                setData('circonscription', district.nom_district);
                                                                setDistrictOpen(false);
                                                            }}
                                                        >
                                                            {district.nom_district}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    districtName === district.nom_district ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className={'my-auto w-full'}>
                                <Popover open={circonscriptionOpen} onOpenChange={setCirconscriptionOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={'outline'}
                                            role={'combobox'}
                                            aria-expanded={circonscriptionOpen}
                                            className={'w-[200px]'}
                                        >
                                            {circonscriptionName || "Circonscription"}
                                            <ChevronsUpDown className={'opacity-50'}/>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un district" className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>Aucun district ne correspond</CommandEmpty>
                                                <CommandGroup>
                                                    { districts.map((district) => (
                                                        <CommandItem
                                                            key={district.id}
                                                            value={district.nom_district}
                                                            onSelect={() => {
                                                                setCirconscriptionName(district.nom_district);
                                                                setData('circonscription', district.nom_district);
                                                                setCirconscriptionOpen(false);
                                                            }}
                                                        >
                                                            {district.nom_district}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    circonscriptionName === district.nom_district ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className={'mt-15'}>
                            <div className={'flex flex-col md:flex-row gap-6 mx-5'}>
                                <div className={'w-full'}>
                                    <Label>Commune</Label>
                                    <Input type={'text'} value={data.commune ?? ''} onChange={(e) => setData('commune', e.target.value)} />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Fokotany</Label>
                                    <Input type={'text'} value={data.quartier ?? ''} onChange={(e) => setData('quartier', e.target.value)} />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Lot</Label>
                                    <Input type='text' value={data.lot} onChange={(e) => setData('lot', e.target.value)} required />
                                </div>
                            </div>

                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                <div className={'w-full '}>
                                    <Label>Propriété mère</Label>
                                    <Input type={'text'} value={data.type === 'morcellement' ? (data.propriete_mere ?? '') : ''}
                                           onChange={(e) => setData('propriete_mere', e.target.value)}
                                           disabled={data.type == 'immatriculation'}
                                    />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Titre</Label>
                                    <Input type={'text'} value={data.titre} onChange={(e) => setData('titre', e.target.value)} required />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Nom propriété / Propriétaire</Label>
                                    <Input type={'text'} value={data.proprietaire ?? ''} onChange={(e) => setData('proprietaire', e.target.value)}/>
                                </div>
                            </div>

                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                <div className={'w-full '}>
                                    <Label>Contenance</Label>
                                    <Input type={'number'} value={data.contenance ?? ''} min={1} placeholder={'en m²'} onChange={(e) => setData('contenance', e.target.value)} />
                                </div>
                                <div className={'w-full'}>
                                    <Label>Charge</Label>
                                    <Input type={'text'} value={data.charge ?? ''} onChange={(e) => setData('charge', e.target.value)}/>
                                </div>
                                <div className={'w-full'}>
                                    <Label>Situation</Label>
                                    <Input type={'text'} value={data.situation ?? ''} onChange={(e) => setData('situation', e.target.value)}/>
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
