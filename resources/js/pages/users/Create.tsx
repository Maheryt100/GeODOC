// users/Create.tsx - AVEC SUPPORT CENTRAL_USER - STYLED
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
import { ArrowLeft, Save, AlertCircle, Eye, EyeOff, User, Shield, MapPin, Mail, Lock } from 'lucide-react';

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

            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {isEdit 
                                    ? 'Mettre à jour les informations de l\'utilisateur'
                                    : 'Créer un nouveau compte utilisateur'
                                }
                            </p>
                        </div>
                        <Link href="/users">
                            <Button variant="outline" className="h-11">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Button>
                        </Link>
                    </div>
                </div>

                {Object.keys(errors).length > 0 && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.values(errors).map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informations de base */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <CardTitle>Informations de base</CardTitle>
                                    <CardDescription className="mt-1">
                                        Informations d'identification de l'utilisateur
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        <User className="inline h-3 w-3 mr-1" />
                                        Nom complet *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Jean Dupont"
                                        className={`h-11 ${errors.name ? 'border-destructive' : ''}`}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        <Mail className="inline h-3 w-3 mr-1" />
                                        Email *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="jean.dupont@email.com"
                                        className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        <Lock className="inline h-3 w-3 mr-1" />
                                        Mot de passe {!isEdit && '*'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder={isEdit ? 'Laisser vide pour ne pas changer' : '••••••••'}
                                            className={`h-11 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-11 w-11"
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
                                    <Label htmlFor="password_confirmation" className="text-sm font-medium">
                                        <Lock className="inline h-3 w-3 mr-1" />
                                        Confirmer le mot de passe {!isEdit && '*'}
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder={isEdit ? 'Laisser vide pour ne pas changer' : '••••••••'}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            {isEdit && (
                                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                                        Laisser les champs mot de passe vides pour conserver le mot de passe actuel
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Rôle et permissions */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <div>
                                        <CardTitle>Rôle et permissions</CardTitle>
                                        <CardDescription className="mt-1">
                                            Définir le niveau d'accès
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-sm font-medium">Rôle *</Label>
                                    <Select value={data.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger className={`h-11 ${errors.role ? 'border-destructive' : ''}`}>
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
                                    <Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-800 dark:text-amber-200">
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

                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Compte actif</Label>
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
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <CardTitle>Affectation géographique</CardTitle>
                                        <CardDescription className="mt-1">
                                            {noDistrictNeeded
                                                ? 'Ce rôle a accès à tous les districts'
                                                : 'Sélectionner le district de l\'utilisateur'
                                            }
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {noDistrictNeeded ? (
                                    <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                                        <AlertCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800 dark:text-green-200">
                                            Aucune affectation géographique requise pour ce rôle. 
                                            L'utilisateur aura accès à tous les districts.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="province" className="text-sm font-medium">
                                                Province {requiresDistrict && '*'}
                                            </Label>
                                            <Select 
                                                value={selectedProvince} 
                                                onValueChange={handleProvinceChange}
                                                disabled={noDistrictNeeded}
                                            >
                                                <SelectTrigger className="h-11">
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
                                            <Label htmlFor="region" className="text-sm font-medium">
                                                Région {requiresDistrict && '*'}
                                            </Label>
                                            <Select 
                                                value={selectedRegion} 
                                                onValueChange={handleRegionChange}
                                                disabled={!selectedProvince || noDistrictNeeded}
                                            >
                                                <SelectTrigger className="h-11">
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
                                            <Label htmlFor="district" className="text-sm font-medium">
                                                District {requiresDistrict && '*'}
                                            </Label>
                                            <Select 
                                                value={data.id_district} 
                                                onValueChange={handleDistrictChange}
                                                disabled={!selectedRegion || noDistrictNeeded}
                                            >
                                                <SelectTrigger className={`h-11 ${errors.id_district ? 'border-destructive' : ''}`}>
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
                    <div className="flex gap-4 justify-end pt-6 border-t">
                        <Link href="/users">
                            <Button type="button" variant="outline" className="h-11">
                                Annuler
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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