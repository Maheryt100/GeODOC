// resources/js/pages/location/index.tsx

import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, District, User } from '@/types';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// Import des composants
import LocationStatsCards from './components/LocationStatsCards';
import LocationSearchBar from './components/LocationSearchBar';
import LocationHierarchy from './components/LocationHierarchy';
import PriceEditDialog from './components/PriceEditDialog';

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
    const totalRegions = provinces.reduce((acc, p) => acc + p.regions.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster position="top-right" richColors />
            
            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                {/* En-tête */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion des Localisations</h1>
                        <p className="text-muted-foreground mt-1">
                            Vue hiérarchique des provinces, régions et districts avec leurs tarifications
                        </p>
                    </div>

                    {/* Statistiques */}
                    <LocationStatsCards
                        totalDistricts={stats.totalDistricts}
                        districtsWithPrices={stats.districtsWithPrices}
                    />

                    {/* Recherche */}
                    <LocationSearchBar
                        search={search}
                        onSearchChange={setSearch}
                        isSuperAdmin={isSuperAdmin}
                    />
                </div>

                {/* Hiérarchie */}
                <LocationHierarchy
                    provinces={filteredProvinces}
                    expandedProvinces={expandedProvinces}
                    expandedRegions={expandedRegions}
                    isSuperAdmin={isSuperAdmin}
                    isPriceComplete={isPriceComplete}
                    onExpandProvincesChange={setExpandedProvinces}
                    onExpandRegionsChange={setExpandedRegions}
                    onDistrictEdit={(district) => openDistrictDialog(district, 'edit')}
                    onDistrictView={(district) => openDistrictDialog(district, 'view')}
                    totalRegions={totalRegions}
                    totalDistricts={stats.totalDistricts}
                />
            </div>

            {/* Dialog de modification/visualisation */}
            <PriceEditDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                district={selectedDistrict}
                viewMode={viewMode}
                data={data}
                processing={processing}
                onDataChange={(field, value) => setData(field, value)}
                onSubmit={handleSubmit}
            />
        </AppLayout>
    );
}