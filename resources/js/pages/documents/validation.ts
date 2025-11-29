// documents/validation.ts
import { Demandeur } from '@/types';
import { ProprieteWithDemandeurs } from './types';

/**
 * Vérifier si une propriété a toutes les données requises
 */
export const isProprieteComplete = (prop: ProprieteWithDemandeurs): boolean => {
    return !!(
        prop.titre && 
        prop.contenance && 
        prop.proprietaire && 
        prop.nature && 
        prop.vocation && 
        prop.situation
    );
};

/**
 * Vérifier si un demandeur a toutes les données requises
 */
export const isDemandeurComplete = (dem: Demandeur): boolean => {
    return !!(
        dem.date_naissance && 
        dem.lieu_naissance && 
        dem.date_delivrance && 
        dem.lieu_delivrance && 
        dem.domiciliation && 
        dem.occupation && 
        dem.nom_mere
    );
};

/**
 * Obtenir les champs manquants d'une propriété
 */
export const getMissingProprieteFields = (prop: ProprieteWithDemandeurs): string[] => {
    const missing: string[] = [];
    
    if (!prop.titre) missing.push('Titre');
    if (!prop.contenance) missing.push('Contenance');
    if (!prop.proprietaire) missing.push('Propriétaire');
    if (!prop.nature) missing.push('Nature');
    if (!prop.vocation) missing.push('Vocation');
    if (!prop.situation) missing.push('Situation');
    
    return missing;
};

/**
 * Obtenir les champs manquants d'un demandeur
 */
export const getMissingDemandeurFields = (dem: Demandeur): string[] => {
    const missing: string[] = [];
    
    if (!dem.date_naissance) missing.push('Date de naissance');
    if (!dem.lieu_naissance) missing.push('Lieu de naissance');
    if (!dem.date_delivrance) missing.push('Date de délivrance CIN');
    if (!dem.lieu_delivrance) missing.push('Lieu de délivrance CIN');
    if (!dem.domiciliation) missing.push('Domiciliation');
    if (!dem.occupation) missing.push('Occupation');
    if (!dem.nom_mere) missing.push('Nom de la mère');
    
    return missing;
};

/**
 * Vérifier si une réquisition peut être générée
 */
export const canGenerateRequisition = (prop: ProprieteWithDemandeurs): boolean => {
    // Pour la réquisition, on a besoin de moins de champs
    return !!(
        prop.titre && 
        prop.proprietaire && 
        prop.situation
    );
};

/**
 * Obtenir un message de validation détaillé
 */
export const getValidationMessage = (
    prop: ProprieteWithDemandeurs | null,
    dem: Demandeur | null,
    docType: 'acte_vente' | 'csf' | 'requisition'
): string | null => {
    if (!prop) return "Veuillez sélectionner une propriété";
    
    const propFields = getMissingProprieteFields(prop);
    const demFields = dem ? getMissingDemandeurFields(dem) : [];
    
    if (docType === 'requisition') {
        if (!canGenerateRequisition(prop)) {
            return `Données manquantes (Propriété) : ${propFields.join(', ')}`;
        }
        return null;
    }
    
    if (!dem) return "Veuillez sélectionner un demandeur";
    
    // Pour acte de vente, vérifier aussi le reçu
    if (docType === 'acte_vente' && !prop.has_recu) {
        return "⚠️ Vous devez d'abord générer le reçu de paiement";
    }
    
    const allMissing = [...propFields, ...demFields];
    
    if (allMissing.length === 0) return null;
    
    if (propFields.length > 0 && demFields.length > 0) {
        return `Données manquantes : Propriété (${propFields.join(', ')}), Demandeur (${demFields.join(', ')})`;
    } else if (propFields.length > 0) {
        return `Données manquantes (Propriété) : ${propFields.join(', ')}`;
    } else {
        return `Données manquantes (Demandeur) : ${demFields.join(', ')}`;
    }
};