import { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Plus, Trash2, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BreadcrumbItem, Dossier } from '@/types';

interface DemandeurForm {
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string;
    date_naissance: string;
    lieu_naissance: string;
    sexe: string;
    occupation: string;
    nom_pere: string;
    nom_mere: string;
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
}

const emptyDemandeur: DemandeurForm = {
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
    situation_familiale: 'Non spécifiée',
    regime_matrimoniale: 'Non spécifié',
    date_mariage: '',
    lieu_mariage: '',
    marie_a: '',
    telephone: ''
};

type CreationMode = 'lot-demandeur' | 'lot-only' | 'demandeur-only';

export default function NouveauLot() {
    const { dossier } = usePage<{ dossier: Dossier }>().props;
    const [creationMode, setCreationMode] = useState<CreationMode>('lot-demandeur');
    const [demandeurs, setDemandeurs] = useState<DemandeurForm[]>([{ ...emptyDemandeur }]);
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
        type_operation: 'immatriculation' as 'morcellement' | 'immatriculation',
        numero_FN: '',
        numero_requisition: '',
        date_requisition: '',
        date_inscription: '',
        dep_vol: '',
        demandeurs_json: ''
    });

    const handleChargeChange = (charge: string, checked: boolean) => {
        let newCharges: string[];
        if (checked) {
            if (charge === "Aucune") {
                newCharges = ["Aucune"];
            } else {
                newCharges = selectedCharges.filter(c => c !== "Aucune");
                newCharges = [...newCharges, charge];
            }
        } else {
            newCharges = selectedCharges.filter(c => c !== charge);
        }
        setSelectedCharges(newCharges);
        setData('charge', newCharges.join(', '));
    };

    const addDemandeur = () => {
        setDemandeurs([...demandeurs, { ...emptyDemandeur }]);
    };

    const removeDemandeur = (index: number) => {
        if (demandeurs.length === 1) {
            toast.error('Au moins un demandeur est requis');
            return;
        }
        const newDemandeurs = demandeurs.filter((_, i) => i !== index);
        setDemandeurs(newDemandeurs);
    };

    const updateDemandeur = (index: number, field: keyof DemandeurForm, value: string) => {
        const newDemandeurs = [...demandeurs];
        newDemandeurs[index] = { ...newDemandeurs[index], [field]: value };
        
        if (field === 'titre_demandeur') {
            newDemandeurs[index].sexe = value === 'Monsieur' ? 'Homme' : 'Femme';
        }
        
        setDemandeurs(newDemandeurs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation selon le mode
        if (creationMode === 'lot-only' || creationMode === 'lot-demandeur') {
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
        }

        if (creationMode === 'demandeur-only' || creationMode === 'lot-demandeur') {
            for (let i = 0; i < demandeurs.length; i++) {
                const d = demandeurs[i];
                if (!d.titre_demandeur || !d.nom_demandeur) {
                    toast.error(`Demandeur ${i + 1}: Titre et nom sont obligatoires`);
                    return;
                }
                
                if (!d.date_naissance) {
                    toast.error(`Demandeur ${i + 1}: La date de naissance est obligatoire`);
                    return;
                }
            }
        }

        // Préparer les données selon le mode
        if (creationMode === 'lot-demandeur') {
            data.demandeurs_json = JSON.stringify(demandeurs);
            post(route('nouveau-lot.store'), {
                onError: (errors) => {
                    const messages = Object.values(errors).flat();
                    toast.error('Erreur de validation', {
                        description: messages.join('\n')
                    });
                },
                onSuccess: () => {
                    toast.success('Lot et demandeur(s) créés avec succès !');
                }
            });
        } else if (creationMode === 'lot-only') {
            post(route('proprietes.store'), {
                onError: (errors) => {
                    const messages = Object.values(errors).flat();
                    toast.error('Erreur de validation', {
                        description: messages.join('\n')
                    });
                },
                onSuccess: () => {
                    toast.success('Propriété créée avec succès !');
                }
            });
        } else if (creationMode === 'demandeur-only') {
            // Pour chaque demandeur, on fait une requête séparée
            const promises = demandeurs.map((dem) => {
                return new Promise((resolve, reject) => {
                    router.post(route('demandeurs.store'), {
                        ...dem,
                        id_dossier: dossier.id
                    }, {
                        preserveScroll: true,
                        onSuccess: () => resolve(true),
                        onError: (errors) => reject(errors)
                    });
                });
            });

            Promise.all(promises)
                .then(() => {
                    toast.success(`${demandeurs.length} demandeur(s) créé(s) avec succès !`);
                    router.visit(route('dossiers.show', dossier.id));
                })
                .catch((errors) => {
                    toast.error('Erreur lors de la création des demandeurs');
                });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Nouvelle Entrée', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle Entrée" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nouvelle Entrée</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                {/* MODE DE CRÉATION */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Choisir le type de création</CardTitle>
                        <CardDescription>Sélectionnez ce que vous souhaitez créer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={creationMode} onValueChange={(value) => setCreationMode(value as CreationMode)}>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                    creationMode === 'lot-demandeur' ? 'border-primary bg-primary/5' : 'border-border'
                                }`} onClick={() => setCreationMode('lot-demandeur')}>
                                    <RadioGroupItem value="lot-demandeur" id="lot-demandeur" />
                                    <div className="flex-1">
                                        <Label htmlFor="lot-demandeur" className="font-semibold cursor-pointer">
                                            Lot + Demandeur(s)
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Créer une nouvelle propriété avec ses demandeurs
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                    creationMode === 'lot-only' ? 'border-primary bg-primary/5' : 'border-border'
                                }`} onClick={() => setCreationMode('lot-only')}>
                                    <RadioGroupItem value="lot-only" id="lot-only" />
                                    <div className="flex-1">
                                        <Label htmlFor="lot-only" className="font-semibold cursor-pointer">
                                            Lot seulement
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Créer uniquement une propriété
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                    creationMode === 'demandeur-only' ? 'border-primary bg-primary/5' : 'border-border'
                                }`} onClick={() => setCreationMode('demandeur-only')}>
                                    <RadioGroupItem value="demandeur-only" id="demandeur-only" />
                                    <div className="flex-1">
                                        <Label htmlFor="demandeur-only" className="font-semibold cursor-pointer">
                                            Demandeur(s) seulement
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Créer uniquement des demandeurs
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* SECTION PROPRIÉTÉ */}
                    {(creationMode === 'lot-only' || creationMode === 'lot-demandeur') && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {creationMode === 'lot-demandeur' ? '1. ' : ''}Informations de la Propriété
                                </CardTitle>
                                <CardDescription>Champs obligatoires: Lot, Type d'opération, Nature, Vocation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Type d'opération */}
                                <div>
                                    <Label>Type d'opération *</Label>
                                    <Select
                                        value={data.type_operation}
                                        onValueChange={(value) => setData('type_operation', value as 'morcellement' | 'immatriculation')}
                                    >
                                        <SelectTrigger className="w-[220px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="morcellement">Morcellement</SelectItem>
                                            <SelectItem value="immatriculation">Immatriculation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Ligne 1 */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label>Lot *</Label>
                                        <Input
                                            value={data.lot}
                                            onChange={(e) => setData('lot', e.target.value)}
                                            placeholder="T 45"
                                        />
                                    </div>
                                    <div>
                                        <Label>Nature *</Label>
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
                                        <Label>Vocation *</Label>
                                        <Select value={data.vocation} onValueChange={(e) => setData('vocation', e)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner" />
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

                                {/* Ligne 2 */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    {data.type_operation === 'morcellement' && (
                                        <>
                                            <div>
                                                <Label>Propriété mère</Label>
                                                <Input
                                                    value={data.propriete_mere}
                                                    onChange={(e) => setData('propriete_mere', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Titre mère</Label>
                                                <Input
                                                    value={data.titre_mere}
                                                    onChange={(e) => setData('titre_mere', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <Label>Titre</Label>
                                        <Input
                                            value={data.titre}
                                            onChange={(e) => setData('titre', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Nom Propriété / Propriétaire *</Label>
                                        <Input
                                            value={data.proprietaire}
                                            onChange={(e) => setData('proprietaire', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Ligne 3 */}
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
                                            value={data.numero_FN}
                                            onChange={(e) => setData('numero_FN', e.target.value)}
                                        />
                                    </div>
                                    {data.type_operation === 'immatriculation' && (
                                        <div>
                                            <Label>Nº Requisition</Label>
                                            <Input
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
                                                    <label htmlFor={`charge-${charge}`} className="text-sm">
                                                        {charge}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Ligne 4 */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div>
                                        <Label>Situation (sise à) *</Label>
                                        <Input
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
                                            value={data.dep_vol}
                                            onChange={(e) => setData('dep_vol', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* SECTION DEMANDEURS */}
                    {(creationMode === 'demandeur-only' || creationMode === 'lot-demandeur') && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>
                                            {creationMode === 'lot-demandeur' ? '2. ' : ''}Demandeurs ({demandeurs.length})
                                        </CardTitle>
                                        <CardDescription>Les champs obligatoires sont le titre de civilité, le nom, le prénom, la date de naissance et le numéro CIN</CardDescription>
                                    </div>
                                    <Button type="button" onClick={addDemandeur} size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un demandeur
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {demandeurs.map((demandeur, index) => (
                                    <div key={index} className="border rounded-lg p-6 space-y-6 relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Demandeur {index + 1}</h3>
                                            {demandeurs.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeDemandeur(index)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Retirer
                                                </Button>
                                            )}
                                        </div>

                                        {/* Ligne 1: Titre, Nom, Prénom */}
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div>
                                                <Label>Titre de civilité *</Label>
                                                <Select
                                                    value={demandeur.titre_demandeur}
                                                    onValueChange={(value) => updateDemandeur(index, 'titre_demandeur', value)}
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
                                                <Label>Nom *</Label>
                                                <Input
                                                    value={demandeur.nom_demandeur}
                                                    onChange={(e) => updateDemandeur(index, 'nom_demandeur', e.target.value)}
                                                    placeholder="RAKOTO"
                                                />
                                            </div>
                                            <div>
                                                <Label>Prénom *</Label>
                                                <Input
                                                    value={demandeur.prenom_demandeur}
                                                    onChange={(e) => updateDemandeur(index, 'prenom_demandeur', e.target.value)}
                                                    placeholder="Jean"
                                                />
                                            </div>
                                        </div>

                                        {/* Ligne 2: Date naissance, Lieu, Père, Mère */}
                                        <div className="grid gap-4 md:grid-cols-4">
                                            <div>
                                                <Label>Date de naissance *</Label>
                                                <Input
                                                    type="date"
                                                    value={demandeur.date_naissance}
                                                    onChange={(e) => updateDemandeur(index, 'date_naissance', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Lieu de naissance</Label>
                                                <Input
                                                    value={demandeur.lieu_naissance}
                                                    onChange={(e) => updateDemandeur(index, 'lieu_naissance', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Nom Père</Label>
                                                <Input
                                                    value={demandeur.nom_pere}
                                                    onChange={(e) => updateDemandeur(index, 'nom_pere', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Nom Mère</Label>
                                                <Input
                                                    value={demandeur.nom_mere}
                                                    onChange={(e) => updateDemandeur(index, 'nom_mere', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* CIN */}
                                        <div className="w-1/2">
                                            <Label>CIN *</Label>
                                            <InputOTP
                                                maxLength={12}
                                                value={demandeur.cin}
                                                onChange={(value) => updateDemandeur(index, 'cin', value)}
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

                                        {/* Délivrance */}
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
                                                    value={demandeur.lieu_delivrance}
                                                    onChange={(e) => updateDemandeur(index, 'lieu_delivrance', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Date Duplicata</Label>
                                                <Input
                                                    type="date"
                                                    value={demandeur.date_delivrance_duplicata}
                                                    onChange={(e) => updateDemandeur(index, 'date_delivrance_duplicata', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Lieu Duplicata</Label>
                                                <Input
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
                                                    value={demandeur.occupation}
                                                    onChange={(e) => updateDemandeur(index, 'occupation', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Domiciliation</Label>
                                                <Input
                                                    value={demandeur.domiciliation}
                                                    onChange={(e) => updateDemandeur(index, 'domiciliation', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Téléphone</Label>
                                                <Input
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
                                                        <SelectValue />
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
                                                        <SelectValue />
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
                                                    value={demandeur.nationalite}
                                                    onChange={(e) => updateDemandeur(index, 'nationalite', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Infos mariage */}
                                        {demandeur.situation_familiale === 'Marié(e)' && (
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div>
                                                    <Label>Marié(e) à</Label>
                                                    <Input
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
                                                        value={demandeur.lieu_mariage}
                                                        onChange={(e) => updateDemandeur(index, 'lieu_mariage', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
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
                        <Button type="button" onClick={handleSubmit} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Enregistrement...' : 
                                creationMode === 'lot-demandeur' ? 'Créer le lot et demandeur(s)' :
                                creationMode === 'lot-only' ? 'Créer la propriété' :
                                'Créer le(s) demandeur(s)'
                            }
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}