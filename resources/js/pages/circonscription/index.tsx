// resources/js/pages/location/index.tsx
// ⚠️ IMPORTANT : Créez ce fichier dans resources/js/pages/location/index.tsx
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, District, SharedData, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { 
    ChevronDown, 
    ChevronRight, 
    MapPin, 
    Building2, 
    Map,
    Pencil,
    AlertCircle,
    CheckCircle2,
    Search,
    Eye
} from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

interface Province {
    id: number;
    nom_province: string;
    regions: Region[];
}

interface Region {
    id: number;
    nom_region: string;
    id_province: number;
    districts: District[];
}

interface LocationPageProps {
    provinces: Province[];
    auth: { user: User };
}

interface PriceFormData {
    id: number;
    edilitaire: number;
    agricole: number;
    forestiere: number;
    touristique: number;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestion des localisations',
        href: '/location',
    },
];

export default function LocationIndex({ provinces, auth }: LocationPageProps) {
    const [search, setSearch] = useState("");
    const [expandedProvinces, setExpandedProvinces] = useState<string[]>([]);
    const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'view'>('view');

    const isSuperAdmin = auth.user.role === 'super_admin';

    const { data, setData, post, reset, processing } = useForm<PriceFormData>({
        id: 0,
        edilitaire: 0,
        agricole: 0,
        forestiere: 0,
        touristique: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('circonscription.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                reset();
                toast.success('Prix mis à jour avec succès');
            },
            onError: (errors) => {
                console.error('Erreurs:', errors);
                toast.error('Erreur lors de la mise à jour des prix');
            }
        });
    };

    const openDistrictDialog = (district: District, mode: 'edit' | 'view') => {
        setViewMode(mode);
        setSelectedDistrict(district);
        setData({
            id: district.id,
            edilitaire: district.edilitaire || 0,
            agricole: district.agricole || 0,
            forestiere: district.forestiere || 0,
            touristique: district.touristique || 0,
        });
        setIsDialogOpen(true);
    };

    const formatPrice = (price: number | null | undefined): string => {
        if (price === null || price === undefined || price === 0) {
            return '0';
        }
        return price.toLocaleString('fr-FR');
    };

    const isPriceComplete = (district: District): boolean => {
        return (district.edilitaire || 0) > 0 && 
               (district.agricole || 0) > 0 && 
               (district.forestiere || 0) > 0 && 
               (district.touristique || 0) > 0;
    };

    // Filtrer les provinces/régions/districts selon la recherche
    const filteredProvinces = provinces.map(province => ({
        ...province,
        regions: province.regions.map(region => ({
            ...region,
            districts: region.districts.filter(district =>
                district.nom_district.toLowerCase().includes(search.toLowerCase())
            )
        })).filter(region => 
            region.nom_region.toLowerCase().includes(search.toLowerCase()) ||
            region.districts.length > 0
        )
    })).filter(province => 
        province.nom_province.toLowerCase().includes(search.toLowerCase()) ||
        province.regions.length > 0
    );

    // Compter les statistiques
    const getTotalStats = () => {
        let totalDistricts = 0;
        let districtsWithPrices = 0;

        provinces.forEach(province => {
            province.regions.forEach(region => {
                region.districts.forEach(district => {
                    totalDistricts++;
                    if (isPriceComplete(district)) {
                        districtsWithPrices++;
                    }
                });
            });
        });

        return { totalDistricts, districtsWithPrices };
    };

    const stats = getTotalStats();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster position="top-right" richColors />
            
            <div className="space-y-6">
                {/* En-tête */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion des Localisations</h1>
                        <p className="text-muted-foreground mt-1">
                            Vue hiérarchique des provinces, régions et districts avec leurs tarifications
                        </p>
                    </div>

                    {/* Statistiques */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Districts</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalDistricts}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Prix Configurés</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.districtsWithPrices}</div>
                                <p className="text-xs text-muted-foreground">
                                    {Math.round((stats.districtsWithPrices / stats.totalDistricts) * 100)}% complétés
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Prix Manquants</CardTitle>
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">
                                    {stats.totalDistricts - stats.districtsWithPrices}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recherche */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Rechercher une province, région ou district..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {!isSuperAdmin && (
                            <Badge variant="outline" className="ml-auto">
                                <Eye className="mr-1 h-3 w-3" />
                                Mode lecture seule
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Hiérarchie Province > Région > District */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Map className="h-5 w-5" />
                            Hiérarchie des Localisations
                        </CardTitle>
                        <CardDescription>
                            {filteredProvinces.length} province(s) • {provinces.reduce((acc, p) => acc + p.regions.length, 0)} région(s) • {stats.totalDistricts} district(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredProvinces.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune localisation trouvée</p>
                            </div>
                        ) : (
                            <Accordion type="multiple" value={expandedProvinces} onValueChange={setExpandedProvinces}>
                                {filteredProvinces.map((province) => (
                                    <AccordionItem key={province.id} value={`province-${province.id}`}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                                                    <Map className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold">{province.nom_province}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {province.regions.length} région(s)
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-11 pt-2 space-y-2">
                                                <Accordion type="multiple" value={expandedRegions} onValueChange={setExpandedRegions}>
                                                    {province.regions.map((region) => (
                                                        <AccordionItem key={region.id} value={`region-${region.id}`} className="border-l-2 border-primary/20 ml-4">
                                                            <AccordionTrigger className="hover:no-underline py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/10">
                                                                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <div className="font-medium text-sm">{region.nom_region}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {region.districts.length} district(s)
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="pl-10 pt-2 space-y-2">
                                                                    {region.districts.map((district) => {
                                                                        const isComplete = isPriceComplete(district);
                                                                        return (
                                                                            <div
                                                                                key={district.id}
                                                                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                                                    isComplete 
                                                                                        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                                                                                        : 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center gap-3 flex-1">
                                                                                    <div className={`flex items-center justify-center w-6 h-6 rounded ${
                                                                                        isComplete 
                                                                                            ? 'bg-green-100 dark:bg-green-900'
                                                                                            : 'bg-amber-100 dark:bg-amber-900'
                                                                                    }`}>
                                                                                        <Building2 className={`h-3 w-3 ${
                                                                                            isComplete ? 'text-green-700' : 'text-amber-700'
                                                                                        }`} />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="font-medium text-sm">{district.nom_district}</div>
                                                                                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                                                                            <span>Édilitaire: <span className="font-mono">{formatPrice(district.edilitaire)}</span> Ar/m²</span>
                                                                                            <span>Agricole: <span className="font-mono">{formatPrice(district.agricole)}</span> Ar/m²</span>
                                                                                            <span>Forestière: <span className="font-mono">{formatPrice(district.forestiere)}</span> Ar/m²</span>
                                                                                            <span>Touristique: <span className="font-mono">{formatPrice(district.touristique)}</span> Ar/m²</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    {isComplete ? (
                                                                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                                            Complet
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                                                                                            <AlertCircle className="mr-1 h-3 w-3" />
                                                                                            Incomplet
                                                                                        </Badge>
                                                                                    )}
                                                                                    {isSuperAdmin ? (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => openDistrictDialog(district, 'edit')}
                                                                                        >
                                                                                            <Pencil className="h-4 w-4 mr-1" />
                                                                                            Modifier
                                                                                        </Button>
                                                                                    ) : (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => openDistrictDialog(district, 'view')}
                                                                                        >
                                                                                            <Eye className="h-4 w-4 mr-1" />
                                                                                            Voir
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog de modification/visualisation des prix */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {viewMode === 'edit' ? 'Modifier les prix' : 'Détails des prix'} - {selectedDistrict?.nom_district}
                            </DialogTitle>
                            <DialogDescription>
                                {viewMode === 'edit' 
                                    ? 'Définir le prix au m² pour chaque vocation de terrain. Les valeurs sont en Ariary (Ar).'
                                    : 'Visualisation des prix au m² pour chaque vocation de terrain.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-6">
                            <div className="grid gap-3">
                                <Label htmlFor="edilitaire" className="flex items-center">
                                    <span className="font-semibold">Édilitaire</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        (Construction/Habitation)
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="edilitaire"
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="0"
                                        value={data.edilitaire}
                                        onChange={(e) => setData('edilitaire', Number(e.target.value))}
                                        className="pr-12"
                                        disabled={viewMode === 'view'}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        Ar/m²
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid gap-3">
                                <Label htmlFor="agricole" className="flex items-center">
                                    <span className="font-semibold">Agricole</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        (Culture/Agriculture)
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="agricole"
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="0"
                                        value={data.agricole}
                                        onChange={(e) => setData('agricole', Number(e.target.value))}
                                        className="pr-12"
                                        disabled={viewMode === 'view'}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        Ar/m²
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid gap-3">
                                <Label htmlFor="forestiere" className="flex items-center">
                                    <span className="font-semibold">Forestière</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        (Forêt/Boisement)
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="forestiere"
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="0"
                                        value={data.forestiere}
                                        onChange={(e) => setData('forestiere', Number(e.target.value))}
                                        className="pr-12"
                                        disabled={viewMode === 'view'}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        Ar/m²
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid gap-3">
                                <Label htmlFor="touristique" className="flex items-center">
                                    <span className="font-semibold">Touristique</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        (Hôtellerie/Tourisme)
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="touristique"
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="0"
                                        value={data.touristique}
                                        onChange={(e) => setData('touristique', Number(e.target.value))}
                                        className="pr-12"
                                        disabled={viewMode === 'view'}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        Ar/m²
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    disabled={processing}
                                >
                                    {viewMode === 'edit' ? 'Annuler' : 'Fermer'}
                                </Button>
                            </DialogClose>
                            {viewMode === 'edit' && (
                                <Button 
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}