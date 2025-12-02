// documents/helpers.ts
import { DocumentType, DemandeurWithOrder } from './types';

/**
 * ✅ Messages de succès pour chaque type de document
 */
export const SUCCESS_MESSAGES: Record<DocumentType, string> = {
    recu: 'Génération du reçu en cours...',
    acte_vente: 'Génération de l\'acte de vente en cours...',
    csf: 'Téléchargement du CSF en cours...',
    requisition: 'Téléchargement de la réquisition en cours...',
};

/**
 * ✅ Messages d'erreur pour chaque type de document
 */
export const ERROR_MESSAGES: Record<DocumentType, string> = {
    recu: 'Erreur lors de la génération du reçu',
    acte_vente: 'Erreur lors de la génération de l\'acte de vente',
    csf: 'Erreur lors de la génération du CSF',
    requisition: 'Erreur lors de la génération de la réquisition',
};

/**
 * ✅ Construire l'URL de téléchargement pour un document
 */
export const buildDownloadUrl = (
    type: DocumentType,
    idPropriete: string | number,
    idDemandeur?: string | number
): string => {
    const params = new URLSearchParams();
    params.append('id_propriete', String(idPropriete));
    
    // ✅ IMPORTANT : Pour ADV avec consorts, toujours passer le demandeur principal
    if (idDemandeur) {
        params.append('id_demandeur', String(idDemandeur));
    }

    const baseUrl = getRouteForDocumentType(type);
    return `${baseUrl}?${params.toString()}`;
};

/**
 * ✅ Obtenir la route Laravel pour un type de document
 */
export const getRouteForDocumentType = (type: DocumentType): string => {
    // Note: Utiliser window.route() si disponible
    const routes: Record<DocumentType, string> = {
        recu: '/documents/recu',
        acte_vente: '/documents/acte-vente',
        csf: '/documents/csf',
        requisition: '/documents/requisition',
    };

    return routes[type];
};

/**
 * ✅ Obtenir le message de succès pour un type de document
 * @param type - Type de document
 * @param hasConsorts - Si le document a des consorts
 * @param nbConsorts - Nombre de consorts (optionnel)
 */
export const getSuccessMessage = (type: DocumentType, hasConsorts?: boolean, nbConsorts?: number): string => {
    if (type === 'acte_vente' && hasConsorts && nbConsorts) {
        return `Génération en cours (${nbConsorts + 1} demandeurs)`;
    }
    
    return SUCCESS_MESSAGES[type];
};

/**
 * ✅ Formater un montant en Ariary
 */
export const formatMontant = (montant: number | string): string => {
    const num = typeof montant === 'string' ? parseFloat(montant) : montant;
    return `${num.toLocaleString('fr-FR')} Ar`;
};

/**
 * ✅ Formater une date (format court)
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
 * ✅ Formater une date et heure (format long)
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
 * ✅ Télécharger un document
 * @param type - Type de document
 * @param idPropriete - ID de la propriété
 * @param idDemandeur - ID du demandeur (optionnel, mais requis pour acte_vente, csf, reçu)
 * @param onSuccess - Callback de succès
 * @param onError - Callback d'erreur
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
 * ✅ Vérifier si une valeur est vide
 */
export const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * ✅ Extraire le nom complet d'un demandeur
 */
export const getFullName = (demandeur: { nom_demandeur: string; prenom_demandeur?: string; titre_demandeur?: string }): string => {
    const parts = [
        demandeur.titre_demandeur,
        demandeur.nom_demandeur,
        demandeur.prenom_demandeur
    ].filter(Boolean);
    
    return parts.join(' ').trim();
};

/**
 * ✅ Obtenir la couleur de badge selon le statut
 */
export const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        confirmed: 'default',
        active: 'default',
        pending: 'secondary',
        archive: 'outline',
        cancelled: 'destructive',
        draft: 'secondary',
    };

    return colors[status] || 'outline';
};

/**
 * ✅ Obtenir le label du statut
 */
export const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        confirmed: 'Confirmé',
        active: 'Actif',
        pending: 'En attente',
        archive: 'Archivé',
        cancelled: 'Annulé',
        draft: 'Brouillon',
    };

    return labels[status] || status;
};

/**
 * ✅ Débounce pour les recherches
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
 * ✅ Copier du texte dans le presse-papiers
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

/**
 * ✅ NOUVEAU : Formater la liste des demandeurs pour affichage
 */
export const formatDemandeursList = (demandeurs: DemandeurWithOrder[]): string => {
    if (demandeurs.length === 0) return 'Aucun demandeur';
    if (demandeurs.length === 1) return getFullName(demandeurs[0].demandeur);
    
    const principal = demandeurs[0];
    const consortsCount = demandeurs.length - 1;
    
    return `${getFullName(principal.demandeur)} et ${consortsCount} consort${consortsCount > 1 ? 's' : ''}`;
};

/**
 * ✅ NOUVEAU : Obtenir l'icône selon le type de document
 */
export const getDocumentIcon = (type: DocumentType): string => {
    const icons: Record<DocumentType, string> = {
        recu: '🧾',
        acte_vente: '📄',
        csf: '✅',
        requisition: '📋',
    };
    
    return icons[type] || '📄';
};

/**
 * ✅ NOUVEAU : Valider les paramètres de génération
 */
export const validateGenerationParams = (
    type: DocumentType,
    idPropriete?: string | number,
    idDemandeur?: string | number
): { valid: boolean; message?: string } => {
    if (!idPropriete) {
        return { valid: false, message: 'ID de propriété manquant' };
    }
    
    // Pour réquisition, pas besoin de demandeur
    if (type === 'requisition') {
        return { valid: true };
    }
    
    // Pour autres documents, demandeur requis
    if (!idDemandeur) {
        return { valid: false, message: 'ID de demandeur manquant' };
    }
    
    return { valid: true };
};