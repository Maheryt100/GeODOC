// this is dossiers/update.tsx
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import type { BreadcrumbItem, Dossier, District } from '@/types';

interface PageProps {
  dossier: Dossier;
  districts: District[];
  [key: string]: unknown;
}

export default function Update() {
  const { dossier, districts } = usePage<PageProps>().props;

  const { data, setData, post, processing } = useForm({
    nom_dossier: dossier.nom_dossier || '',
    type_commune: dossier.type_commune || '',
    commune: dossier.commune || '',
    fokontany: dossier.fokontany || '',
    circonscription: dossier.circonscription || '',
    date_descente_debut: dossier.date_descente_debut || '',
    date_descente_fin: dossier.date_descente_fin || '',
    id_district: dossier.id_district || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!data.nom_dossier) {
      toast.error('Le nom du dossier est obligatoire');
      return;
    }
    if (!data.commune || !data.fokontany) {
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
    if (!data.type_commune) {
      toast.error('Le type de commune est obligatoire');
      return;
    }

    post(route('dossiers.update', dossier.id), {
      onError: (errors) => {
        const messages = Object.values(errors).flat();
        toast.error('Erreur de validation', { description: messages.join('\n') });
      },
      onSuccess: () => {
        toast.success('Dossier modifié avec succès !');
      },
    });
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dossiers', href: route('dossiers') },
    { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
    { title: 'Modification', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Modifier Dossier" />
      <Toaster position="top-right" richColors />

      <div className="container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Modifier le Dossier</h1>
          <p className="text-muted-foreground">Dossier: {dossier.nom_dossier}</p>
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
              {/* Ligne 1: Nom du dossier */}
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

              {/* Ligne 2: Type commune et Circonscription */}
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
                        .slice()
                        .sort((a, b) => a.nom_district.localeCompare(b.nom_district, 'fr'))
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
