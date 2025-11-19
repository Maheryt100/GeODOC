import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { Save, Info, Calendar, Hash, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BreadcrumbItem, District } from '@/types';

interface PageProps {
    districts: District[];
    suggested_numero: string;
    [key: string]: unknown;
}

export default function Create() {
    const { districts, suggested_numero } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        nom_dossier: '',
        numero_ouverture: suggested_numero || '',
        type_commune: '',
        commune: '',
        fokontany: '',
        date_descente_debut: '',
        date_descente_fin: '',
        date_ouverture: '',
        circonscription: '',
        id_district: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!data.nom_dossier || !data.commune || !data.fokontany) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (data.id_district === 0) {
            toast.error('Veuillez sélectionner un district');
            return;
        }

        if (!data.date_descente_debut || !data.date_descente_fin) {
            toast.error('Les dates de descente sont obligatoires');
            return;
        }

        if (!data.date_ouverture) {
            toast.error('La date d\'ouverture est obligatoire');
            return;
        }

        // Vérifier que date_descente_debut <= date_ouverture <= date_descente_fin
        const dateDebut = new Date(data.date_descente_debut);
        const dateFin = new Date(data.date_descente_fin);
        const dateOuverture = new Date(data.date_ouverture);

        if (dateOuverture < dateDebut || dateOuverture > dateFin) {
            toast.error('La date d\'ouverture doit être comprise entre les dates de descente');
            return;
        }

        post(route('dossiers.store'), {
            onError: (errors) => {
                const messages = Object.values(errors).flat();
                toast.error('Erreur de validation', {
                    description: messages.join('\n'),
                });
            },
            onSuccess: () => {
                toast.success('Dossier créé avec succès !');
            },
        });
    };

    // Auto-remplir la date d'ouverture avec la date de début si non définie
    const handleDateDebutChange = (value: string) => {
        setData('date_descente_debut', value);
        if (!data.date_ouverture && value) {
            setData('date_ouverture', value);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: 'Nouveau Dossier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau Dossier" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Nouveau Dossier</h1>
                    <p className="text-muted-foreground">Créer un nouveau dossier de terrain</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations du Dossier</CardTitle>
                        <CardDescription>
                            Tous les champs marqués d'un astérisque (*) sont obligatoires
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Section Identification */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary border-b pb-2">
                                    <Hash className="h-4 w-4" />
                                    <span>Identification du dossier</span>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-red-500">Nom du dossier *</Label>
                                        <Input
                                            type="text"
                                            value={data.nom_dossier}
                                            onChange={(e) => setData('nom_dossier', e.target.value)}
                                            placeholder="Ex: Ambohimanarina 2025"
                                            required
                                        />
                                        {errors.nom_dossier && (
                                            <p className="text-sm text-red-500 mt-1">{errors.nom_dossier}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Numéro d'ouverture</Label>
                                        <Input
                                            type="text"
                                            value={data.numero_ouverture}
                                            onChange={(e) => setData('numero_ouverture', e.target.value)}
                                            placeholder="Ex: DST1-2025-0001"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Un numéro sera généré automatiquement si laissé vide
                                        </p>
                                        {errors.numero_ouverture && (
                                            <p className="text-sm text-red-500 mt-1">{errors.numero_ouverture}</p>
                                        )}
                                    </div>
                                </div>

                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Le numéro d'ouverture est unique par district et suit le format: 
                                        <strong> DST[ID]-ANNÉE-SÉQUENCE</strong>
                                        <br />
                                        Exemple: DST1-2025-0042 (42ème dossier du district 1 en 2025)
                                    </AlertDescription>
                                </Alert>
                            </div>

                            {/* Section Localisation */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary border-b pb-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>Localisation</span>
                                </div>

                                <div>
                                    <Label className="text-red-500">District *</Label>
                                    <Select
                                        value={data.id_district.toString()}
                                        onValueChange={(value) => setData('id_district', parseInt(value))}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un district" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.isArray(districts) &&
                                            districts
                                                .slice()
                                                .sort((a, b) => a.nom_district.localeCompare(b.nom_district, 'fr'))
                                                .map((district) => (
                                                <SelectItem key={district.id} value={district.id.toString()}>
                                                    {district.nom_district}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.id_district && (
                                        <p className="text-sm text-red-500 mt-1">{errors.id_district}</p>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-red-500">Type de commune *</Label>
                                        <Select
                                            value={data.type_commune}
                                            onValueChange={(value) => setData('type_commune', value)}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Commune Urbaine">Commune Urbaine</SelectItem>
                                                <SelectItem value="Commune Rurale">Commune Rurale</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.type_commune && (
                                            <p className="text-sm text-red-500 mt-1">{errors.type_commune}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-red-500">Circonscription *</Label>
                                        <Input
                                            type="text"
                                            value={data.circonscription}
                                            onChange={(e) => setData('circonscription', e.target.value)}
                                            placeholder="Ex: Antananarivo Renivohitra"
                                            required
                                        />
                                        {errors.circonscription && (
                                            <p className="text-sm text-red-500 mt-1">{errors.circonscription}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-red-500">Commune *</Label>
                                        <Input
                                            type="text"
                                            value={data.commune}
                                            onChange={(e) => setData('commune', e.target.value)}
                                            placeholder="Ex: Ambohimanarina"
                                            required
                                        />
                                        {errors.commune && (
                                            <p className="text-sm text-red-500 mt-1">{errors.commune}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-red-500">Fokontany *</Label>
                                        <Input
                                            type="text"
                                            value={data.fokontany}
                                            onChange={(e) => setData('fokontany', e.target.value)}
                                            placeholder="Ex: Ambohimanarina Centre"
                                            required
                                        />
                                        {errors.fokontany && (
                                            <p className="text-sm text-red-500 mt-1">{errors.fokontany}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section Dates */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary border-b pb-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Dates importantes</span>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label className="text-red-500">Date début descente *</Label>
                                        <Input
                                            type="date"
                                            value={data.date_descente_debut}
                                            onChange={(e) => handleDateDebutChange(e.target.value)}
                                            required
                                        />
                                        {errors.date_descente_debut && (
                                            <p className="text-sm text-red-500 mt-1">{errors.date_descente_debut}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-red-500">Date fin descente *</Label>
                                        <Input
                                            type="date"
                                            value={data.date_descente_fin}
                                            onChange={(e) => setData('date_descente_fin', e.target.value)}
                                            min={data.date_descente_debut || undefined}
                                            required
                                        />
                                        {errors.date_descente_fin && (
                                            <p className="text-sm text-red-500 mt-1">{errors.date_descente_fin}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-red-500">Date d'ouverture *</Label>
                                        <Input
                                            type="date"
                                            value={data.date_ouverture}
                                            onChange={(e) => setData('date_ouverture', e.target.value)}
                                            min={data.date_descente_debut || undefined}
                                            max={data.date_descente_fin || undefined}
                                            required
                                        />
                                        {errors.date_ouverture && (
                                            <p className="text-sm text-red-500 mt-1">{errors.date_ouverture}</p>
                                        )}
                                    </div>
                                </div>

                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        La date d'ouverture doit être comprise entre les dates de début et fin de descente.
                                        Elle correspond à la date officielle d'ouverture du dossier.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            {/* Boutons */}
                            <div className="flex gap-4 justify-end pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Créer le dossier'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}