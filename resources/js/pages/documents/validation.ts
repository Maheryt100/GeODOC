// documents/validation.ts
import { Demandeur } from '@/types';
import { ProprieteWithDemandeurs, DemandeurLie } from './types';

/**
 * ✅ Vérifier si une propriété a toutes les données requises
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
 * ✅ Vérifier si un demandeur a toutes les données requises
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
 * ✅ NOUVEAU : Obtenir le demandeur principal (ordre = 1)
 */
export const getDemandeurPrincipal = (demandeurs: DemandeurLie[]): DemandeurLie | null => {
    return demandeurs.find(d => d.ordre === 1) || demandeurs[0] || null;
};

/**
 * ✅ NOUVEAU : Obtenir les consorts (ordre > 1)
 */
export const getConsorts = (demandeurs: DemandeurLie[]): DemandeurLie[] => {
    return demandeurs.filter(d => d.ordre > 1).sort((a, b) => a.ordre - b.ordre);
};

/**
 * ✅ NOUVEAU : Vérifier si une propriété a un demandeur principal valide
 */
export const hasDemandeurPrincipalValid = (prop: ProprieteWithDemandeurs, allDemandeurs: Demandeur[]): boolean => {
    const principal = getDemandeurPrincipal(prop.demandeurs_lies || []);
    if (!principal) return false;
    
    const demandeurData = allDemandeurs.find(d => d.id === principal.id);
    return demandeurData ? isDemandeurComplete(demandeurData) : false;
};

/**
 * ✅ AMÉLIORÉ : Obtenir les champs manquants d'une propriété
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
 * ✅ Obtenir les champs manquants d'un demandeur
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
 * ✅ Vérifier si une réquisition peut être générée
 */
export const canGenerateRequisition = (prop: ProprieteWithDemandeurs): boolean => {
    return !!(
        prop.titre && 
        prop.proprietaire && 
        prop.situation &&
        prop.type_operation
    );
};

/**
 * ✅ NOUVEAU : Obtenir un résumé de la hiérarchie des demandeurs
 */
export const getHierarchySummary = (demandeurs: DemandeurLie[]): string => {
    const principal = getDemandeurPrincipal(demandeurs);
    const consorts = getConsorts(demandeurs);
    
    if (!principal) return "Aucun demandeur";
    
    if (consorts.length === 0) {
        return `${principal.nom} ${principal.prenom} (seul)`;
    }
    
    return `${principal.nom} ${principal.prenom} (principal) + ${consorts.length} consort${consorts.length > 1 ? 's' : ''}`;
};

/**
 * ✅ AMÉLIORÉ : Message de validation avec support de l'ordre
 */
export const getValidationMessage = (
    prop: ProprieteWithDemandeurs | null,
    demandeurs: Demandeur[],
    docType: 'acte_vente' | 'csf' | 'recu' | 'requisition'
): string | null => {
    if (!prop) return "Veuillez sélectionner une propriété";
    
    const propFields = getMissingProprieteFields(prop);
    
    // Réquisition : pas de demandeur requis
    if (docType === 'requisition') {
        if (!canGenerateRequisition(prop)) {
            return `Données manquantes (Propriété) : ${propFields.join(', ')}`;
        }
        return null;
    }
    
    // Vérifier le demandeur principal
    const principal = getDemandeurPrincipal(prop.demandeurs_lies || []);
    if (!principal) {
        return "Aucun demandeur principal (ordre = 1) associé à cette propriété";
    }
    
    const demandeurData = demandeurs.find(d => d.id === principal.id);
    if (!demandeurData) {
        return "Données du demandeur principal introuvables";
    }
    
    const demFields = getMissingDemandeurFields(demandeurData);
    
    // Pour acte de vente : vérifier aussi le reçu
    if (docType === 'acte_vente' && !prop.has_recu) {
        return "⚠️ Vous devez d'abord générer le reçu de paiement";
    }
    
    // Pour reçu : vérifier qu'il n'existe pas déjà
    if (docType === 'recu' && prop.has_recu) {
        return "Un reçu existe déjà pour cette propriété";
    }
    
    const allMissing = [...propFields, ...demFields];
    
    if (allMissing.length === 0) return null;
    
    if (propFields.length > 0 && demFields.length > 0) {
        return `Données manquantes : Propriété (${propFields.join(', ')}), Demandeur principal (${demFields.join(', ')})`;
    } else if (propFields.length > 0) {
        return `Données manquantes (Propriété) : ${propFields.join(', ')}`;
    } else {
        return `Données manquantes (Demandeur principal) : ${demFields.join(', ')}`;
    }
};

/**
 * ✅ NOUVEAU : Vérifier si tous les consorts sont valides
 */
export const areAllConsortsValid = (prop: ProprieteWithDemandeurs, allDemandeurs: Demandeur[]): boolean => {
    const consorts = getConsorts(prop.demandeurs_lies || []);
    
    return consorts.every(consort => {
        const demandeurData = allDemandeurs.find(d => d.id === consort.id);
        return demandeurData ? isDemandeurComplete(demandeurData) : false;
    });
};

/**
 * ✅ NOUVEAU : Obtenir la liste des consorts invalides
 */
export const getInvalidConsorts = (prop: ProprieteWithDemandeurs, allDemandeurs: Demandeur[]): string[] => {
    const consorts = getConsorts(prop.demandeurs_lies || []);
    
    return consorts
        .filter(consort => {
            const demandeurData = allDemandeurs.find(d => d.id === consort.id);
            return !demandeurData || !isDemandeurComplete(demandeurData);
        })
        .map(consort => `${consort.nom} ${consort.prenom} (ordre ${consort.ordre})`);
};