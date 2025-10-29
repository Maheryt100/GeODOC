import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Demandeur, Dossier } from '@/types';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { Save } from 'lucide-react';
import React from 'react';

export default function CreateExist({ demandeur }: { demandeur: Demandeur }) {
    const { dossier } = usePage<{ dossier: Dossier }>().props;

    const { data, setData, post, processing } = useForm({
        id_demandeur: demandeur.id,
        titre_demandeur: demandeur.titre_demandeur ?? '',
        nom_demandeur: demandeur.nom_demandeur ?? '',
        prenom_demandeur: demandeur.prenom_demandeur ?? '',
        date_naissance: demandeur.date_naissance ?? '',
        lieu_naissance: demandeur.lieu_naissance ?? '',
        sexe: demandeur.sexe ?? '',
        occupation: demandeur.occupation ?? '',
        nom_pere: demandeur.nom_pere ?? '',
        nom_mere: demandeur.nom_mere ?? '',
        cin: demandeur.cin ?? '',
        date_delivrance: demandeur.date_delivrance ?? '',
        lieu_delivrance: demandeur.lieu_delivrance ?? '',
        date_delivrance_duplicata: demandeur.date_delivrance_duplicata ?? '',
        lieu_delivrance_duplicata: demandeur.lieu_delivrance_duplicata ?? '',
        domiciliation: demandeur.domiciliation ?? '',
        nationalite: demandeur.nationalite ?? 'Malagasy',
        situation_familiale: demandeur.situation_familiale ?? '',
        regime_matrimoniale: demandeur.regime_matrimoniale ?? '',
        date_mariage: demandeur.date_mariage ?? '',
        lieu_mariage: demandeur.lieu_mariage ?? '',
        marie_a: demandeur.marie_a ?? '',
        telephone: demandeur.telephone ?? '',
        id_dossier: dossier.id,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation basique
        if (!data.nom_demandeur || !data.titre_demandeur || !data.cin) {
            toast.error('Le nom, le titre et le CIN sont obligatoires');
            return;
        }

        post(route('store.exist'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Demandeur ajouté au dossier avec succès !');
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Ajouter Demandeur Existant', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajouter Demandeur Existant" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Ajouter Demandeur Existant</h1>
                    <p className="text-muted-foreground">
                        Dossier: {dossier.nom_dossier} • CIN trouvé: {demandeur.cin}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations du Demandeur</CardTitle>
                        <CardDescription>
                            Vérifiez les informations avant d'ajouter ce demandeur au dossier
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Ligne 1: Titre, Nom, Prénom */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Titre de civilité</Label>
                                    <Select value={data.titre_demandeur} disabled>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Monsieur">Monsieur</SelectItem>
                                            <SelectItem value="Madame">Madame</SelectItem>
                                            <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Nom</Label>
                                    <Input
                                        type="text"
                                        value={data.nom_demandeur}
                                        onChange={(e) => setData('nom_demandeur', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Prénom</Label>
                                    <Input
                                        type="text"
                                        value={data.prenom_demandeur}
                                        onChange={(e) => setData('prenom_demandeur', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Ligne 2: Date naissance, Lieu naissance, Nom père, Nom mère */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Date de naissance</Label>
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
                                <Label>CIN</Label>
                                <InputOTP
                                    maxLength={12}
                                    minLength={12}
                                    value={data.cin}
                                    onChange={(value) => setData('cin', value)}
                                    disabled
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
                                    />
                                </div>
                                <div>
                                    <Label>Domiciliation</Label>
                                    <Input
                                        type="text"
                                        value={data.domiciliation}
                                        onChange={(e) => setData('domiciliation', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Téléphone</Label>
                                    <Input
                                        type="text"
                                        value={data.telephone}
                                        onChange={(e) => setData('telephone', e.target.value)}
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
                                    {processing ? 'Enregistrement...' : 'Ajouter au dossier'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}