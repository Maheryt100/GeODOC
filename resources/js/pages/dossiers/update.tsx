import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Dossier } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const breadcrumbs: BreadcrumbItem[]= [
    {
        title: 'Dossiers',
        href: '/dossiers',
    },
    {
        title: 'Modification',
        href: '/dossiers/update',
    },
]
export default function Update({dossier} : { dossier : Dossier }){

    const { district: districts } = usePage().props;

    const [districtOpen, setDistrictOpen] = useState(false);
    const [districtName, setDistrictName] = useState(
        districts.find(d => d.id === dossier.id_district)?.nom_district || ""
    );

    const [circonscriptionName, setCirconscriptionName] = useState(
        dossier.circonscription || ""
    );
    const [circonscriptionOpen, setCirconscriptionOpen] = useState(false);

    const {data, setData, post} = useForm({
        id_district: dossier.id_district,
        nom_dossier: dossier.nom_dossier,
        date_descente_debut: dossier.date_descente_debut,
        date_descente_fin: dossier.date_descente_fin,
        type_commune: dossier.type_commune,
        commune: dossier.commune,
        fokontany: dossier.fokontany,
        type: dossier.type,
        circonscription: dossier.circonscription,
    })

    const handleSubmit = (e:React.FormEvent) =>{
        e.preventDefault();
        console.log(data);
        post(route("dossiers.update", dossier.id),{
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error(messages);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={"Dossier formulaire"}/>
            <Toaster position={"top-right"}/>
            <div>
                <div className={"my-auto mx-4"}>
                    <form onSubmit={handleSubmit} className={"border-2 rounded-sm w-full md:w-3/4 mx-auto mt-6 p-10"}>
                        <div className={"flex flex-col md:flex-row justify-around"}>
                            <div className={"my-auto mx-auto md:mx-0"}>
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
                            <div className={"my-auto mx-auto md:mx-0"}>
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
                        <div className={"flex flex-col md:flex-row gap-6 m-5"}>
                            <div className={'w-full md:w-1/4'}>
                                <Label>Nom dossier</Label>
                                <Input type={'text'}
                                       onChange={(e)=>setData('nom_dossier',e.target.value)}
                                       value={data.nom_dossier}
                                       required
                                       placeholder={"Nom du dossier"}
                                       minLength={5}
                                />
                            </div>
                            <div className={"flex pt-6"}>
                                <RadioGroup onValueChange={(e) => setData('type', e)} value={data.type}  className={'flex'}>
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
                        </div>
                        <div className={"flex flex-col md:flex-row gap-6 m-5"}>
                            <div className={'w-full md:w-1/4'}>
                                <Label>Début date déscente</Label>
                                <Input type={'date'}
                                       onChange={(e)=>setData('date_descente_debut',e.target.value)}
                                       value={data.date_descente_debut}
                                       required
                                />
                            </div>
                            <div className={'w-full md:w-1/4'}>
                                <Label>Fin date déscente</Label>
                                <Input type={'date'}
                                       onChange={(e)=>setData('date_descente_fin',e.target.value)}
                                       value={data.date_descente_fin}
                                       required
                                />
                            </div>
                        </div>
                        <div className={"flex flex-col md:flex-row gap-6 m-5"}>
                            <div className={'my-auto'}>
                                <Label>Urbaine/Rurale</Label>
                                <Select onValueChange={(e) => setData('type_commune', e)} value={data.type_commune} required >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Urbaine/Rurale" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Urbaine">Urbaine</SelectItem>
                                        <SelectItem value="Rurale">Rurale</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className={'w-full md:w-1/4'}>
                                <Label>Commune</Label>
                                <Input type={'text'}
                                       onChange={(e) => setData('commune', e.target.value)}
                                       placeholder={"Commune"}
                                       value={data.commune}
                                       required
                                />
                            </div>
                            <div className={'w-full md:w-1/4'}>
                                <Label>Fokontany</Label>
                                <Input type={'text'}
                                       onChange={(e) => setData('fokontany', e.target.value)}
                                       placeholder={"Fokontany"}
                                       value={data.fokontany}
                                       required
                                />
                            </div>
                        </div>
                        <div className={"flex justify-end"}>
                            <Button type={'submit'} className={"w-36"}>
                                Valider
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    )
}
