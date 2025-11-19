// this is DemandeursProprietes/LierExistant.tsx
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
            if (!data.titre_demandeur || !data.nom_demandeur || !data.cin || !data.date_naissance) {
                toast.error('Titre, nom, CIN et date de naissance sont obligatoires');
                return;
            }
            if (!/^\d{12}$/.test(data.cin)) {
                toast.error('Le CIN doit contenir exactement 12 chiffres');
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
                    {/* ✅ ÉTAPE 1: Sélection de la propriété EN PREMIER */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Sélectionner la propriété (lot)</CardTitle>
                            <CardDescription>
                                Choisissez d'abord la propriété à laquelle vous souhaitez lier un demandeur
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
                                            {proprietes.length === 0 ? (
                                                <div className="p-4 text-center text-muted-foreground">
                                                    Aucune propriété dans ce dossier
                                                </div>
                                            ) : (
                                                proprietes.map((propriete) => (
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

                    {/* ✅ ÉTAPE 2: Sélection du demandeur (visible seulement après sélection de propriété) */}
                    {data.id_propriete && (
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Sélectionner ou rechercher un demandeur</CardTitle>
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

                                {/* Formulaire nouveau demandeur - code identique */}
                            </CardContent>
                        </Card>
                    )}

                    {/* ✅ ÉTAPE 3: Confirmation */}
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