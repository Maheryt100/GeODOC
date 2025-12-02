// users/types.ts
export type UserRole = 'super_admin' | 'central_user' | 'admin_district' | 'user_district';

export type UserStatus = 'active' | 'inactive';

export interface District {
    id: number;
    nom_district: string;
    region: {
        id: number;
        nom_region: string;
        province?: {
            id: number;
            nom_province: string;
        };
    };
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
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

export interface UserStats {
    total: number;
    super_admins: number;
    central_users: number;
    admin_district: number;
    user_district: number;
    active: number;
    inactive: number;
}

export interface UserFilters {
    role?: UserRole | string; // Permet string pour compatibilité avec les selects
    district?: string;
    status?: UserStatus | string; // Permet string pour compatibilité avec les selects
    search?: string;
}

export interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface UsersIndexProps {
    users: PaginatedUsers;
    stats: UserStats;
    districts: District[];
    filters: UserFilters;
    roles: Record<UserRole, string>;
}

// Types pour les permissions personnalisées
export interface UserPermission {
    id: number;
    id_user: number;
    permission: string;
    granted: boolean;
}

export const AVAILABLE_PERMISSIONS = {
    VIEW_STATISTICS: 'view_statistics',
    EXPORT_DATA: 'export_data',
    MANAGE_PRICES: 'manage_prices',
    ARCHIVE_DOCUMENTS: 'archive_documents',
    DELETE_DOCUMENTS: 'delete_documents',
    MANAGE_CONSORTS: 'manage_consorts',
} as const;

export type PermissionKey = typeof AVAILABLE_PERMISSIONS[keyof typeof AVAILABLE_PERMISSIONS];