import { useState } from 'react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Demandeurs',
        href: '/demandeurs',
    },
];

interface Region {
    id: number;
    nom_region: string;
    id_province: number;
}

interface Province {
    id: number;
    nom_province: string;
}

interface District {
    id: number;
    nom_district: string;
    id_region: number;
}

interface PageProps {
    province: Province[];
    region: Region[];
    district: District[];
    [key: string]: unknown;
}

export default function Demandeurs() {
    const { province: provinces, region: regions, district: districts } = usePage<PageProps>().props;

    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

    const filteredRegions = selectedProvinceId
        ? regions.filter(region => region.id_province === selectedProvinceId)
        : [];

    const filteredDistricts = selectedRegionId
        ? districts.filter(district => district.id_region === selectedRegionId)
        : [];

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('submitted');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 items-start" id="filtre">
                    <Select onValueChange={(value) => {
                        const province = provinces.find(p => p.nom_province === value);
                        setSelectedProvinceId(province?.id || null);
                        setSelectedRegionId(null); // reset région
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Province" />
                        </SelectTrigger>
                        <SelectContent>
                            {provinces.map((province) => (
                                <SelectItem key={province.id} value={province.nom_province}>
                                    {province.nom_province}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={(value) => {
                            const region = regions.find(r => r.nom_region === value);
                            setSelectedRegionId(region?.id || null);
                        }}
                        disabled={!selectedProvinceId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Région" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredRegions.map((region) => (
                                <SelectItem key={region.id} value={region.nom_region}>
                                    {region.nom_region}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select disabled={!selectedRegionId}>
                        <SelectTrigger>
                            <SelectValue placeholder="District" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredDistricts.map((district) => (
                                <SelectItem key={district.id} value={district.nom_district}>
                                    {district.nom_district}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button type="submit">Filtrer</Button>
                </form>

                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
