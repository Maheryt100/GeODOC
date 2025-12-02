// Statistics/components/StatisticsFilters.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Filter } from 'lucide-react';
import type { StatisticsFilters as Filters, District } from '../types';

interface Props {
    filters: Filters;
    districts: District[];
}

export function StatisticsFilters({ filters, districts }: Props) {
    const [period, setPeriod] = useState(filters.period);
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [districtId, setDistrictId] = useState(filters.district_id?.toString() || 'all');

    const handleFilterChange = () => {
        router.get(route('statistiques.index'), {
            period,
            date_from: period === 'custom' ? dateFrom : null,
            date_to: period === 'custom' ? dateTo : null,
            district_id: districtId !== 'all' ? districtId : null,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtres
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label>Période</Label>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Aujourd'hui</SelectItem>
                                <SelectItem value="week">Cette semaine</SelectItem>
                                <SelectItem value="month">Ce mois</SelectItem>
                                <SelectItem value="year">Cette année</SelectItem>
                                <SelectItem value="custom">Personnalisé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {period === 'custom' && (
                        <>
                            <div className="space-y-2">
                                <Label>Date début</Label>
                                <Input 
                                    type="date" 
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Date fin</Label>
                                <Input 
                                    type="date" 
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>District</Label>
                        <Select value={districtId} onValueChange={setDistrictId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les districts</SelectItem>
                                {districts.map((d) => (
                                    <SelectItem key={d.id} value={d.id.toString()}>
                                        {d.nom_district}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button onClick={handleFilterChange} className="w-full">
                            Appliquer
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}