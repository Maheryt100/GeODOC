// this is proprietes/update.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Eye } from 'lucide-react';
import { BreadcrumbItem, Dossier, Propriete, SharedData, Nature, Vocation } from '@/types';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';



export default function Update() {
    const { propriete, dossier } = usePage<{
        propriete: Propriete;
        dossier: Dossier;
    }>().props;
    const { flash } = usePage<SharedData>().props;

    const [selectedCharges, setSelectedCharges] = useState<string[]>(() => {
        if (propriete.charge) {
            return propriete.charge.split(', ').filter(c => c.trim());
        }
        return [];
    });

    const { data, setData, put, processing } = useForm({
        id_dossier: dossier.id,
        lot: propriete.lot ?? '',
        propriete_mere: propriete.propriete_mere ?? '',
        titre_mere: propriete.titre_mere ?? '',
        titre: propriete.titre ?? '',
        proprietaire: propriete.proprietaire ?? '',
        contenance: propriete.contenance ?? 0,
        charge: propriete.charge ?? '',
        situation: propriete.situation ?? '',
        numero_FN: propriete.numero_FN ?? '',
        nature: propriete.nature ?? '',
        vocation: propriete.vocation ?? '',
        type_operation: propriete.type_operation ?? 'immatriculation',
        numero_requisition: propriete.numero_requisition ?? '',
        date_requisition: propriete.date_requisition ?? '',
        date_inscription: propriete.date_inscription ?? '',
        dep_vol: propriete.dep_vol ?? '',
    });

    const chargeOptions = [
        "Voie(s) publique(s)",
        "Voie(s) d'accès",
        "Servitude(s)",
        "Aucune"
    ];


    const handleChargeChange = (charge: string, checked: boolean) => {
        let newCharges: string[];

        if (checked) {
            // Si "Aucune" est sélectionnée, désélectionner les autres
            if (charge === "Aucune") {
                newCharges = ["Aucune"];
            } else {
                // Retirer "Aucune" si elle était cochée
                newCharges = selectedCharges.filter(c => c !== "Aucune");
                newCharges = [...newCharges, charge];
            }
        } else {
            newCharges = selectedCharges.filter(c => c !== charge);
        }

        setSelectedCharges(newCharges);
        setData('charge', newCharges.join(', '));
    };


    useEffect(() => {
        if (flash.message) {
            toast.warning(flash.message);
        }
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.lot) {
            toast.error('Le numéro de lot est obligatoire');
            return;
        }

        if (!data.type_operation) {
            toast.error('Le type d\'opération est obligatoire');
            return;
        }

        put(route('proprietes.update', propriete.id), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Propriété modifiée avec succès !');
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
                            <Link href={route('demandes.index', dossier.id)}>Liste</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            href: route('dossiers.proprietes', dossier.id),
        },
        {
            title: 'Modification',
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modification Propriété" />
            <Toaster richColors position="top-right" />

            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Modifier Propriété</h1>
                        <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline">
                                <Eye className="mr-2 h-4 w-4" />
                                Voir le dossier
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>À propos du Dossier</SheetTitle>
                                <SheetDescription>
                                    Vérifier les informations du Dossier
                                </SheetDescription>
                            </SheetHeader>
                            <div className="grid flex-1 auto-rows-min gap-6 px-4 mt-6">
                                <div className="grid gap-3">
                                    <Label>Nom du dossier</Label>
                                    <Input value={dossier.nom_dossier} disabled />
                                </div>
                                <div className="grid gap-3">
                                    <Label>Circonscription</Label>
                                    <Input value={dossier.circonscription} disabled />
                                </div>
                                <div className="grid gap-3">
                                    <Label>Commune / fokontany</Label>
                                    <Input value={`${dossier.commune} / ${dossier.fokontany}`} disabled />
                                </div>
                                <div className="grid gap-3">
                                    <Label>Date descente</Label>
                                    <Input value={`${dossier.date_descente_debut} au ${dossier.date_descente_fin}`} disabled />
                                </div>
                            </div>
                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button variant="outline">Fermer</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations de la Propriété</CardTitle>
                        <CardDescription>
                            Tous les champs marqués d'un astérisque (*) sont obligatoires
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Type d'opération */}
                            <div>
                                <Label className="text-red-500">Type d'opération *</Label>
                                <Select
                                    value={data.type_operation}
                                    onValueChange={(e) => setData('type_operation', e as 'morcellement' | 'immatriculation')}
                                    required
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
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Nature</Label>
                                    <Select value={data.nature} onValueChange={(e) => setData('nature', e as Nature)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Nature" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Urbaine">Urbaine</SelectItem>
                                            <SelectItem value="Suburbaine">Suburbaine</SelectItem>
                                            <SelectItem value="Rurale">Rurale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Vocation</Label>
                                    <Select value={data.vocation} onValueChange={(e) => setData('vocation', e as Vocation)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Vocation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Edilitaire">Edilitaire</SelectItem>
                                            <SelectItem value="Agricole">Agricole</SelectItem>
                                            <SelectItem value="Forestière">Forestière</SelectItem>
                                            <SelectItem value="Touristique">Touristique</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Champs conditionnels pour Morcellement */}
                            {data.type_operation === 'morcellement' && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Nom propriété mère</Label>
                                        <Input
                                            type="text"
                                            value={data.propriete_mere}
                                            onChange={(e) => setData('propriete_mere', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Titre mère</Label>
                                        <Input
                                            type="text"
                                            value={data.titre_mere}
                                            onChange={(e) => setData('titre_mere', e.target.value)}
                                            placeholder="12.54-B"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Titre et Propriétaire */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Titre</Label>
                                    <Input
                                        type="text"
                                        value={data.titre}
                                        onChange={(e) => setData('titre', e.target.value)}
                                        placeholder="54.21-A"
                                    />
                                </div>
                                <div>
                                    <Label>Nom propriété / Propriétaire</Label>
                                    <Input
                                        type="text"
                                        value={data.proprietaire}
                                        onChange={(e) => setData('proprietaire', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Lot, Numero FN, Nº Requisition */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-red-500">Lot *</Label>
                                    <Input
                                        type="text"
                                        value={data.lot}
                                        onChange={(e) => setData('lot', e.target.value)}
                                        required
                                        placeholder="T 45"
                                    />
                                </div>
                                <div>
                                    <Label>Numero FNº</Label>
                                    <Input
                                        type="text"
                                        value={data.numero_FN}
                                        onChange={(e) => setData('numero_FN', e.target.value)}
                                        placeholder="78-A/25"
                                    />
                                </div>
                                {data.type_operation === 'immatriculation' && (
                                    <div>
                                        <Label>Nº Requisition</Label>
                                        <Input
                                            type="text"
                                            value={data.numero_requisition}
                                            onChange={(e) => setData('numero_requisition', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Contenance, Situation, Charge */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Contenance (m²)</Label>
                                    <Input
                                        type="number"
                                        value={data.contenance}
                                        min={1}
                                        placeholder="en m²"
                                        onChange={(e) => setData('contenance', Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label>Situation (sise à)</Label>
                                    <Input
                                        type="text"
                                        value={data.situation}
                                        onChange={(e) => setData('situation', e.target.value)}
                                    />
                                </div>
                                <div>
                                <Label>Charge</Label>
                                <div className="space-y-2 mt-2">
                                    {chargeOptions.map((charge) => (
                                        <div key={charge} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`charge-${charge}`}
                                                checked={selectedCharges.includes(charge)}
                                                onCheckedChange={(checked) => handleChargeChange(charge, checked as boolean)}
                                            />
                                            <label
                                                htmlFor={`charge-${charge}`}
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
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Date inscription</Label>
                                    <Input
                                        type="date"
                                        onChange={(e) => setData('date_inscription', e.target.value)}
                                        value={data.date_inscription}
                                    />
                                </div>
                                <div>
                                    <Label>Date requisition</Label>
                                    <Input
                                        type="date"
                                        onChange={(e) => setData('date_requisition', e.target.value)}
                                        value={data.date_requisition}
                                    />
                                </div>
                                <div>
                                    <Label>Dep Vol</Label>
                                    <Input
                                        type="text"
                                        onChange={(e) => setData('dep_vol', e.target.value)}
                                        value={data.dep_vol}
                                    />
                                </div>
                            </div>

                            {/* Boutons */}
                            <div className="flex gap-4 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Modifier'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}