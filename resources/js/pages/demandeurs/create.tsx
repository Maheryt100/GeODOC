import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import React, { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, MapPin, MapPinHouse } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
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


export default function Create(){

    const { district: districts } = usePage().props;
    const [districtOpen, setDistrictOpen] = useState(false);
    const [districtName, setDistrictName] = useState("");

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
        'id_district': '',
    });

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


    return (
        <AppLayout>
            <Toaster className={'absolute top-0 right-0'}/>
            <Head title={'Insertion Demandeur'}/>
            <div className="mt-2">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/demandeurs">Demandeur</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Insertion</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                <form onSubmit={handleSubmit} >
                    <div className={'border rounded-md p-8'}>
                            <div className={'flex'}>
                                <div className={'my-auto'}>
                                    <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'outline'}
                                                role={'combobox'}
                                                aria-expanded={districtOpen}
                                                className={'w-[200px]'}
                                            >
                                                { districtName || "District"}
                                                <MapPinHouse />
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
                                                                    setData('id_district', district.id);
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
                            </div>
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
                                        required
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
                            <div className="text-right">
                                <Button type="submit">Valider</Button>
                            </div>
                        </div>
                </form>
            </div>
        </AppLayout>
    );
}
