import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Save } from 'lucide-react';
import type { BreadcrumbItem, Dossier } from '@/types';

export default function Create() {
    const { dossier } = usePage<{ dossier: Dossier }>().props;

    const { data, setData, post, processing } = useForm({
        titre_demandeur: '',
        nom_demandeur: '',
        prenom_demandeur: '',
        date_naissance: '',
        lieu_naissance: '',
        sexe: '',
        occupation: '',
        nom_pere: '',
        nom_mere: '',
        cin: '',
        date_delivrance: '',
        lieu_delivrance: '',
        date_delivrance_duplicata: '',
        lieu_delivrance_duplicata: '',
        domiciliation: '',
        nationalite: 'Malagasy',
        situation_familiale: '',
        regime_matrimoniale: '',
        date_mariage: '',
        lieu_mariage: '',
        marie_a: '',
        telephone: '',
        id_dossier: dossier.id,
    });

    useEffect(() => {
        if (data.situation_familiale !== 'Marié(e)') {
            setData({
                ...data,
                marie_a: '',
                date_mariage: '',
                lieu_mariage: '',
            });
        }
    }, [data.situation_familiale]);

    const handleTitre = (value: string) => {
        setData({
            ...data,
            titre_demandeur: value,
            sexe: value === 'Monsieur' ? 'Homme' : 'Femme',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Validation UNIQUEMENT des 4 champs obligatoires
        if (!data.titre_demandeur) {
            toast.error('Le titre de civilité est obligatoire');
            return;
        }
        if (!data.nom_demandeur) {
            toast.error('Le nom est obligatoire');
            return;
        }
        if (!data.date_naissance) {
            toast.error('La date de naissance est obligatoire');
            return;
        }
        // ✅ CIN obligatoire seulement s'il est fourni (pour vérifier l'unicité)
        if (data.cin && data.cin.length > 0 && data.cin.length !== 12) {
            toast.error('Le CIN doit contenir exactement 12 chiffres ou rester vide');
            return;
        }

        post(route('demandeurs.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Demandeur créé avec succès !');
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Nouveau Demandeur', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau Demandeur" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nouveau Demandeur</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations du Demandeur</CardTitle>
                        <CardDescription>
                            Champs obligatoires: Titre de civilité, Nom et Date de naissance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Ligne 1: Titre, Nom, Prénom */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-red-500">Titre de civilité *</Label>
                                    <Select
                                        value={data.titre_demandeur}
                                        onValueChange={handleTitre}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Monsieur">Monsieur</SelectItem>
                                            <SelectItem value="Madame">Madame</SelectItem>
                                            <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-red-500">Nom *</Label>
                                    <Input
                                        type="text"
                                        value={data.nom_demandeur}
                                        onChange={(e) => setData('nom_demandeur', e.target.value)}
                                        placeholder="RAKOTO"
                                    />
                                </div>
                                <div>
                                    <Label>Prénom</Label>
                                    <Input
                                        type="text"
                                        value={data.prenom_demandeur}
                                        onChange={(e) => setData('prenom_demandeur', e.target.value)}
                                        placeholder="Jean"
                                    />
                                </div>
                            </div>

                            {/* Ligne 2: Date naissance, Lieu naissance, Nom père, Nom mère */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label className="text-red-500">Date de naissance *</Label>
                                    <Input
                                        type="date"
                                        value={data.date_naissance}
                                        onChange={(e) => setData('date_naissance', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Lieu de naissance</Label>
                                    <Input
                                        type="text"
                                        value={data.lieu_naissance}
                                        onChange={(e) => setData('lieu_naissance', e.target.value)}
                                        placeholder="Antananarivo"
                                    />
                                </div>
                                <div>
                                    <Label>Nom complet Père</Label>
                                    <Input
                                        type="text"
                                        value={data.nom_pere}
                                        onChange={(e) => setData('nom_pere', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Nom complet Mère</Label>
                                    <Input
                                        type="text"
                                        value={data.nom_mere}
                                        onChange={(e) => setData('nom_mere', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* CIN */}
                            <div className="w-1/2">
                                <Label>CIN (optionnel)</Label>
                                <InputOTP
                                    maxLength={12}
                                    value={data.cin}
                                    onChange={(value) => setData('cin', value)}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={6} />
                                        <InputOTPSlot index={7} />
                                        <InputOTPSlot index={8} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={9} />
                                        <InputOTPSlot index={10} />
                                        <InputOTPSlot index={11} />
                                    </InputOTPGroup>
                                </InputOTP>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Laissez vide si non disponible
                                </p>
                            </div>

                            {/* Délivrance CIN */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Date Délivrance</Label>
                                    <Input
                                        type="date"
                                        value={data.date_delivrance}
                                        onChange={(e) => setData('date_delivrance', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Lieu Délivrance</Label>
                                    <Input
                                        type="text"
                                        value={data.lieu_delivrance}
                                        onChange={(e) => setData('lieu_delivrance', e.target.value)}
                                        placeholder="Antananarivo"
                                    />
                                </div>
                                <div>
                                    <Label>Date Délivrance Duplicata</Label>
                                    <Input
                                        type="date"
                                        value={data.date_delivrance_duplicata}
                                        onChange={(e) => setData('date_delivrance_duplicata', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Lieu Délivrance Duplicata</Label>
                                    <Input
                                        type="text"
                                        value={data.lieu_delivrance_duplicata}
                                        onChange={(e) => setData('lieu_delivrance_duplicata', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Occupation, Domiciliation, Téléphone */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Occupation</Label>
                                    <Input
                                        type="text"
                                        value={data.occupation}
                                        onChange={(e) => setData('occupation', e.target.value)}
                                        placeholder="Agriculteur"
                                    />
                                </div>
                                <div>
                                    <Label>Domiciliation</Label>
                                    <Input
                                        type="text"
                                        value={data.domiciliation}
                                        onChange={(e) => setData('domiciliation', e.target.value)}
                                        placeholder="Lot II A 45 Ambohimanarina"
                                    />
                                </div>
                                <div>
                                    <Label>Téléphone</Label>
                                    <Input
                                        type="text"
                                        value={data.telephone}
                                        onChange={(e) => setData('telephone', e.target.value)}
                                        placeholder="0340000000"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            {/* Situation familiale, Régime, Nationalité */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Situation Familiale</Label>
                                    <Select
                                        value={data.situation_familiale}
                                        onValueChange={(value) => setData('situation_familiale', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Non spécifiée">Non spécifiée</SelectItem>
                                            <SelectItem value="Célibataire">Célibataire</SelectItem>
                                            <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                                            <SelectItem value="Veuf/Veuve">Veuf/Veuve</SelectItem>
                                            <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Régime matrimonial</Label>
                                    <Select
                                        value={data.regime_matrimoniale}
                                        onValueChange={(value) => setData('regime_matrimoniale', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Non spécifié">Non spécifié</SelectItem>
                                            <SelectItem value="zara-mira">Zara-Mira</SelectItem>
                                            <SelectItem value="kitay telo an-dalana">Kitay telo an-dalana</SelectItem>
                                            <SelectItem value="Séparations des biens">Séparations des biens</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Nationalité</Label>
                                    <Input
                                        type="text"
                                        value={data.nationalite}
                                        onChange={(e) => setData('nationalite', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Infos mariage si marié */}
                            {data.situation_familiale === 'Marié(e)' && (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label>Marié(e) à</Label>
                                        <Input
                                            type="text"
                                            value={data.marie_a}
                                            onChange={(e) => setData('marie_a', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Date de Mariage</Label>
                                        <Input
                                            type="date"
                                            value={data.date_mariage}
                                            onChange={(e) => setData('date_mariage', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Lieu de Mariage</Label>
                                        <Input
                                            type="text"
                                            value={data.lieu_mariage}
                                            onChange={(e) => setData('lieu_mariage', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Boutons de soumission */}
                            <div className="flex gap-4 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('dossiers.show', dossier.id))}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}