// users/components/UsersTable.tsx
import { Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Power, MapPin, Search } from 'lucide-react';
import { User } from '../types';
import { ROLE_BADGE_CONFIG, STATUS_CONFIG } from '../config';
import { EmptyState } from './EmptyState';

interface UsersTableProps {
    users: User[];
    onToggleStatus: (user: User) => void;
    onDelete: (user: User) => void;
}

export const UsersTable = ({ users, onToggleStatus, onDelete }: UsersTableProps) => {
    const getRoleBadge = (role: string, roleName: string) => {
        const config = ROLE_BADGE_CONFIG[role as keyof typeof ROLE_BADGE_CONFIG];
        return (
            <Badge variant={config?.variant || 'outline'}>
                {roleName}
            </Badge>
        );
    };

    const getStatusBadge = (status: boolean) => {
        const config = status ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    if (users.length === 0) {
        return (
            <EmptyState
                icon={Search}
                title="Aucun utilisateur trouvé"
                description="Essayez d'ajuster vos filtres de recherche ou créez un nouvel utilisateur"
            />
        );
    }

    return (
        <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                    <tr>
                        <th className="text-left p-3 font-medium">Nom</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Rôle</th>
                        <th className="text-left p-3 font-medium">Localisation</th>
                        <th className="text-left p-3 font-medium">Statut</th>
                        <th className="text-left p-3 font-medium">Créé le</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                            </td>
                            <td className="p-3 text-muted-foreground">{user.email}</td>
                            <td className="p-3">
                                {getRoleBadge(user.role, user.role_name)}
                            </td>
                            <td className="p-3">
                                {user.district ? (
                                    <div className="flex items-start gap-1.5">
                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <div className="font-medium">{user.district.nom_district}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {user.district.nom_region}, {user.district.nom_province}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm italic">
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
                                            <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                                                <Power className="mr-2 h-4 w-4" />
                                                {user.status ? 'Désactiver' : 'Activer'}
                                            </DropdownMenuItem>
                                        )}
                                        {user.can_delete && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => onDelete(user)}
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
                    ))}
                </tbody>
            </table>
        </div>
    );
};