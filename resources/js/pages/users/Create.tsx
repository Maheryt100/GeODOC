// users/Create.tsx - AVEC SUPPORT CENTRAL_USER
import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Location {
    id: number;
    nom_province: string;
    regions: Array<{
        id: number;
        nom_region: string;
        districts: Array<{
            id: number;
            nom_district: string;
        }>;
    }>;
}

interface PageProps {
    locations: Location[];
    roles: Record<string, string>;
    currentUserDistrict?: number;
    isSuperAdmin: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
        id_district?: number;
        status: boolean;
        district?: {
            id: number;
            nom_district: string;
            id_region: number;
            id_province: number;
        };
    };
}

export default function UserCreateEdit({ locations, roles, currentUserDistrict, isSuperAdmin, user }: PageProps) {
    const isEdit = !!user;
    
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
        role: user?.role || '',
        id_province: user?.district?.id_province?.toString() || '',
        id_region: user?.district?.id_region?.toString() || '',
        id_district: user?.id_district?.toString() || '',
        status: user?.status !== undefined ? user.status : true,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState(data.id_province);
    const [selectedRegion, setSelectedRegion] = useState(data.id_region);

    const regions = selectedProvince 
        ? locations.find(p => p.id.toString() === selectedProvince)?.regions || []
        : [];

    const districts = selectedRegion
        ? regions.find(r => r.id.toString() === selectedRegion)?.districts || []
        : [];

    // ✅ MODIFIÉ : central_user ne nécessite pas de district
    const requiresDistrict = data.role === 'admin_district' || data.role === 'user_district';
    const noDistrictNeeded = data.role === 'super_admin' || data.role === 'central_user';

    const handleProvinceChange = (value: string) => {
        setSelectedProvince(value);
        setData({
            ...data,
            id_province: value,
            id_region: '',
            id_district: '',
        });
        setSelectedRegion('');
    };

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value);
        setData({
            ...data,
            id_region: value,
            id_district: '',
        });
    };

    const handleDistrictChange = (value: string) => {
        setData('id_district', value);
    };

    const handleRoleChange = (value: string) => {
        setData('role', value);
        // ✅ MODIFIÉ : super_admin ET central_user ne doivent pas avoir de district
        if (value === 'super_admin' || value === 'central_user') {
            setData({
                ...data,
                role: value,
                id_province: '',
                id_region: '',
                id_district: '',
            });
            setSelectedProvince('');
            setSelectedRegion('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEdit) {
            put(`/users/${user.id}`);
        } else {
            post('/users');
        }
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Utilisateurs', href: '/users' },
                {
                    title: isEdit ? 'Modifier' : 'Créer',
                    href: ''
                },
            ]}
        >
            <Head title={isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isEdit 
                                ? 'Mettre à jour les informations de l\'utilisateur'
                                : 'Créer un nouveau compte utilisateur'
                            }
                        </p>
                    </div>
                    <Link href="/users">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                    </Link>
                </div>

                {Object.keys(errors).length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="list-disc list-inside">
                                {Object.values(errors).map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Informations de base */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Informations de base</CardTitle>
                                <CardDescription>
                                    Informations d'identification de l'utilisateur
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom complet *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Jean Dupont"
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="jean.dupont@email.com"
                                            className={errors.email ? 'border-destructive' : ''}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">
                                            Mot de passe {!isEdit && '*'}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder={isEdit ? 'Laisser vide pour ne pas changer' : '••••••••'}
                                                className={errors.password ? 'border-destructive' : ''}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">
                                            Confirmer le mot de passe {!isEdit && '*'}
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder={isEdit ? 'Laisser vide pour ne pas changer' : '••••••••'}
                                        />
                                    </div>
                                </div>

                                {isEdit && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Laisser les champs mot de passe vides pour conserver le mot de passe actuel
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Rôle et permissions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Rôle et permissions</CardTitle>
                                <CardDescription>
                                    Définir le niveau d'accès
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Rôle *</Label>
                                    <Select value={data.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Sélectionner un rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roles).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role && (
                                        <p className="text-sm text-destructive">{errors.role}</p>
                                    )}
                                </div>

                                {data.role && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            {data.role === 'super_admin' && (
                                                <span>Accès complet à tous les districts et fonctionnalités administratives</span>
                                            )}
                                            {data.role === 'central_user' && (
                                                <span>Peut créer, modifier et consulter dans <strong>tous les districts</strong>, sans permissions d'administration</span>
                                            )}
                                            {data.role === 'admin_district' && (
                                                <span>Gestion complète du district assigné (utilisateurs, prix, etc.)</span>
                                            )}
                                            {data.role === 'user_district' && (
                                                <span>Saisie et consultation uniquement pour le district assigné</span>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Compte actif</Label>
                                        <p className="text-sm text-muted-foreground">
                                            L'utilisateur peut se connecter
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.status}
                                        onCheckedChange={(checked) => setData('status', checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Affectation district */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Affectation géographique</CardTitle>
                                <CardDescription>
                                    {noDistrictNeeded
                                        ? 'Ce rôle a accès à tous les districts'
                                        : 'Sélectionner le district de l\'utilisateur'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {noDistrictNeeded ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Aucune affectation géographique requise pour ce rôle. 
                                            L'utilisateur aura accès à tous les districts.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="province">Province {requiresDistrict && '*'}</Label>
                                            <Select 
                                                value={selectedProvince} 
                                                onValueChange={handleProvinceChange}
                                                disabled={noDistrictNeeded}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une province" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((province) => (
                                                        <SelectItem key={province.id} value={province.id.toString()}>
                                                            {province.nom_province}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="region">Région {requiresDistrict && '*'}</Label>
                                            <Select 
                                                value={selectedRegion} 
                                                onValueChange={handleRegionChange}
                                                disabled={!selectedProvince || noDistrictNeeded}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une région" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {regions.map((region) => (
                                                        <SelectItem key={region.id} value={region.id.toString()}>
                                                            {region.nom_region}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="district">District {requiresDistrict && '*'}</Label>
                                            <Select 
                                                value={data.id_district} 
                                                onValueChange={handleDistrictChange}
                                                disabled={!selectedRegion || noDistrictNeeded}
                                            >
                                                <SelectTrigger className={errors.id_district ? 'border-destructive' : ''}>
                                                    <SelectValue placeholder="Sélectionner un district" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {districts.map((district) => (
                                                        <SelectItem key={district.id} value={district.id.toString()}>
                                                            {district.nom_district}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {errors.id_district && (
                                                <p className="text-sm text-destructive">{errors.id_district}</p>
                                            )}
                                        </div>

                                        {requiresDistrict && !data.id_district && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Un district est requis pour ce rôle
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 mt-6">
                        <Link href="/users">
                            <Button type="button" variant="outline">
                                Annuler
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            disabled={processing}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppSidebarLayout>
    );
}