// users/components/FiltersCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Search, Loader2 } from 'lucide-react';
import { District, UserFilters, UserRole } from '../types';

interface FiltersCardProps {
    search: string;
    setSearch: (value: string) => void;
    selectedRole: string;
    setSelectedRole: (value: string) => void;
    selectedDistrict: string;
    setSelectedDistrict: (value: string) => void;
    selectedStatus: string;
    setSelectedStatus: (value: string) => void;
    districts: District[];
    roles: Record<UserRole, string>;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    isSearching: boolean;
}

export const FiltersCard = ({
    search,
    setSearch,
    selectedRole,
    setSelectedRole,
    selectedDistrict,
    setSelectedDistrict,
    selectedStatus,
    setSelectedStatus,
    districts,
    roles,
    hasActiveFilters,
    onClearFilters,
    isSearching,
}: FiltersCardProps) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <div>
                            <CardTitle>Filtres de recherche</CardTitle>
                            <CardDescription className="mt-1">
                                Les résultats se mettent à jour automatiquement
                            </CardDescription>
                        </div>
                    </div>
                    {isSearching && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Recherche */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nom ou email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        {/* Rôle */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rôle</label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les rôles" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(roles).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* District */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">District</label>
                            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les districts" />
                                </SelectTrigger>
                                <SelectContent>
                                    {districts.map((district) => (
                                        <SelectItem key={district.id} value={district.id.toString()}>
                                            {district.nom_district} ({district.region.nom_region})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Statut */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Statut</label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Actif</SelectItem>
                                    <SelectItem value="inactive">Inactif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Bouton réinitialiser */}
                    {hasActiveFilters && (
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClearFilters}
                                size="sm"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Réinitialiser les filtres
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};