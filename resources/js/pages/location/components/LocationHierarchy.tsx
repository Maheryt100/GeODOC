// resources/js/pages/location/components/LocationHierarchy.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Map, MapPin, Building2, LandPlot } from 'lucide-react';
import DistrictCard from './DistrictCard';
import type { District } from '@/types';

interface Region {
    id: number;
    nom_region: string;
    id_province: number;
    districts: District[];
}

interface Province {
    id: number;
    nom_province: string;
    regions: Region[];
}

interface LocationHierarchyProps {
    provinces: Province[];
    expandedProvinces: string[];
    expandedRegions: string[];
    isSuperAdmin: boolean;
    isPriceComplete: (district: District) => boolean;
    onExpandProvincesChange: (value: string[]) => void;
    onExpandRegionsChange: (value: string[]) => void;
    onDistrictEdit: (district: District) => void;
    onDistrictView: (district: District) => void;
    totalRegions: number;
    totalDistricts: number;
}

export default function LocationHierarchy({
    provinces,
    expandedProvinces,
    expandedRegions,
    isSuperAdmin,
    isPriceComplete,
    onExpandProvincesChange,
    onExpandRegionsChange,
    onDistrictEdit,
    onDistrictView,
    totalRegions,
    totalDistricts
}: LocationHierarchyProps) {
    return (
        <Card className="border-0 shadow-lg">
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 border-b">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Hiérarchie des Localisations</h2>
                        <p className="text-sm text-muted-foreground">
                            {provinces.length} province{provinces.length > 1 ? 's' : ''} • {totalRegions} région{totalRegions > 1 ? 's' : ''} • {totalDistricts} district{totalDistricts > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>
            
            <CardContent className="p-6">
                {provinces.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <LandPlot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Aucune localisation trouvée</p>
                        <p className="text-sm mt-1">Vérifiez vos critères de recherche</p>
                    </div>
                ) : (
                    <Accordion type="multiple" value={expandedProvinces} onValueChange={onExpandProvincesChange}>
                        {provinces.map((province) => (
                            <AccordionItem key={province.id} value={`province-${province.id}`} className="border-b">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-base">{province.nom_province}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {province.regions.length} région{province.regions.length > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-12 pt-3 space-y-3">
                                        <Accordion type="multiple" value={expandedRegions} onValueChange={onExpandRegionsChange}>
                                            {province.regions.map((region) => (
                                                <AccordionItem 
                                                    key={region.id} 
                                                    value={`region-${region.id}`} 
                                                    className="border-l-2 border-blue-200 dark:border-blue-800 ml-2 pl-4"
                                                >
                                                    <AccordionTrigger className="hover:no-underline py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                                                                <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="font-medium text-sm">{region.nom_region}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {region.districts.length} district{region.districts.length > 1 ? 's' : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="pl-11 pt-3 space-y-3">
                                                            {region.districts.map((district) => (
                                                                <DistrictCard
                                                                    key={district.id}
                                                                    district={district}
                                                                    isComplete={isPriceComplete(district)}
                                                                    isSuperAdmin={isSuperAdmin}
                                                                    onEdit={() => onDistrictEdit(district)}
                                                                    onView={() => onDistrictView(district)}
                                                                />
                                                            ))}
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
    );
}