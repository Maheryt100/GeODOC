// this is dossiers/create.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { Save } from 'lucide-react';
import type { BreadcrumbItem, District } from '@/types';

interface PageProps {
    districts: District[];
    [key: string]: unknown;
}

export default function Create() {
    const { districts } = usePage<PageProps>().props;

    const { data, setData, post, processing } = useForm({
        nom_dossier: '',
        type_commune: '',
        commune: '',
        fokontany: '',
        date_descente_debut: '',
        date_descente_fin: '',
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
                            {/* Ligne 1: Nom dossier */}
                            <div>
                                <Label className="text-red-500">Nom du dossier *</Label>
                                <Input
                                    type="text"
                                    value={data.nom_dossier}
                                    onChange={(e) => setData('nom_dossier', e.target.value)}
                                    placeholder="Ex: Ambohimanarina 2025"
                                    required
                                />
                            </div>

                            {/* Ligne 2: Type commune */}
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
                                </div>
                            </div>

                            {/* Ligne 3: Commune et Fokontany */}
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
                                </div>
                            </div>

                            {/* Ligne 4: Dates de descente */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-red-500">Date début descente *</Label>
                                    <Input
                                        type="date"
                                        value={data.date_descente_debut}
                                        onChange={(e) => setData('date_descente_debut', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-red-500">Date fin descente *</Label>
                                    <Input
                                        type="date"
                                        value={data.date_descente_fin}
                                        onChange={(e) => setData('date_descente_fin', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Ligne 5: District */}
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
                                            .slice() // Fait une copie pour ne pas muter l'original
                                            .sort((a, b) => a.nom_district.localeCompare(b.nom_district, 'fr')) // Trie en français
                                            .map((district) => (
                                            <SelectItem key={district.id} value={district.id.toString()}>
                                                {district.nom_district}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Boutons */}
                            <div className="flex gap-4 justify-end">
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