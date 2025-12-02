// users/validation.ts
import { UserRole } from './types';

export interface ValidationError {
    field: string;
    message: string;
}

export interface UserFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: UserRole | '';
    id_district: string;
    status: boolean;
}

/**
 * Valide le formulaire de création/modification d'utilisateur
 */
export const validateUserForm = (
    data: UserFormData,
    isEdit: boolean = false
): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Nom
    if (!data.name.trim()) {
        errors.push({ field: 'name', message: 'Le nom est obligatoire' });
    } else if (data.name.trim().length < 3) {
        errors.push({ field: 'name', message: 'Le nom doit contenir au moins 3 caractères' });
    } else if (data.name.trim().length > 255) {
        errors.push({ field: 'name', message: 'Le nom ne peut pas dépasser 255 caractères' });
    }

    // Email
    if (!data.email.trim()) {
        errors.push({ field: 'email', message: "L'email est obligatoire" });
    } else if (!isValidEmail(data.email)) {
        errors.push({ field: 'email', message: "Format d'email invalide" });
    }

    // Mot de passe (obligatoire uniquement en création)
    if (!isEdit) {
        if (!data.password) {
            errors.push({ field: 'password', message: 'Le mot de passe est obligatoire' });
        } else {
            const passwordErrors = validatePassword(data.password);
            errors.push(...passwordErrors);
        }
    } else if (data.password) {
        // En édition, valider uniquement si un nouveau mot de passe est fourni
        const passwordErrors = validatePassword(data.password);
        errors.push(...passwordErrors);
    }

    // Confirmation du mot de passe
    if (data.password && data.password !== data.password_confirmation) {
        errors.push({
            field: 'password_confirmation',
            message: 'Les mots de passe ne correspondent pas',
        });
    }

    // Rôle
    if (!data.role) {
        errors.push({ field: 'role', message: 'Le rôle est obligatoire' });
    }

    // District (obligatoire pour certains rôles)
    if (data.role && requiresDistrict(data.role) && !data.id_district) {
        errors.push({
            field: 'id_district',
            message: 'Un district est requis pour ce rôle',
        });
    }

    return errors;
};

/**
 * Valide un mot de passe
 */
export const validatePassword = (password: string): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (password.length < 8) {
        errors.push({
            field: 'password',
            message: 'Le mot de passe doit contenir au moins 8 caractères',
        });
    }

    if (!/[A-Z]/.test(password)) {
        errors.push({
            field: 'password',
            message: 'Le mot de passe doit contenir au moins une majuscule',
        });
    }

    if (!/[a-z]/.test(password)) {
        errors.push({
            field: 'password',
            message: 'Le mot de passe doit contenir au moins une minuscule',
        });
    }

    if (!/[0-9]/.test(password)) {
        errors.push({
            field: 'password',
            message: 'Le mot de passe doit contenir au moins un chiffre',
        });
    }

    return errors;
};

/**
 * Valide un email
 */
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Vérifie si un rôle nécessite un district
 */
const requiresDistrict = (role: UserRole): boolean => {
    return role === 'admin_district' || role === 'user_district';
};

/**
 * Calcule la force d'un mot de passe
 */
export const calculatePasswordStrength = (password: string): {
    score: number;
    label: string;
    color: string;
} => {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
        return { score, label: 'Faible', color: 'red' };
    } else if (score <= 4) {
        return { score, label: 'Moyen', color: 'orange' };
    } else {
        return { score, label: 'Fort', color: 'green' };
    }
};

/**
 * Valide les filtres de recherche
 */
export const validateSearchFilters = (filters: {
    search?: string;
    role?: string;
    district?: string;
    status?: string;
}): boolean => {
    // Au moins un filtre doit être actif
    return !!(
        filters.search?.trim() ||
        filters.role ||
        filters.district ||
        filters.status
    );
};

/**
 * Sanitize les entrées utilisateur
 */
export const sanitizeInput = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Supprime les balises HTML basiques
        .slice(0, 255); // Limite à 255 caractères
};

/**
 * Valide un CIN (Carte d'Identité Nationale)
 */
export const validateCIN = (cin: string): boolean => {
    // Format : 12 chiffres
    const cinRegex = /^\d{12}$/;
    return cinRegex.test(cin);
};

/**
 * Valide un numéro de téléphone
 */
export const validatePhone = (phone: string): boolean => {
    // Format : 10 chiffres commençant par 03
    const phoneRegex = /^03[0-9]{8}$/;
    return phoneRegex.test(phone);
};