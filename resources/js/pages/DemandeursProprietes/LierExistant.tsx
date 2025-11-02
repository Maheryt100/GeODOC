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
import { Link2, Search, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem, Dossier, Propriete, Demandeur } from '@/types';

interface PageProps {
    dossier: Dossier & {
        demandeurs: Demandeur[];
    };
    proprietes: Propriete[];
    demandeur?: Demandeur;
    cin_search?: string;
    id_propriete?: number;
    [key: string]: unknown;
}

export default function LierExistant() {
    const { dossier, proprietes, demandeur, cin_search, id_propriete } = usePage<PageProps>().props;
    const [cinInput, setCinInput] = useState(cin_search || '');
    const [searchMode, setSearchMode] = useState<'dossier' | 'externe'>('dossier');
    const [selectedDossierDemandeur, setSelectedDossierDemandeur] = useState<Demandeur | null>(
        demandeur || null
    );
    const [showNewDemandeurForm, setShowNewDemandeurForm] = useState(false);

    const { data, setData, post, processing } = useForm({
        id_demandeur: demandeur?.id || 0,
        id_propriete: id_propriete?.toString() || '',
        id_dossier: dossier.id,
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
        telephone: '',
        mode: 'existant' as 'existant' | 'nouveau'
    });

    const handleSearchCin = () => {
        if (!/^\d{12}$/.test(cinInput)) {
            toast.error('Le CIN doit contenir exactement 12 chiffres');
            return;
        }

        router.post(route('lier-demandeur.search'), {
            cin: cinInput,
            id_dossier: dossier.id
        });
    };

    const handleSelectDossierDemandeur = (dem: Demandeur) => {
        setSelectedDossierDemandeur(dem);
        setData('id_demandeur', dem.id);
        setData('mode', 'existant');
    };

    const handleTitre = (value: string) => {
        setData({
            ...data,
            titre_demandeur: value,
            sexe: value === 'Monsieur' ? 'Homme' : 'Femme',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.id_propriete) {
            toast.error('Veuillez sélectionner une propriété');
            return;
        }

        if (data.mode === 'existant') {
            if (!selectedDossierDemandeur && !demandeur) {
                toast.error('Veuillez sélectionner un demandeur');
                return;
            }
        } else {
            if (!data.titre_demandeur || !data.nom_demandeur || !data.cin) {
                toast.error('Titre, nom et CIN sont obligatoires');
                return;
            }
            if (!/^\d{12}$/.test(data.cin)) {
                toast.error('Le CIN doit contenir exactement 12 chiffres');
                return;
            }
            if (!data.date_naissance || !data.lieu_naissance || !data.occupation || 
                !data.nom_mere || !data.date_delivrance || !data.lieu_delivrance || !data.domiciliation) {
                toast.error('Tous les champs obligatoires doivent être remplis');
                return;
            }
        }

        post(route('lier-demandeur.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur', {
                    description: messages.join('\n')
                });
            },
            onSuccess: () => {
                toast.success('Demandeur lié à la propriété avec succès !');
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Lier Demandeur existant', href: '#' }
    ];

    const proprieteSelectionnee = proprietes.find(p => p.id.toString() === data.id_propriete);

    const proprietesDisponibles = proprietes.filter(prop => {
        if (!selectedDossierDemandeur && !demandeur) return true;
        const demandeurId = selectedDossierDemandeur?.id || demandeur?.id;
        return !prop.demandeurs?.some(d => d.id === demandeurId);
    });

    const demandeursDossier = dossier.demandeurs || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lier Demandeur existant" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Lier Demandeur existant à une Propriété</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Sélectionner ou rechercher un demandeur</CardTitle>
                            <CardDescription>
                                Choisissez un demandeur du dossier ou recherchez par CIN
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4 border-b pb-4">
                                <Button
                                    type="button"
                                    variant={searchMode === 'dossier' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setSearchMode('dossier');
                                        setShowNewDemandeurForm(false);
                                    }}
                                >
                                    Demandeurs du dossier ({demandeursDossier.length})
                                </Button>
                                <Button
                                    type="button"
                                    variant={searchMode === 'externe' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setSearchMode('externe');
                                        setSelectedDossierDemandeur(null);
                                        setShowNewDemandeurForm(false);
                                    }}
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Rechercher par CIN/Nom
                                </Button>
                            </div>

                            {searchMode === 'dossier' && (
                                <div className="space-y-3">
                                    {demandeursDossier.length === 0 ? (
                                        <div className="text-center p-8 border rounded-lg border-dashed">
                                            <p className="text-muted-foreground mb-4">
                                                Aucun demandeur dans ce dossier
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setSearchMode('externe')}
                                            >
                                                Rechercher un demandeur externe
                                            </Button>
                                        </div>
                                    ) : (
                                        demandeursDossier.map((dem) => (
                                            <div
                                                key={dem.id}
                                                className={`p-4 border rounded-lg cursor-pointer transition ${
                                                    selectedDossierDemandeur?.id === dem.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:border-primary/50'
                                                }`}
                                                onClick={() => handleSelectDossierDemandeur(dem)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-semibold">
                                                            {dem.titre_demandeur} {dem.nom_demandeur} {dem.prenom_demandeur}
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                                                            <p><strong>CIN:</strong> {dem.cin}</p>
                                                            <p><strong>Naissance:</strong> {dem.date_naissance || '-'}</p>
                                                            <p><strong>Domiciliation:</strong> {dem.domiciliation || '-'}</p>
                                                            <p><strong>Téléphone:</strong> {dem.telephone || '-'}</p>
                                                        </div>
                                                    </div>
                                                    {selectedDossierDemandeur?.id === dem.id && (
                                                        <Badge>Sélectionné</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {searchMode === 'externe' && !showNewDemandeurForm && (
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <Label>Rechercher par CIN ou Nom</Label>
                                            <Input
                                                type="text"
                                                placeholder="CIN (12 chiffres) ou Nom du demandeur"
                                                value={cinInput}
                                                onChange={(e) => setCinInput(e.target.value)}
                                            />
                                        </div>
                                        <Button type="button" onClick={handleSearchCin}>
                                            <Search className="mr-2 h-4 w-4" />
                                            Rechercher
                                        </Button>
                                    </div>

                                    {demandeur && (
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                                        ✓ Demandeur trouvé
                                                    </p>
                                                    <div className="space-y-1 text-sm">
                                                        <p>
                                                            <strong>Nom:</strong> {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                                        </p>
                                                        <p><strong>CIN:</strong> {demandeur.cin}</p>
                                                        <p><strong>Date de naissance:</strong> {demandeur.date_naissance || 'Non renseignée'}</p>
                                                        <p><strong>Domiciliation:</strong> {demandeur.domiciliation || 'Non renseignée'}</p>
                                                        <p><strong>Téléphone:</strong> {demandeur.telephone || 'Non renseigné'}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setCinInput('');
                                                        router.visit(route('lier-demandeur.create', dossier.id));
                                                    }}
                                                >
                                                    Chercher un autre
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {!demandeur && cin_search && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <p className="text-red-800 dark:text-red-200 mb-3">
                                                ✗ Aucun demandeur trouvé avec: {cin_search}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowNewDemandeurForm(true);
                                                    setData('mode', 'nouveau');
                                                    setData('cin', cin_search);
                                                }}
                                            >
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Créer ce demandeur
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {showNewDemandeurForm && (
                                <div className="space-y-6 border-t pt-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">Nouveau Demandeur</h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setShowNewDemandeurForm(false);
                                                setData('mode', 'existant');
                                            }}
                                        >
                                            Annuler
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Titre de civilité *</Label>
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
                                            <Label>Nom *</Label>
                                            <Input
                                                value={data.nom_demandeur}
                                                onChange={(e) => setData('nom_demandeur', e.target.value)}
                                                placeholder="RAKOTO"
                                            />
                                        </div>
                                        <div>
                                            <Label>Prénom</Label>
                                            <Input
                                                value={data.prenom_demandeur}
                                                onChange={(e) => setData('prenom_demandeur', e.target.value)}
                                                placeholder="Jean"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div>
                                            <Label>Date de naissance *</Label>
                                            <Input
                                                type="date"
                                                value={data.date_naissance}
                                                onChange={(e) => setData('date_naissance', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Lieu de naissance *</Label>
                                            <Input
                                                value={data.lieu_naissance}
                                                onChange={(e) => setData('lieu_naissance', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Nom Père</Label>
                                            <Input
                                                value={data.nom_pere}
                                                onChange={(e) => setData('nom_pere', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Nom Mère *</Label>
                                            <Input
                                                value={data.nom_mere}
                                                onChange={(e) => setData('nom_mere', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="w-1/2">
                                        <Label>CIN *</Label>
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
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div>
                                            <Label>Date Délivrance *</Label>
                                            <Input
                                                type="date"
                                                value={data.date_delivrance}
                                                onChange={(e) => setData('date_delivrance', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Lieu Délivrance *</Label>
                                            <Input
                                                value={data.lieu_delivrance}
                                                onChange={(e) => setData('lieu_delivrance', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Date Duplicata</Label>
                                            <Input
                                                type="date"
                                                value={data.date_delivrance_duplicata}
                                                onChange={(e) => setData('date_delivrance_duplicata', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Lieu Duplicata</Label>
                                            <Input
                                                value={data.lieu_delivrance_duplicata}
                                                onChange={(e) => setData('lieu_delivrance_duplicata', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Occupation *</Label>
                                            <Input
                                                value={data.occupation}
                                                onChange={(e) => setData('occupation', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Domiciliation *</Label>
                                            <Input
                                                value={data.domiciliation}
                                                onChange={(e) => setData('domiciliation', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Téléphone</Label>
                                            <Input
                                                value={data.telephone}
                                                onChange={(e) => setData('telephone', e.target.value)}
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Situation Familiale *</Label>
                                            <Select
                                                value={data.situation_familiale}
                                                onValueChange={(value) => setData('situation_familiale', value)}
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
                                                value={data.regime_matrimoniale}
                                                onValueChange={(value) => setData('regime_matrimoniale', value)}
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
                                            <Label>Nationalité *</Label>
                                            <Input
                                                value={data.nationalite}
                                                onChange={(e) => setData('nationalite', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {data.situation_familiale === 'Marié(e)' && (
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div>
                                                <Label>Marié(e) à</Label>
                                                <Input
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
                                                    value={data.lieu_mariage}
                                                    onChange={(e) => setData('lieu_mariage', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {((selectedDossierDemandeur || demandeur) || showNewDemandeurForm) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Sélectionner la propriété</CardTitle>
                                <CardDescription>
                                    Propriétés disponibles dans le dossier
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Propriété (Lot)</Label>
                                        <Select 
                                            value={data.id_propriete} 
                                            onValueChange={(value) => setData('id_propriete', value)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Sélectionner une propriété" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {proprietesDisponibles.length === 0 ? (
                                                    <div className="p-4 text-center text-muted-foreground">
                                                        Aucune propriété disponible.
                                                        <br />
                                                        <span className="text-xs">
                                                            Le demandeur est déjà lié à toutes les propriétés.
                                                        </span>
                                                    </div>
                                                ) : (
                                                    proprietesDisponibles.map((propriete) => (
                                                        <SelectItem key={propriete.id} value={propriete.id.toString()}>
                                                            Lot {propriete.lot} - 
                                                            {propriete.titre ? ` TNº${propriete.titre}` : ' Sans titre'} - 
                                                            {propriete.contenance}m² - 
                                                            {propriete.nature}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {proprieteSelectionnee && (
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm font-semibold mb-2">Détails de la propriété:</p>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><strong>Lot:</strong> {proprieteSelectionnee.lot}</div>
                                                <div><strong>Titre:</strong> {proprieteSelectionnee.titre || 'Non renseigné'}</div>
                                                <div><strong>Nature:</strong> {proprieteSelectionnee.nature}</div>
                                                <div><strong>Vocation:</strong> {proprieteSelectionnee.vocation || 'Non renseignée'}</div>
                                                <div><strong>Contenance:</strong> {proprieteSelectionnee.contenance}m²</div>
                                                <div><strong>Propriétaire:</strong> {proprieteSelectionnee.proprietaire || 'Non renseigné'}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {data.id_propriete && ((selectedDossierDemandeur || demandeur) || showNewDemandeurForm) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Confirmation</CardTitle>
                                <CardDescription>Vérifiez les informations avant de valider</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                            Vous allez lier :
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            {showNewDemandeurForm ? (
                                                <p>
                                                    <strong>Nouveau Demandeur:</strong> {data.titre_demandeur} {data.nom_demandeur} {data.prenom_demandeur} (CIN: {data.cin})
                                                </p>
                                            ) : (
                                                <p>
                                                    <strong>Demandeur:</strong> {(selectedDossierDemandeur || demandeur)?.titre_demandeur} {(selectedDossierDemandeur || demandeur)?.nom_demandeur} {(selectedDossierDemandeur || demandeur)?.prenom_demandeur} (CIN: {(selectedDossierDemandeur || demandeur)?.cin})
                                                </p>
                                            )}
                                            <p>
                                                <strong>Propriété:</strong> Lot {proprieteSelectionnee?.lot} - {proprieteSelectionnee?.contenance}m²
                                            </p>
                                            <p className="text-muted-foreground mt-2">
                                                Cette liaison sera enregistrée dans le dossier "{dossier.nom_dossier}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.visit(route('dossiers.show', dossier.id))}
                                        >
                                            Annuler
                                        </Button>
                                        <Button type="button" onClick={handleSubmit} disabled={processing}>
                                            <Link2 className="mr-2 h-4 w-4" />
                                            {processing ? 'Liaison en cours...' : 'Confirmer la liaison'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}