// users/helpers.ts
import { UserRole, UserFilters } from './types';
import { ROLES_REQUIRING_DISTRICT, ROLES_WITH_GLOBAL_ACCESS } from './config';

/**
 * Vérifie si un rôle nécessite une affectation de district
 */
export const requiresDistrict = (role: UserRole): boolean => {
    return ROLES_REQUIRING_DISTRICT.includes(role);
};

/**
 * Vérifie si un rôle a accès à tous les districts
 */
export const hasGlobalAccess = (role: UserRole): boolean => {
    return ROLES_WITH_GLOBAL_ACCESS.includes(role);
};

/**
 * Formate une date au format français
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
};

/**
 * Formate une date et heure au format français
 */
export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

/**
 * Vérifie si des filtres sont actifs
 */
export const hasActiveFilters = (filters: UserFilters): boolean => {
    return !!(filters.role || filters.district || filters.status || filters.search);
};

/**
 * Construit les paramètres de recherche pour l'URL
 */
export const buildSearchParams = (filters: UserFilters): Record<string, string> => {
    const params: Record<string, string> = {};
    
    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.role) params.role = filters.role as string;
    if (filters.district) params.district = filters.district;
    if (filters.status) params.status = filters.status as string;
    
    return params;
};

/**
 * Nettoie tous les filtres
 */
export const clearAllFilters = (): UserFilters => ({
    search: '',
    role: undefined,
    district: undefined,
    status: undefined,
});

/**
 * Calcule le pourcentage d'utilisateurs actifs
 */
export const calculateActivePercentage = (active: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((active / total) * 100);
};

/**
 * Génère un mot de passe aléatoire sécurisé
 */
export const generateSecurePassword = (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    
    return password;
};

/**
 * Tronque un texte à une longueur donnée
 */
export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

/**
 * Formate un nom d'utilisateur (Première lettre en majuscule)
 */
export const formatUserName = (name: string): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Extrait les initiales d'un nom
 */
export const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

/**
 * Valide un email
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Formate un numéro de district avec région et province
 */
export const formatDistrictLocation = (
    district: string,
    region: string,
    province: string
): string => {
    return `${district}, ${region}, ${province}`;
};

/**
 * Détermine si un utilisateur peut être modifié/supprimé
 */
export const canModifyUser = (
    targetUser: { role: UserRole; id: number },
    currentUser: { role: UserRole; id: number; id_district?: number },
    targetUserDistrict?: number
): boolean => {
    // Ne peut pas se modifier/supprimer soi-même
    if (targetUser.id === currentUser.id) return false;
    
    // Super admin peut tout faire
    if (currentUser.role === 'super_admin') return true;
    
    // Admin district ne peut modifier que les users de son district
    if (currentUser.role === 'admin_district') {
        return targetUserDistrict === currentUser.id_district;
    }
    
    return false;
};

/**
 * Trie un tableau d'objets par une propriété
 */
export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

/**
 * Groupe un tableau par une propriété
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
};