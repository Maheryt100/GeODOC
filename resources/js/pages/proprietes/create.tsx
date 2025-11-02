import AppLayout from '@/layouts/app-layout';
import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';
import type { BreadcrumbItem, Dossier } from '@/types';

export default function Create() {
    const { dossier } = usePage<{ dossier: Dossier }>().props;

    const [selectedCharges, setSelectedCharges] = useState<string[]>([]);

    const chargeOptions = [
        "Voie(s) publique(s)",
        "Voie(s) d'accès",
        "Servitude(s)",
        "Aucune"
    ];

    const { data, setData, post, processing } = useForm({
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
        vocation: '',
        type_operation: dossier.type || 'immatriculation',
        numero_FN: '',
        numero_requisition: '',
        date_requisition: '',
        date_inscription: '',
        dep_vol: '',
    });
    const handleChargeChange = (charge: string, checked: boolean) => {
        let newCharges: string[];
        if (checked) {
            // Si "Aucune" est sélectionné, désélectionner les autres
            if (charge === "Aucune") {
                newCharges = ["Aucune"];
            } else {
                // Retirer "Aucune" si elle était sélectionnée
                newCharges = selectedCharges.filter(c => c !== "Aucune");
                newCharges = [...newCharges, charge];
            }
        } else {
            newCharges = selectedCharges.filter(c => c !== charge);
        }
        setSelectedCharges(newCharges);
        setData('charge', newCharges.join(', '));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation des champs obligatoires
        if (!data.lot) {
            toast.error('Le numéro de lot est obligatoire');
            return;
        }
        if (!data.type_operation) {
            toast.error('Le type d\'opération est obligatoire');
            return;
        }
        if (!data.nature) {
            toast.error('La nature est obligatoire');
            return;
        }
        if (!data.vocation) {
            toast.error('La vocation est obligatoire');
            return;
        }
        if (!data.proprietaire) {
            toast.error('Le nom de la propriété / propriétaire est obligatoire');
            return;
        }
        if (!data.situation) {
            toast.error('La situation est obligatoire');
            return;
        }

        post(route('proprietes.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Propriété créée avec succès !');
            },
        });
    };


    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Nouvelle Propriété', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle Propriété" />
            <Toaster richColors position="top-right" />

            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nouvelle Propriété</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations de la Propriété</CardTitle>
                        <CardDescription>
                            Champs obligatoires: Lot, Nature et Type d'opération
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Type d'opération */}
                            <div>
                                <Label className="text-red-500">Type d'opération *</Label>
                                <Select
                                    value={data.type_operation}
                                    onValueChange={(value) => setData('type_operation', value)}
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

                            {/* Ligne 1: Lot, Nature, Vocation */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-red-500">Lot *</Label>
                                    <Input
                                        type="text"
                                        value={data.lot}
                                        onChange={(e) => setData('lot', e.target.value)}
                                        placeholder="T 45"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-red-500">Nature *</Label>
                                    <Select value={data.nature} onValueChange={(e) => setData('nature', e)} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner" />
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
                                    <Select value={data.vocation} onValueChange={(e) => setData('vocation', e)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner" />
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

                            {/* Ligne 2: Propriété mère et Titre mère (si morcellement) */}
                            <div className="grid gap-4 md:grid-cols-2">
                                {data.type_operation === 'morcellement' && (
                                    <>
                                        <div>
                                            <Label>Propriété mère</Label>
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
                                    </>
                                )}
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

                            {/* Ligne 3: Contenance, Numero FN, Nº Requisition, Charge */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Contenance (m²)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={data.contenance}
                                        onChange={(e) => setData('contenance', e.target.value)}
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

                            {/* Ligne 4: Situation, Date inscription, Date requisition, Dep Vol */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Situation (sise à)</Label>
                                    <Input
                                        type="text"
                                        value={data.situation}
                                        onChange={(e) => setData('situation', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Date inscription</Label>
                                    <Input
                                        type="date"
                                        value={data.date_inscription}
                                        onChange={(e) => setData('date_inscription', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Date requisition</Label>
                                    <Input
                                        type="date"
                                        value={data.date_requisition}
                                        onChange={(e) => setData('date_requisition', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Dep Vol</Label>
                                    <Input
                                        type="text"
                                        value={data.dep_vol}
                                        onChange={(e) => setData('dep_vol', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Boutons de soumission */}
                            <div className="flex gap-4 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('dossiers.show', dossier.id))}
                                >
                                    Annuler
                                </Button>
                                <Button type="button" onClick={handleSubmit} disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}