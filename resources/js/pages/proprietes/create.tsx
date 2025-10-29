import AppLayout from '@/layouts/app-layout';
import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function Create() {
    const { dossier } = usePage<{ dossier: Dossier }>().props;
    const [selectedCharges, setSelectedCharges] = useState<string[]>([]);

    const { data, setData, post } = useForm({
        id_dossier: dossier.id,
        lot: '',
        propriete_mere: '',
        titre_mere: '',
        titre: '',
        proprietaire: '',
        contenance: '',
        charge: '',
        situation: '',
        nature: '',
        vocation: '',
        type_operation: '' as 'morcellement' | 'immatriculation',
        numero_FN: '',
        numero_requisition: '',
        date_requisition: '',
        date_inscription: '',
        dep_vol: '',
    });

    const chargeOptions = [
        "Voie(s) publique(s)",
        "Voie(s) d'accès",
        "Servitude(s)"
    ];

    const handleChargeChange = (charge: string, checked: boolean) => {
        let newCharges: string[];
        if (checked) {
            newCharges = [...selectedCharges, charge];
        } else {
            newCharges = selectedCharges.filter(c => c !== charge);
        }
        setSelectedCharges(newCharges);
        setData('charge', newCharges.join(', '));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!data.lot) {
            toast.warning('Le numéro de lot est obligatoire');
            return;
        }
        
        if (!data.type_operation) {
            toast.warning('Veuillez sélectionner le type d\'opération (Morcellement ou Immatriculation)');
            return;
        }

        post(route('proprietes.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation: ', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Propriété créée avec succès !');
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: dossier.nom_dossier,
            href: '#',
        },
        {
            title: (
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1">
                        Propriétés
                        <ChevronDown className="h-3.5 w-3.5" />
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster richColors position="top-right" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <form onSubmit={handleSubmit}>
                        <div className={'mt-15'}>
                            {/* Type d'opération (OBLIGATOIRE) */}
                            <div className={'my-5 mx-5'}>
                                <Label className="text-red-500">Type d'opération *</Label>
                                <Select 
                                    onValueChange={(e) => setData('type_operation', e as 'morcellement' | 'immatriculation')} 
                                    required
                                    value={data.type_operation}
                                >
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue placeholder="Sélectionner le type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="morcellement">Morcellement</SelectItem>
                                        <SelectItem value="immatriculation">Immatriculation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Nature et Vocation */}
                            <div className={'flex flex-col md:flex-row gap-6 mx-5'}>
                                <div className={'my-auto'}>
                                    <Label>Nature</Label>
                                    <Select onValueChange={(e) => setData('nature', e)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Nature" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Urbaine">Urbaine</SelectItem>
                                            <SelectItem value="Suburbaine">Suburbaine</SelectItem>
                                            <SelectItem value="Rurale">Rurale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={'my-auto'}>
                                    <Label>Vocation</Label>
                                    <Select onValueChange={(e) => setData('vocation', e)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Vocation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Editaire">Editaire</SelectItem>
                                            <SelectItem value="Agricole">Agricole</SelectItem>
                                            <SelectItem value="Forestière">Forestière</SelectItem>
                                            <SelectItem value="Touristique">Touristique</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Champs conditionnels pour Morcellement */}
                            {data.type_operation === 'morcellement' && (
                                <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                    <div className={'w-full'}>
                                        <Label>Nom propriété mère</Label>
                                        <Input
                                            type={'text'}
                                            value={data.propriete_mere}
                                            onChange={(e) => setData('propriete_mere', e.target.value)}
                                        />
                                    </div>
                                    <div className={'w-full'}>
                                        <Label>Titre mère</Label>
                                        <Input
                                            type={'text'}
                                            value={data.titre_mere}
                                            onChange={(e) => setData('titre_mere', e.target.value)}
                                            placeholder={"12.54-B"}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Titre et Propriétaire */}
                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Titre</Label>
                                    <Input
                                        type={'text'}
                                        onChange={(e) => setData('titre', e.target.value)}
                                        placeholder={"54.21-A"}
                                    />
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Nom propriété / Propriétaire</Label>
                                    <Input type={'text'} onChange={(e) => setData('proprietaire', e.target.value)} />
                                </div>
                            </div>

                            {/* Lot, Numero FN, Nº Requisition */}
                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                <div className={'w-full md:w-1/4'}>
                                    <Label className="text-red-500">Lot *</Label>
                                    <Input
                                        type='text'
                                        onChange={(e) => setData('lot', e.target.value)}
                                        required
                                        placeholder={"T 45"}
                                    />
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Numero FNº</Label>
                                    <Input
                                        type={'text'}
                                        onChange={(e) => setData('numero_FN', e.target.value)}
                                        placeholder={"78-A/25"}
                                    />
                                </div>
                                {data.type_operation === 'immatriculation' && (
                                    <div className={'w-full md:w-1/4'}>
                                        <Label>Nº Requisition</Label>
                                        <Input
                                            type={'text'}
                                            value={data.numero_requisition}
                                            onChange={(e) => setData('numero_requisition', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Contenance, Charge (ENUM), Situation */}
                            <div className={'flex flex-col md:flex-row gap-6 m-5'}>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Contenance</Label>
                                    <Input
                                        type={'number'}
                                        min={1}
                                        placeholder={'en m²'}
                                        onChange={(e) => setData('contenance', e.target.value)}
                                    />
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Situation (sise à)</Label>
                                    <Input type={'text'} onChange={(e) => setData('situation', e.target.value)} />
                                </div>
                                <div className={'w-full md:w-1/3'}>
                                    <Label>Charge</Label>
                                    <div className="space-y-2 mt-2">
                                        {chargeOptions.map((charge) => (
                                            <div key={charge} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={charge}
                                                    checked={selectedCharges.includes(charge)}
                                                    onCheckedChange={(checked) => handleChargeChange(charge, checked as boolean)}
                                                />
                                                <label
                                                    htmlFor={charge}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {charge}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                            </div>

                            {/* Dates et Dep Vol */}
                            <div className="flex flex-col md:flex-row gap-6 m-5">
                                <div className="w-full md:w-1/4">
                                    <Label>Date inscription</Label>
                                    <Input
                                        type="date"
                                        onChange={(e) => setData('date_inscription', e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="w-full md:w-1/4">
                                    <Label>Date requisition</Label>
                                    <Input
                                        type="date"
                                        onChange={(e) => setData('date_requisition', e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className={'w-full md:w-1/4'}>
                                    <Label>Dep Vol</Label>
                                    <Input type={'text'} onChange={(e) => setData('dep_vol', e.target.value)} />
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