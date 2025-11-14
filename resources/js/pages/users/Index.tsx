// this is users/Index.tsx
import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
    Users, 
    UserPlus, 
    Search, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Power,
    Shield,
    MapPin,
    Filter,
    X,
    Loader2
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    role_name: string;
    status: boolean;
    district: {
        id: number;
        nom_district: string;
        nom_region: string;
        nom_province: string;
    } | null;
    location: string;
    created_at: string;
    can_edit: boolean;
    can_delete: boolean;
}

interface Stats {
    total: number;
    super_admins: number;
    admin_district: number;
    user_district: number;
    active: number;
    inactive: number;
}

interface PageProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    districts: Array<{ id: number; nom_district: string; region: { nom_region: string } }>;
    filters: {
        role?: string;
        district?: string;
        status?: string;
        search?: string;
    };
    roles: Record<string, string>;
}

export default function UsersIndex({ users, stats, districts, filters, roles }: PageProps) {
    // États synchronisés avec le backend
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedDistrict, setSelectedDistrict] = useState(filters.district || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [toggleStatusUser, setToggleStatusUser] = useState<User | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // 🔥 RECHERCHE AUTOMATIQUE avec debounce
    useEffect(() => {
        setIsSearching(true);
        
        // Debounce de 500ms pour la performance
        const timer = setTimeout(() => {
            performSearch();
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search, selectedRole, selectedDistrict, selectedStatus]);

    const performSearch = () => {
        const params: Record<string, string> = {};
        
        if (search.trim()) params.search = search.trim();
        if (selectedRole) params.role = selectedRole;
        if (selectedDistrict) params.district = selectedDistrict;
        if (selectedStatus) params.status = selectedStatus;
        
        router.get('/users', params, { 
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedRole('');
        setSelectedDistrict('');
        setSelectedStatus('');
    };

    const hasActiveFilters = search || selectedRole || selectedDistrict || selectedStatus;

    const getRoleBadge = (role: string, roleName: string) => {
        const variants: Record<string, any> = {
            super_admin: 'destructive',
            admin_district: 'default',
            user_district: 'secondary',
            user: 'outline',
        };
        return (
            <Badge variant={variants[role] || 'outline'}>
                {roleName}
            </Badge>
        );
    };

    const getStatusBadge = (status: boolean) => {
        return status ? (
            <Badge variant="default" className="bg-green-500">Actif</Badge>
        ) : (
            <Badge variant="destructive">Inactif</Badge>
        );
    };

    const handleToggleStatus = (user: User) => {
        router.post(`/users/${user.id}/toggle-status`, {}, {
            onSuccess: () => setToggleStatusUser(null),
        });
    };

    const handleDelete = (user: User) => {
        router.delete(`/users/${user.id}`, {
            onSuccess: () => setDeleteUser(null),
        });
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Utilisateurs', href: '' },
            ]}
        >
            <Head title="Gestion des utilisateurs" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
                        <p className="text-muted-foreground mt-1">
                            Gérer les utilisateurs, leurs rôles et leurs accès aux districts
                        </p>
                    </div>
                    <Link href="/users/create">
                        <Button size="lg">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Nouvel utilisateur
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active} actifs / {stats.inactive} inactifs
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                            <Shield className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.super_admins}</div>
                            <p className="text-xs text-muted-foreground">Accès total</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admins District</CardTitle>
                            <Shield className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.admin_district}</div>
                            <p className="text-xs text-muted-foreground">Gestion district</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Users District</CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.user_district}</div>
                            <p className="text-xs text-muted-foreground">Accès district</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtres avec recherche automatique */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtres de recherche
                            {isSearching && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </CardTitle>
                        <CardDescription>
                            Les résultats se mettent à jour automatiquement pendant la saisie
                        </CardDescription>
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
                                        onClick={clearFilters}
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

                {/* Table des utilisateurs */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Liste des utilisateurs ({users.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Nom</th>
                                        <th className="text-left p-3 font-medium">Email</th>
                                        <th className="text-left p-3 font-medium">Rôle</th>
                                        <th className="text-left p-3 font-medium">District</th>
                                        <th className="text-left p-3 font-medium">Statut</th>
                                        <th className="text-left p-3 font-medium">Créé le</th>
                                        <th className="text-right p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8">
                                                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                                <p className="text-muted-foreground">
                                                    Aucun utilisateur trouvé
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3 font-medium">
                                                    {user.name}
                                                </td>
                                                <td className="p-3">{user.email}</td>
                                                <td className="p-3">
                                                    {getRoleBadge(user.role, user.role_name)}
                                                </td>
                                                <td className="p-3">
                                                    {user.district ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-sm">
                                                                {user.district.nom_district}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">
                                                            Tous les districts
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {getStatusBadge(user.status)}
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {user.created_at}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {user.can_edit && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/users/${user.id}/edit`}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Modifier
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.can_edit && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setToggleStatusUser(user)}
                                                                >
                                                                    <Power className="mr-2 h-4 w-4" />
                                                                    {user.status ? 'Désactiver' : 'Activer'}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.can_delete && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => setDeleteUser(user)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Supprimer
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {users.current_page} sur {users.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {users.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get(`/users?page=${users.current_page - 1}`)}
                                        >
                                            Précédent
                                        </Button>
                                    )}
                                    {users.current_page < users.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get(`/users?page=${users.current_page + 1}`)}
                                        >
                                            Suivant
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Toggle Status */}
            <AlertDialog open={!!toggleStatusUser} onOpenChange={() => setToggleStatusUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {toggleStatusUser?.status ? 'Désactiver' : 'Activer'} l'utilisateur
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Voulez-vous vraiment {toggleStatusUser?.status ? 'désactiver' : 'activer'} l'utilisateur{' '}
                            <strong>{toggleStatusUser?.name}</strong> ?
                            {toggleStatusUser?.status && (
                                <p className="mt-2 text-amber-600">
                                    L'utilisateur ne pourra plus se connecter.
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => toggleStatusUser && handleToggleStatus(toggleStatusUser)}
                        >
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Delete */}
            <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                        <AlertDialogDescription>
                            Voulez-vous vraiment supprimer l'utilisateur{' '}
                            <strong>{deleteUser?.name}</strong> ?
                            <p className="mt-2 text-destructive font-medium">
                                Cette action est irréversible.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive"
                            onClick={() => deleteUser && handleDelete(deleteUser)}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppSidebarLayout>
    );
}