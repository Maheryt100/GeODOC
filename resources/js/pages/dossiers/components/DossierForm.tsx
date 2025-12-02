// resources/js/pages/dossiers/components/DossierForm.tsx
import { useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Calendar, Hash, MapPin } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { District, Dossier } from '@/types';
import { useState, useMemo } from 'react';

// Import des fichiers JSON
import communesData from '@/data/liste_commune_par_district.json';
import districtsData from '@/data/liste_district_par_region.json';

interface DossierFormProps {
    districts: District[];
    dossier?: Dossier; // ✅ Optionnel pour le mode création
    suggested_numero?: string;
    mode: 'create' | 'edit';
    onCancel?: () => void;
}

type CommunesStructure = {
    [region: string]: {
        [district: string]: string[];
    };
};

type DistrictsStructure = {
    [region: string]: string[];
};

export default function DossierForm({ 
    districts, 
    dossier, 
    suggested_numero, 
    mode,
    onCancel 
}: DossierFormProps) {
    const [openDistrict, setOpenDistrict] = useState(false);
    const [openCirconscription, setOpenCirconscription] = useState(false);
    const [openCommune, setOpenCommune] = useState(false);

    // ✅ Initialisation selon le mode
    const { data, setData, post, put, processing, errors } = useForm({
        nom_dossier: dossier?.nom_dossier || '',
        numero_ouverture: dossier?.numero_ouverture || suggested_numero || '',
        type_commune: dossier?.type_commune || '',
        commune: dossier?.commune || '',
        fokontany: dossier?.fokontany || '',
        date_descente_debut: dossier?.date_descente_debut || '',
        date_descente_fin: dossier?.date_descente_fin || '',
        date_ouverture: dossier?.date_ouverture || '',
        circonscription: dossier?.circonscription || '',
        id_district: dossier?.id_district || 0,
    });

    const allDistrictsFromJson = useMemo(() => {
        const typedData = districtsData as DistrictsStructure;
        const districtList: string[] = [];
        
        Object.entries(typedData).forEach(([region, districts]) => {
            if (region === 'Region') return;
            districtList.push(...districts);
        });
        
        return [...new Set(districtList)].sort();
    }, []);

    const filteredCirconscriptionSuggestions = useMemo(() => {
        if (!data.circonscription) return allDistrictsFromJson.slice(0, 50);
        
        const search = data.circonscription.toLowerCase();
        return allDistrictsFromJson.filter(d => 
            d.toLowerCase().includes(search)
        );
    }, [data.circonscription, allDistrictsFromJson]);

    const availableCommunes = useMemo(() => {
        if (!data.circonscription) return [];

        const search = data.circonscription.toLowerCase();
        const communes: string[] = [];
        const typedData = communesData as CommunesStructure;
        
        Object.entries(typedData).forEach(([region, districtsObj]) => {
            if (region === 'Region') return;

            Object.entries(districtsObj).forEach(([district, communesList]) => {
                if (district.toLowerCase().includes(search) || 
                    search.includes(district.toLowerCase())) {
                    communes.push(...communesList);
                }
            });
        });

        return [...new Set(communes)].sort();
    }, [data.circonscription]);

    const filteredCommunes = useMemo(() => {
        if (!data.commune) return availableCommunes;
        
        const search = data.commune.toLowerCase();
        return availableCommunes.filter(c => 
            c.toLowerCase().includes(search)
        );
    }, [availableCommunes, data.commune]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!data.nom_dossier || !data.commune || !data.fokontany || !data.circonscription) {
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
            toast.error("La date d'ouverture est obligatoire");
            return;
        }

        const dateDebut = new Date(data.date_descente_debut);
        const dateFin = new Date(data.date_descente_fin);

        if (dateDebut > dateFin) {
            toast.error('La date de fin doit être postérieure à la date de début');
            return;
        }

        // ✅ Soumission selon le mode
        if (mode === 'create') {
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
        } else {
            put(route('dossiers.update', dossier!.id), {
                onError: (errors) => {
                    const messages = Object.values(errors).flat();
                    toast.error('Erreur de validation', {
                        description: messages.join('\n'),
                    });
                },
                onSuccess: () => {
                    toast.success('Dossier modifié avec succès !');
                },
            });
        }
    };

    const handleDateDebutChange = (value: string) => {
        setData('date_descente_debut', value);
        if (!data.date_ouverture && value) {
            setData('date_ouverture', value);
        }
    };

    const selectedDistrict = districts.find(d => d.id === data.id_district);

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <CardTitle className="text-xl">
                    {mode === 'create' ? 'Informations du Dossier' : 'Modifier le Dossier'}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section Identification */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 pb-3 border-b-2 border-blue-100 dark:border-blue-900">
                            <Hash className="h-4 w-4" />
                            <span>Identification</span>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Nom du dossier <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    value={data.nom_dossier}
                                    onChange={(e) => setData('nom_dossier', e.target.value)}
                                    placeholder="Ex: Ambohimanarina 2025"
                                    required
                                    className="h-11"
                                />
                                {errors.nom_dossier && (
                                    <p className="text-sm text-red-500">{errors.nom_dossier}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Numéro d'ouverture</Label>
                                <Input
                                    type="text"
                                    value={data.numero_ouverture}
                                    onChange={(e) => setData('numero_ouverture', e.target.value)}
                                    placeholder="Laissez vide pour génération automatique"
                                    className="h-11"
                                    disabled={mode === 'edit'} // ✅ Désactiver en édition
                                />
                                <p className="text-xs text-muted-foreground">
                                    {mode === 'create' 
                                        ? 'Un numéro sera généré automatiquement si laissé vide'
                                        : 'Le numéro ne peut pas être modifié'}
                                </p>
                                {errors.numero_ouverture && (
                                    <p className="text-sm text-red-500">{errors.numero_ouverture}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section Localisation */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 pb-3 border-b-2 border-green-100 dark:border-green-900">
                            <MapPin className="h-4 w-4" />
                            <span>Localisation</span>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* District */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    District <span className="text-red-500">*</span>
                                </Label>
                                <Popover open={openDistrict} onOpenChange={setOpenDistrict}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openDistrict}
                                            className="w-full justify-between h-11"
                                        >
                                            {selectedDistrict
                                                ? selectedDistrict.nom_district
                                                : "Sélectionner un district..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un district..." />
                                            <CommandEmpty>Aucun district trouvé.</CommandEmpty>
                                            <CommandList>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {districts
                                                        .slice()
                                                        .sort((a, b) => a.nom_district.localeCompare(b.nom_district, 'fr'))
                                                        .map((district) => (
                                                            <CommandItem
                                                                key={district.id}
                                                                value={district.nom_district}
                                                                onSelect={() => {
                                                                    setData('id_district', district.id);
                                                                    setOpenDistrict(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        data.id_district === district.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {district.nom_district}
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground">
                                    Pour les permissions et données du système
                                </p>
                                {errors.id_district && (
                                    <p className="text-sm text-red-500">{errors.id_district}</p>
                                )}
                            </div>

                            {/* Circonscription */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Circonscription <span className="text-red-500">*</span>
                                </Label>
                                <Popover open={openCirconscription} onOpenChange={setOpenCirconscription}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCirconscription}
                                            className="w-full justify-between h-11 font-normal"
                                        >
                                            {data.circonscription || "Saisir une circonscription..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Taper pour rechercher..."
                                                value={data.circonscription}
                                                onValueChange={(value) => setData('circonscription', value)}
                                            />
                                            <CommandList>
                                                {filteredCirconscriptionSuggestions.length === 0 && data.circonscription ? (
                                                    <CommandEmpty>
                                                        <div className="p-4 text-center">
                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                Aucune suggestion trouvée
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => {
                                                                    setOpenCirconscription(false);
                                                                    toast.info(`"${data.circonscription}" sera enregistré`);
                                                                }}
                                                            >
                                                                ✓ Utiliser "{data.circonscription}"
                                                            </Button>
                                                        </div>
                                                    </CommandEmpty>
                                                ) : (
                                                    <CommandGroup heading="Suggestions" className="max-h-64 overflow-auto">
                                                        {filteredCirconscriptionSuggestions.map((circ) => (
                                                            <CommandItem
                                                                key={circ}
                                                                value={circ}
                                                                onSelect={(value) => {
                                                                    setData('circonscription', value);
                                                                    setOpenCirconscription(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        data.circonscription === circ ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {circ}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground">
                                    Pour les documents officiels (saisie libre)
                                </p>
                                {errors.circonscription && (
                                    <p className="text-sm text-red-500">{errors.circonscription}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Type de commune <span className="text-red-500">*</span>
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant={data.type_commune === 'Commune Urbaine' ? 'default' : 'outline'}
                                        className="h-11"
                                        onClick={() => setData('type_commune', 'Commune Urbaine')}
                                    >
                                        Urbaine
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={data.type_commune === 'Commune Rurale' ? 'default' : 'outline'}
                                        className="h-11"
                                        onClick={() => setData('type_commune', 'Commune Rurale')}
                                    >
                                        Rurale
                                    </Button>
                                </div>
                                {errors.type_commune && (
                                    <p className="text-sm text-red-500">{errors.type_commune}</p>
                                )}
                            </div>

                            {/* Commune */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Commune <span className="text-red-500">*</span>
                                </Label>
                                <Popover open={openCommune} onOpenChange={setOpenCommune}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCommune}
                                            className="w-full justify-between h-11 font-normal"
                                        >
                                            {data.commune || "Saisir une commune..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Taper pour rechercher..."
                                                value={data.commune}
                                                onValueChange={(value) => setData('commune', value)}
                                            />
                                            <CommandList>
                                                {filteredCommunes.length === 0 && data.commune ? (
                                                    <CommandEmpty>
                                                        <div className="p-4 text-center">
                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                Commune non trouvée
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => {
                                                                    setOpenCommune(false);
                                                                    toast.info(`"${data.commune}" sera enregistrée`);
                                                                }}
                                                            >
                                                                ✓ Utiliser "{data.commune}"
                                                            </Button>
                                                        </div>
                                                    </CommandEmpty>
                                                ) : (
                                                    <CommandGroup 
                                                        heading={availableCommunes.length > 0 ? `${availableCommunes.length} suggestions` : "Saisissez une circonscription"} 
                                                        className="max-h-64 overflow-auto"
                                                    >
                                                        {filteredCommunes.map((commune) => (
                                                            <CommandItem
                                                                key={commune}
                                                                value={commune}
                                                                onSelect={(value) => {
                                                                    setData('commune', value);
                                                                    setOpenCommune(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        data.commune === commune ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {commune}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground">
                                    {availableCommunes.length > 0 
                                        ? `${availableCommunes.length} commune(s) disponible(s)`
                                        : "Saisissez une circonscription pour voir les suggestions"}
                                </p>
                                {errors.commune && (
                                    <p className="text-sm text-red-500">{errors.commune}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Fokontany <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={data.fokontany}
                                onChange={(e) => setData('fokontany', e.target.value)}
                                placeholder="Ex: Ambohimanarina Centre"
                                required
                                className="h-11"
                            />
                            {errors.fokontany && (
                                <p className="text-sm text-red-500">{errors.fokontany}</p>
                            )}
                        </div>
                    </div>

                    {/* Section Dates */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 pb-3 border-b-2 border-orange-100 dark:border-orange-900">
                            <Calendar className="h-4 w-4" />
                            <span>Dates</span>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Date début descente <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={data.date_descente_debut}
                                    onChange={(e) => handleDateDebutChange(e.target.value)}
                                    required
                                    className="h-11"
                                />
                                {errors.date_descente_debut && (
                                    <p className="text-sm text-red-500">{errors.date_descente_debut}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Date fin descente <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={data.date_descente_fin}
                                    onChange={(e) => setData('date_descente_fin', e.target.value)}
                                    min={data.date_descente_debut || undefined}
                                    required
                                    className="h-11"
                                />
                                {errors.date_descente_fin && (
                                    <p className="text-sm text-red-500">{errors.date_descente_fin}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Date d'ouverture <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={data.date_ouverture}
                                    onChange={(e) => setData('date_ouverture', e.target.value)}
                                    required
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Date officielle d'ouverture du dossier
                                </p>
                                {errors.date_ouverture && (
                                    <p className="text-sm text-red-500">{errors.date_ouverture}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            Les pièces jointes pourront être ajoutées après la création du dossier
                        </p>
                    </div>
                    
                    {/* Boutons */}
                    <div className="flex gap-4 justify-end pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel || (() => window.history.back())}
                            className="h-11"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing 
                                ? (mode === 'create' ? 'Création...' : 'Modification...') 
                                : (mode === 'create' ? 'Créer le dossier' : 'Enregistrer les modifications')
                            }
                        </Button>
                    </div>
                    
                </form>
                
            </CardContent>
        </Card>
    );
}