// users/config.ts
import { UserRole } from './types';

/**
 * Configuration des badges de rôle
 */
export const ROLE_BADGE_CONFIG: Record<UserRole, { variant: any; label: string; description: string }> = {
    super_admin: {
        variant: 'destructive',
        label: 'Super Admin',
        description: 'Accès complet à tous les districts et fonctionnalités administratives',
    },
    central_user: {
        variant: 'default',
        label: 'Utilisateur Central',
        description: 'Peut créer, modifier et consulter dans tous les districts, sans permissions d\'administration',
    },
    admin_district: {
        variant: 'default',
        label: 'Admin District',
        description: 'Gestion complète du district assigné (utilisateurs, prix, etc.)',
    },
    user_district: {
        variant: 'secondary',
        label: 'User District',
        description: 'Saisie et consultation uniquement pour le district assigné',
    },
};

/**
 * Configuration des couleurs de statut
 */
export const STATUS_CONFIG = {
    active: {
        variant: 'default' as const,
        className: 'bg-green-500',
        label: 'Actif',
    },
    inactive: {
        variant: 'destructive' as const,
        className: '',
        label: 'Inactif',
    },
};

/**
 * Labels des permissions
 */
export const PERMISSION_LABELS: Record<string, string> = {
    view_statistics: 'Voir les statistiques',
    export_data: 'Exporter les données',
    manage_prices: 'Gérer les prix',
    archive_documents: 'Archiver les documents',
    delete_documents: 'Supprimer les documents',
    manage_consorts: 'Gérer les consorts',
};

/**
 * Configuration de la pagination
 */
export const PAGINATION_CONFIG = {
    perPage: 15,
    maxPages: 5,
};

/**
 * Configuration du debounce pour la recherche
 */
export const SEARCH_CONFIG = {
    debounceDelay: 500,
    minSearchLength: 2,
};

/**
 * Messages de confirmation
 */
export const CONFIRMATION_MESSAGES = {
    delete: (userName: string) => 
        `Voulez-vous vraiment supprimer l'utilisateur ${userName} ? Cette action est irréversible.`,
    toggleStatus: (userName: string, currentStatus: boolean) =>
        `Voulez-vous vraiment ${currentStatus ? 'désactiver' : 'activer'} l'utilisateur ${userName} ?`,
    resetPassword: (userName: string) =>
        `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${userName} ?`,
};

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
    created: (userName: string) => `Utilisateur ${userName} créé avec succès`,
    updated: (userName: string) => `Utilisateur ${userName} modifié avec succès`,
    deleted: (userName: string) => `Utilisateur ${userName} supprimé avec succès`,
    activated: 'Utilisateur activé',
    deactivated: 'Utilisateur désactivé',
    passwordReset: 'Mot de passe réinitialisé avec succès',
};

/**
 * Rôles qui nécessitent une affectation de district
 */
export const ROLES_REQUIRING_DISTRICT: UserRole[] = ['admin_district', 'user_district'];

/**
 * Rôles avec accès global (tous les districts)
 */
export const ROLES_WITH_GLOBAL_ACCESS: UserRole[] = ['super_admin', 'central_user'];