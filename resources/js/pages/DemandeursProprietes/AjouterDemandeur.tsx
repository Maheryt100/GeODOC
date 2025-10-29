import { useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, UserPlus, Search } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BreadcrumbItem, Dossier, Propriete } from '@/types';

interface PageProps {
    dossier: Dossier;
    proprietes: Propriete[];
    [key: string]: unknown;
}

export default function AjouterDemandeur() {
    const { dossier, proprietes } = usePage<PageProps>().props;
    const [mode, setMode] = useState<'nouveau' | 'existant'>('nouveau');
    const [cinSearch, setCinSearch] = useState('');
    const [demandeurTrouve, setDemandeurTrouve] = useState<any>(null);

    const { data, setData, post, processing } = useForm({
        id_propriete: '',
        mode: 'nouveau',
        // Pour nouveau demandeur
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
    });

    const handleTitre = (value: string) => {
        setData('titre_demandeur', value);
        setData('sexe', value === 'Monsieur' ? 'Homme' : 'Femme');
    };

    const handleSearchCin = () => {
        if (!/^\d{12}$/.test(cinSearch)) {
            toast.error('Le CIN doit contenir exactement 12 chiffres');
            return;
        }

        // Simuler une recherche - à remplacer par un appel API réel
        router.post(route('demandeurs.searchCin'), {
            cin: cinSearch,
            id_dossier: dossier.id
        }, {
            onSuccess: (page: any) => {
                if (page.props.demandeur) {
                    setDemandeurTrouve(page.props.demandeur);
                    toast.success('Demandeur trouvé !');
                }
            },
            onError: () => {
                toast.error('Aucun demandeur trouvé avec ce CIN');
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.id_propriete) {
            toast.error('Veuillez sélectionner une propriété');
            return;
        }

        if (mode === 'nouveau') {
            if (!data.nom_demandeur || !data.cin || !data.titre_demandeur) {
                toast.error('Le nom, le CIN et le titre de civilité sont obligatoires');
                return;
            }
            const cinIsValid = /^\d{12}$/.test(data.cin);
            if (!cinIsValid) {
                toast.error('Le CIN ne doit contenir que des chiffres');
                return;
            }
        } else {
            if (!cinSearch || !demandeurTrouve) {
                toast.error('Veuillez rechercher un demandeur existant');
                return;
            }
        }

        const formData = {
            ...data,
            mode: mode,
            cin: mode === 'existant' ? cinSearch : data.cin
        };

        post(route('ajouter-demandeur.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n')
                });
            },
            onSuccess: () => {
                toast.success('Demandeur ajouté à la propriété avec succès !');
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Ajouter Demandeur à un lot', href: '#' }
    ];

    const proprieteSelectionnee = proprietes.find(p => p.id.toString() === data.id_propriete);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajouter Demandeur à un lot" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Ajouter Demandeur à un lot existant</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                <div className="space-y-6">
                    {/* Sélection de la propriété */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Sélectionner le lot (propriété)</CardTitle>
                            <CardDescription>Choisissez la propriété à laquelle ajouter un demandeur</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={data.id_propriete} onValueChange={(value) => setData('id_propriete', value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une propriété" />
                                </SelectTrigger>
                                <SelectContent>
                                    {proprietes.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground">
                                            Aucune propriété dans ce dossier
                                        </div>
                                    ) : (
                                        proprietes.map((propriete) => (
                                            <SelectItem key={propriete.id} value={propriete.id.toString()}>
                                                Lot {propriete.lot} - {propriete.titre || 'Sans titre'} ({propriete.contenance}m²)
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>

                            {proprieteSelectionnee && (
                                <div className="mt-4 p-4 bg-muted rounded-lg">
                                    <p className="text-sm">
                                        <strong>Lot:</strong> {proprieteSelectionnee.lot} • 
                                        <strong> Nature:</strong> {proprieteSelectionnee.nature} • 
                                        <strong> Contenance:</strong> {proprieteSelectionnee.contenance}m²
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Choix du mode */}
                    {data.id_propriete && (
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Choisir le type de demandeur</CardTitle>
                                <CardDescription>Nouveau demandeur ou demandeur existant dans un autre dossier</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={mode} onValueChange={(value: 'nouveau' | 'existant') => {
                                    setMode(value);
                                    setData('mode', value);
                                }}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="nouveau" id="nouveau" />
                                        <Label htmlFor="nouveau" className="cursor-pointer">
                                            <UserPlus className="inline mr-2 h-4 w-4" />
                                            Nouveau demandeur
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="existant" id="existant" />
                                        <Label htmlFor="existant" className="cursor-pointer">
                                            <Search className="inline mr-2 h-4 w-4" />
                                            Demandeur existant (recherche par CIN)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recherche demandeur existant */}
                    {mode === 'existant' && data.id_propriete && (
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Rechercher par CIN</CardTitle>
                                <CardDescription>Entrez le CIN du demandeur existant</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <Label>CIN (12 chiffres)</Label>
                                        <Input
                                            type="text"
                                            maxLength={12}
                                            placeholder="123456789012"
                                            value={cinSearch}
                                            onChange={(e) => setCinSearch(e.target.value)}
                                        />
                                    </div>
                                    <Button type="button" onClick={handleSearchCin}>
                                        <Search className="mr-2 h-4 w-4" />
                                        Rechercher
                                    </Button>
                                </div>

                                {demandeurTrouve && (
                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="font-semibold text-green-800 dark:text-green-200">
                                            ✓ Demandeur trouvé
                                        </p>
                                        <p className="text-sm mt-2">
                                            {demandeurTrouve.titre_demandeur} {demandeurTrouve.nom_demandeur} {demandeurTrouve.prenom_demandeur}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            CIN: {demandeurTrouve.cin}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Formulaire nouveau demandeur */}
                    {mode === 'nouveau' && data.id_propriete && (
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Informations du nouveau demandeur</CardTitle>
                                <CardDescription>Champs obligatoires: Titre, Nom, CIN</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Ligne 1: Titre, Nom, Prénom */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label className="text-red-500">Titre de civilité *</Label>
                                        <Select
                                            value={data.titre_demandeur}
                                            onValueChange={handleTitre}
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
                                            value={data.nom_demandeur}
                                            onChange={(e) => setData('nom_demandeur', e.target.value)}
                                            placeholder="RAKOTO"
                                            required
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
                                    <Label className="text-red-500">CIN *</Label>
                                    <InputOTP
                                        maxLength={12}
                                        minLength={12}
                                        value={data.cin}
                                        onChange={(value) => setData('cin', value)}
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

                                {/* Délivrance et duplicata */}
                                <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Date de délivrance du CIN</Label>
                                    <Input
                                    type="date"
                                    value={data.date_delivrance}
                                    onChange={e => setData('date_delivrance', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Lieu de délivrance du CIN</Label>
                                    <Input
                                    type="text"
                                    value={data.lieu_delivrance}
                                    onChange={e => setData('lieu_delivrance', e.target.value)}
                                    placeholder="Ex: Antananarivo"
                                    />
                                </div>
                                <div></div> {/* Pour aligner */}
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Date de délivrance du duplicata</Label>
                                    <Input
                                    type="date"
                                    value={data.date_delivrance_duplicata}
                                    onChange={e => setData('date_delivrance_duplicata', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Lieu de délivrance du duplicata</Label>
                                    <Input
                                    type="text"
                                    value={data.lieu_delivrance_duplicata}
                                    onChange={e => setData('lieu_delivrance_duplicata', e.target.value)}
                                    placeholder="Ex: Toliara"
                                    />
                                </div>
                                </div>


                                {/* Reste des champs - simplifié */}
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
                                {data.situation_familiale === 'Marié(e)' && (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                    <Label>Date de mariage</Label>
                                    <Input
                                        type="date"
                                        value={data.date_mariage}
                                        onChange={e => setData('date_mariage', e.target.value)}
                                    />
                                    </div>
                                    <div>
                                    <Label>Lieu du mariage</Label>
                                    <Input
                                        type="text"
                                        value={data.lieu_mariage}
                                        onChange={e => setData('lieu_mariage', e.target.value)}
                                    />
                                    </div>
                                    <div>
                                    <Label>Conjoint(e) (Marié à)</Label>
                                    <Input
                                        type="text"
                                        value={data.marie_a}
                                        onChange={e => setData('marie_a', e.target.value)}
                                        placeholder="Nom du/de la conjoint(e)"
                                    />
                                    </div>
                                </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Boutons de soumission */}
                    {data.id_propriete && (
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
                                {processing ? 'Enregistrement...' : 'Ajouter le demandeur'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}