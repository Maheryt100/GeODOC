import { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Trash2, Save } from 'lucide-react';
import type { BreadcrumbItem, Dossier } from '@/types';

interface DemandeurForm {
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string;
    date_naissance: string;
    lieu_naissance: string;
    nom_pere: string;
    nom_mere: string;
    sexe: string;
    occupation: string;
    cin: string;
    date_delivrance: string;
    lieu_delivrance: string;
    date_delivrance_duplicata: string;
    lieu_delivrance_duplicata: string;
    domiciliation: string;
    nationalite: string;
    situation_familiale: string;
    regime_matrimoniale: string;
    date_mariage: string;
    lieu_mariage: string;
    marie_a: string;
    telephone: string;
    [key: string]: string; // Index signature
}

interface PageProps {
    dossier: Dossier;
    [key: string]: unknown; // Index signature
}

export default function FusionForm() {
    const { dossier } = usePage<PageProps>().props;
    const dossierType = dossier.type;

    const [demandeurs, setDemandeurs] = useState<DemandeurForm[]>([{
        titre_demandeur: '',
        nom_demandeur: '',
        prenom_demandeur: '',
        date_naissance: '',
        lieu_naissance: '',
        nom_pere: '',
        nom_mere: '',
        sexe: '',
        occupation: '',
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
        telephone: ''
    }]);

    //Utiliser un type simple pour useForm
    const { data, setData, post, processing } = useForm({
        // Propriété
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
        numero_FN: '',
        numero_requisition: '',
        date_requisition: '',
        date_inscription: '',
        dep_vol: '',
        id_dossier: dossier.id,
        // Demandeurs stockés comme string JSON
        demandeurs_json: JSON.stringify([{
            titre_demandeur: '',
            nom_demandeur: '',
            prenom_demandeur: '',
            date_naissance: '',
            lieu_naissance: '',
            nom_pere: '',
            nom_mere: '',
            sexe: '',
            occupation: '',
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
            telephone: ''
        }])
    });

    useEffect(() => {
        if (dossierType === 'immatriculation') {
            setData('propriete_mere', '');
            setData('titre_mere', '');
        }
    }, [dossierType, setData]);

    // ✅ Synchroniser demandeurs avec le form data
    useEffect(() => {
        setData('demandeurs_json', JSON.stringify(demandeurs));
    }, [demandeurs]);

    const handleTitre = (value: string, index: number) => {
        const newDemandeurs = [...demandeurs];
        newDemandeurs[index].titre_demandeur = value;
        newDemandeurs[index].sexe = value === 'Monsieur' ? 'Homme' : 'Femme';
        setDemandeurs(newDemandeurs);
    };

    const updateDemandeur = (index: number, field: keyof DemandeurForm, value: string) => {
        const newDemandeurs = [...demandeurs];
        newDemandeurs[index][field] = value;
        setDemandeurs(newDemandeurs);
    };

    const ajouterDemandeur = () => {
        const nouveauDemandeur: DemandeurForm = {
            titre_demandeur: '',
            nom_demandeur: '',
            prenom_demandeur: '',
            date_naissance: '',
            lieu_naissance: '',
            nom_pere: '',
            nom_mere: '',
            sexe: '',
            occupation: '',
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
            telephone: ''
        };
        setDemandeurs([...demandeurs, nouveauDemandeur]);
    };

    const supprimerDemandeur = (index: number) => {
        if (demandeurs.length === 1) {
            toast.error('Vous devez avoir au moins un demandeur');
            return;
        }
        setDemandeurs(demandeurs.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation du lot
        if (!data.lot) {
            toast.error('Le numéro de lot est obligatoire');
            return;
        }

        // Validation des demandeurs
        for (let i = 0; i < demandeurs.length; i++) {
            const d = demandeurs[i];
            if (!d.nom_demandeur || !d.cin || !d.titre_demandeur) {
                toast.error(`Demandeur ${i + 1}: Le nom, le CIN et le titre de civilité sont obligatoires`);
                return;
            }
            const cinIsValid = /^\d+$/.test(d.cin);
            if (!cinIsValid) {
                toast.error(`Demandeur ${i + 1}: Le CIN ne doit contenir que des chiffres`);
                return;
            }
        }

        post(route('demandeur-propriete.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n')
                });
            },
            onSuccess: () => {
                toast.success('Demandeur(s) et propriété créés avec succès !');
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Nouveau Demandeur + Propriété', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajouter Demandeur + Propriété" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nouveau Demandeur + Propriété</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                <div className="space-y-6">
                    {/* SECTION PROPRIÉTÉ */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de la Propriété</CardTitle>
                            <CardDescription>Lot obligatoire - Les autres champs peuvent être remplis ultérieurement</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Lot (en haut) */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="md:col-span-1">
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
                                    <Label>Nature</Label>
                                    <Select value={data.nature} onValueChange={(e) => setData('nature', e)}>
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

                            <div className="grid gap-4 md:grid-cols-2">
                                {dossierType === 'morcellement' && (
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
                                {dossierType === 'immatriculation' && (
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
                                    <Input
                                        type="text"
                                        value={data.charge}
                                        onChange={(e) => setData('charge', e.target.value)}
                                    />
                                </div>
                            </div>

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
                        </CardContent>
                    </Card>

                    {/* SECTION DEMANDEURS */}
                    {demandeurs.map((demandeur, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Demandeur {index + 1}</CardTitle>
                                        <CardDescription>
                                            Champs obligatoires: Titre, Nom, CIN
                                        </CardDescription>
                                    </div>
                                    {demandeurs.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => supprimerDemandeur(index)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Retirer
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Ligne 1: Titre, Nom, Prénom */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label className="text-red-500">Titre de civilité *</Label>
                                        <Select
                                            value={demandeur.titre_demandeur}
                                            onValueChange={(value) => handleTitre(value, index)}
                                            required
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
                                            value={demandeur.nom_demandeur}
                                            onChange={(e) => updateDemandeur(index, 'nom_demandeur', e.target.value)}
                                            placeholder="RAKOTO"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Prénom</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.prenom_demandeur}
                                            onChange={(e) => updateDemandeur(index, 'prenom_demandeur', e.target.value)}
                                            placeholder="Jean"
                                        />
                                    </div>
                                </div>

                                {/* Ligne 2: Date naissance, Lieu naissance, Nom père, Nom mère */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div>
                                        <Label>Date de naissance</Label>
                                        <Input
                                            type="date"
                                            value={demandeur.date_naissance}
                                            onChange={(e) => updateDemandeur(index, 'date_naissance', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Lieu de naissance</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.lieu_naissance}
                                            onChange={(e) => updateDemandeur(index, 'lieu_naissance', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Nom complet Père</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.nom_pere}
                                            onChange={(e) => updateDemandeur(index, 'nom_pere', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Nom complet Mère</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.nom_mere}
                                            onChange={(e) => updateDemandeur(index, 'nom_mere', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* CIN */}
                                <div className="w-1/2">
                                    <Label className="text-red-500">CIN *</Label>
                                    <InputOTP
                                        maxLength={12}
                                        minLength={12}
                                        value={demandeur.cin}
                                        onChange={(value) => updateDemandeur(index, 'cin', value)}
                                        required
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
                                            value={demandeur.date_delivrance}
                                            onChange={(e) => updateDemandeur(index, 'date_delivrance', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Lieu Délivrance</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.lieu_delivrance}
                                            onChange={(e) => updateDemandeur(index, 'lieu_delivrance', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Date Délivrance Duplicata</Label>
                                        <Input
                                            type="date"
                                            value={demandeur.date_delivrance_duplicata}
                                            onChange={(e) => updateDemandeur(index, 'date_delivrance_duplicata', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Lieu Délivrance Duplicata</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.lieu_delivrance_duplicata}
                                            onChange={(e) => updateDemandeur(index, 'lieu_delivrance_duplicata', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Occupation, Domiciliation, Téléphone */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label>Occupation</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.occupation}
                                            onChange={(e) => updateDemandeur(index, 'occupation', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Domiciliation</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.domiciliation}
                                            onChange={(e) => updateDemandeur(index, 'domiciliation', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Téléphone</Label>
                                        <Input
                                            type="text"
                                            value={demandeur.telephone}
                                            onChange={(e) => updateDemandeur(index, 'telephone', e.target.value)}
                                            maxLength={10}
                                        />
                                    </div>
                                </div>

                                {/* Situation familiale, Régime, Nationalité */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label>Situation Familiale</Label>
                                        <Select
                                            value={demandeur.situation_familiale}
                                            onValueChange={(value) => updateDemandeur(index, 'situation_familiale', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Situation Familiale" />
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
                                            value={demandeur.regime_matrimoniale}
                                            onValueChange={(value) => updateDemandeur(index, 'regime_matrimoniale', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Régime Matrimonial" />
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
                                            value={demandeur.nationalite}
                                            onChange={(e) => updateDemandeur(index, 'nationalite', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Infos mariage si marié */}
                                {demandeur.situation_familiale === 'Marié(e)' && (
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Marié(e) à</Label>
                                            <Input
                                                type="text"
                                                value={demandeur.marie_a}
                                                onChange={(e) => updateDemandeur(index, 'marie_a', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Date de Mariage</Label>
                                            <Input
                                                type="date"
                                                value={demandeur.date_mariage}
                                                onChange={(e) => updateDemandeur(index, 'date_mariage', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Lieu de Mariage</Label>
                                            <Input
                                                type="text"
                                                value={demandeur.lieu_mariage}
                                                onChange={(e) => updateDemandeur(index, 'lieu_mariage', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Bouton Ajouter Demandeur */}
                    <div className="flex justify-center">
                        <Button type="button" variant="outline" onClick={ajouterDemandeur}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Ajouter un autre demandeur (consort)
                        </Button>
                    </div>

                    {/* Boutons de soumission */}
                    <div className="flex gap-4 justify-end">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('dossiers.show', dossier.id))}>
                            Annuler
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}