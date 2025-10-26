import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
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
        title: 'Insertion',
        href: '/dossiers/create',
    },
]

export default function Create(){

    const {district: districts} = usePage().props;

    const [districtOpen, setDistrictOpen] = useState(false);
    const [districtName, setDistrictName] = useState("");

    const [circonscriptionName, setCirconscriptionName] = useState("");
    const [circonscriptionOpen, setCirconscriptionOpen] = useState(false);

    const {data, setData, post} = useForm({
        id_district: 0,
        nom_dossier: '',
        date_descente_debut: '',
        date_descente_fin: '',
        type_commune: '',
        commune: '',
        fokontany: '',
        type: '',
        circonscription: '',
    })

    const handleSubmit = (e:React.FormEvent) =>{
        e.preventDefault();
        console.log(data);
        post(route("dossiers.store"),{
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
                <div className="my-auto mx-4">
                    <form
                        onSubmit={handleSubmit}
                        className="border-2 rounded-sm w-full md:w-3/4 mx-auto mt-6 p-6 md:p-10 max-w-4xl"
                    >
                        {/* Section 1 : Popovers District et Circonscription */}
                        <div className="flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center gap-4 mb-6">
                            <div className="w-full md:w-auto min-w-0 flex-1">
                                <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={districtOpen}
                                            className="w-full md:w-[200px] justify-between"
                                        >
                                            {districtName || "District"}
                                            <ChevronsUpDown className="ml-2 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full md:w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un district" className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>Aucun district ne correspond</CommandEmpty>
                                                <CommandGroup>
                                                    {districts.map((district) => (
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
                            <div className="w-full md:w-auto min-w-0 flex-1">
                                <Popover open={circonscriptionOpen} onOpenChange={setCirconscriptionOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={circonscriptionOpen}
                                            className="w-full md:w-[200px] justify-between"
                                        >
                                            {circonscriptionName || "Circonscription"}
                                            <ChevronsUpDown className="ml-2 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full md:w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une circonscription" className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>Aucune circonscription ne correspond</CommandEmpty>
                                                <CommandGroup>
                                                    {districts.map((district) => (
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

                        {/* Section 2 : Nom dossier + RadioGroup */}
                        <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                            <div className="w-full md:w-2/3 min-w-0 flex-1">
                                <Label>Nom dossier</Label>
                                <Input
                                    type="text"
                                    onChange={(e) => setData('nom_dossier', e.target.value)}
                                    required
                                    placeholder="Nom du dossier"
                                    minLength={5}
                                    className="w-full"
                                />
                            </div>
                            <div className="w-full md:w-1/3 min-w-0 flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-0 pt-0 md:pt-7">
                                <RadioGroup onValueChange={(e) => setData('type', e)} className="flex flex-col md:flex-row gap-3 w-full">
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="morcellement" id="r1" />
                                        <Label htmlFor="r1" className="hover:cursor-pointer">Morcellement</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="immatriculation" id="r2" />
                                        <Label htmlFor="r2" className="hover:cursor-pointer">Immatriculation</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        {/* Section 3 : Dates de descente */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6 p-0 m-0">
                            <div className="w-full md:w-1/2 min-w-0 flex-1">
                                <Label>Début date descente</Label>
                                <Input
                                    type="date"
                                    onChange={(e) => setData('date_descente_debut', e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>
                            <div className="w-full md:w-1/2 min-w-0 flex-1">
                                <Label>Fin date descente</Label>
                                <Input
                                    type="date"
                                    onChange={(e) => setData('date_descente_fin', e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Section 4 : Urbaine/Rurale + Commune + Fokontany */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-6 p-0 m-0 items-start">
                            <div className="w-full lg:w-1/3 min-w-0 flex-1">
                                <Label>Urbaine/Rurale</Label>
                                <Select onValueChange={(e) => setData('type_commune', e)} required>
                                    <SelectTrigger className="w-full lg:w-[180px]">
                                        <SelectValue placeholder="Urbaine/Rurale" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Urbaine">Urbaine</SelectItem>
                                        <SelectItem value="Rurale">Rurale</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full lg:w-1/3 min-w-0 flex-1">
                                <Label>Commune</Label>
                                <Input
                                    type="text"
                                    onChange={(e) => setData('commune', e.target.value)}
                                    placeholder="Commune"
                                    className="w-full"
                                />
                            </div>
                            <div className="w-full lg:w-1/3 min-w-0 flex-1">
                                <Label>Fokontany</Label>
                                <Input
                                    type="text"
                                    onChange={(e) => setData('fokontany', e.target.value)}
                                    placeholder="Fokontany"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Bouton Submit */}
                        <div className="flex justify-center md:justify-end">
                            <Button type="submit" className="w-36">
                                Valider
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    )
}
