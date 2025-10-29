import { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, Search } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BreadcrumbItem, Dossier, Propriete, Demandeur } from '@/types';

interface PageProps {
    dossier: Dossier;
    proprietes: Propriete[];
    demandeur?: Demandeur;
    cin_search?: string;
    [key: string]: unknown;
}

export default function LierExistant() {
    const { dossier, proprietes, demandeur, cin_search } = usePage<PageProps>().props;
    const [cinInput, setCinInput] = useState(cin_search || '');

    const { data, setData, post, processing } = useForm({
        id_demandeur: demandeur?.id || 0,
        id_propriete: '',
        id_dossier: dossier.id
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!demandeur) {
            toast.error('Veuillez d\'abord rechercher un demandeur');
            return;
        }

        if (!data.id_propriete) {
            toast.error('Veuillez sélectionner une propriété');
            return;
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lier Demandeur existant" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Lier Demandeur existant à une Propriété</h1>
                    <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
                </div>

                <div className="space-y-6">
                    {/* Étape 1: Recherche du demandeur */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Rechercher le demandeur par CIN</CardTitle>
                            <CardDescription>
                                Entrez le CIN d'un demandeur existant (dans n'importe quel dossier)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <Label>CIN (12 chiffres)</Label>
                                    <Input
                                        type="text"
                                        maxLength={12}
                                        placeholder="123456789012"
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
                                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                                ✓ Demandeur trouvé
                                            </p>
                                            <div className="space-y-1 text-sm">
                                                <p>
                                                    <strong>Nom:</strong> {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                                </p>
                                                <p>
                                                    <strong>CIN:</strong> {demandeur.cin}
                                                </p>
                                                <p>
                                                    <strong>Date de naissance:</strong> {demandeur.date_naissance || 'Non renseignée'}
                                                </p>
                                                <p>
                                                    <strong>Domiciliation:</strong> {demandeur.domiciliation || 'Non renseignée'}
                                                </p>
                                                <p>
                                                    <strong>Téléphone:</strong> {demandeur.telephone || 'Non renseigné'}
                                                </p>
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
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-red-800 dark:text-red-200">
                                        ✗ Aucun demandeur trouvé avec le CIN: {cin_search}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Étape 2: Sélection de la propriété */}
                    {demandeur && (
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Sélectionner la propriété</CardTitle>
                                <CardDescription>
                                    Choisissez la propriété à laquelle lier ce demandeur
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Propriété (Lot)</Label>
                                        <Select 
                                            value={data.id_propriete} 
                                            onValueChange={(value) => {
                                                setData('id_propriete', value);
                                                setData('id_demandeur', demandeur.id);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Sélectionner une propriété" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {proprietes.length === 0 ? (
                                                    <div className="p-4 text-center text-muted-foreground">
                                                        Aucune propriété dans ce dossier.
                                                        <br />
                                                        <span className="text-xs">Créez d'abord une propriété.</span>
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
                                            <p className="text-sm font-semibold mb-2">Détails de la propriété sélectionnée:</p>
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

                    {/* Étape 3: Confirmation et validation */}
                    {demandeur && data.id_propriete && (
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
                                            <p>
                                                <strong>Demandeur:</strong> {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur} (CIN: {demandeur.cin})
                                            </p>
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