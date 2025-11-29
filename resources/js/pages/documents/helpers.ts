// documents/helpers.ts
import { DocumentType } from './types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from './config';

/**
 * Construire l'URL de téléchargement pour un document
 */
export const buildDownloadUrl = (
    type: DocumentType,
    idPropriete: string | number,
    idDemandeur?: string | number
): string => {
    const params = new URLSearchParams();
    params.append('id_propriete', String(idPropriete));
    
    if (idDemandeur) {
        params.append('id_demandeur', String(idDemandeur));
    }

    const baseUrl = getRouteForDocumentType(type);
    return `${baseUrl}?${params.toString()}`;
};

/**
 * Obtenir la route Laravel pour un type de document
 */
export const getRouteForDocumentType = (type: DocumentType): string => {
    const routes: Record<DocumentType, string> = {
        recu: route('documents.recu'),
        acte_vente: route('documents.acte-vente'),
        csf: route('documents.csf'),
        requisition: route('documents.requisition'),
    };

    return routes[type];
};

/**
 * Obtenir le message de succès pour un type de document
 */
export const getSuccessMessage = (type: DocumentType, hasConsorts?: boolean, nbConsorts?: number): string => {
    if (type === 'acte_vente' && hasConsorts && nbConsorts) {
        return `Téléchargement en cours (${nbConsorts} demandeurs)`;
    }
    
    return SUCCESS_MESSAGES[type];
};

/**
 * Formater un montant en Ariary
 */
export const formatMontant = (montant: number | string): string => {
    const num = typeof montant === 'string' ? parseFloat(montant) : montant;
    return `${num.toLocaleString('fr-FR')} Ar`;
};

/**
 * Formater une date
 */
export const formatDate = (date: string | Date): string => {
    if (!date) return '-';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Formater une date et heure
 */
export const formatDateTime = (date: string | Date): string => {
    if (!date) return '-';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Télécharger un document
 */
export const downloadDocument = (
    type: DocumentType,
    idPropriete: string | number,
    idDemandeur?: string | number,
    onSuccess?: () => void,
    onError?: (error: Error) => void
): void => {
    try {
        const url = buildDownloadUrl(type, idPropriete, idDemandeur);
        window.location.href = url;
        
        if (onSuccess) {
            onSuccess();
        }
    } catch (error) {
        console.error('Erreur téléchargement document:', error);
        
        if (onError) {
            onError(error as Error);
        }
    }
};

/**
 * Vérifier si une valeur est vide
 */
export const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Extraire le nom complet d'un demandeur
 */
export const getFullName = (demandeur: { nom: string; prenom?: string }): string => {
    return `${demandeur.nom} ${demandeur.prenom || ''}`.trim();
};

/**
 * Obtenir la couleur de badge selon le statut
 */
export const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        confirmed: 'default',
        active: 'default',
        pending: 'secondary',
        archive: 'outline',
        cancelled: 'destructive',
    };

    return colors[status] || 'outline';
};

/**
 * Obtenir le label du statut
 */
export const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        confirmed: 'Confirmé',
        active: 'Actif',
        pending: 'En attente',
        archive: 'Archivé',
        cancelled: 'Annulé',
    };

    return labels[status] || status;
};

/**
 * Débounce pour les recherches
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Copier du texte dans le presse-papiers
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Erreur copie presse-papiers:', error);
        return false;
    }
};