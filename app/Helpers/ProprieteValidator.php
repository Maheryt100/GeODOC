<?php

namespace App\Helpers;

use App\Models\Propriete;

class ProprieteValidator
{
    /**
     * Règles de validation pour la création/modification de propriété
     */
    public static function rules(bool $isUpdate = false, ?int $proprieteId = null): array
    {
        $rules = [
            'lot' => 'required|string|max:15|regex:/^[A-Z0-9-]+$/',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'nullable|in:Edilitaire,Agricole,Forestière,Touristique',
            
            // Champs optionnels mais avec format
            'titre' => 'nullable|string|max:50',
            'proprietaire' => 'nullable|string|max:100',
            'contenance' => 'nullable|integer|min:1',
            'charge' => 'nullable|string|max:255',
            'situation' => 'nullable|string',
            
            // Cadastre
            'numero_FN' => 'nullable|string|max:30',
            'dep_vol' => 'nullable|numeric', // ✅ CORRIGÉ: Simple numéro
            'numero_dep_vol' => 'nullable|string|max:50|regex:/^\d+$/', // ✅ CORRIGÉ: Numéros uniquement
            
            // Réquisition
            'numero_requisition' => 'nullable|string|max:50',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            
            // Pour morcellement
            'propriete_mere' => 'nullable|string|max:50',
            'titre_mere' => 'nullable|string|max:50',
            
            'id_dossier' => 'required|exists:dossiers,id',
        ];

        // Règles conditionnelles pour le morcellement
        if (request()->input('type_operation') === 'morcellement') {
            $rules['propriete_mere'] = 'required|string|max:50';
            $rules['titre_mere'] = 'required|string|max:50';
        }

        return $rules;
    }

    /**
     * Messages d'erreur personnalisés
     */
    public static function messages(): array
    {
        return [
            'lot.required' => 'Le numéro de lot est obligatoire',
            'lot.regex' => 'Le lot ne peut contenir que des lettres majuscules, chiffres et tirets',
            'lot.max' => 'Le lot ne peut pas dépasser 15 caractères',
            
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'type_operation.in' => 'Le type d\'opération doit être "morcellement" ou "immatriculation"',
            
            'nature.required' => 'La nature est obligatoire',
            'nature.in' => 'La nature doit être Urbaine, Suburbaine ou Rurale',
            
            'vocation.in' => 'La vocation doit être Edilitaire, Agricole, Forestière ou Touristique',
            
            'contenance.integer' => 'La contenance doit être un nombre entier',
            'contenance.min' => 'La contenance doit être supérieure à 0',
            
            'dep_vol.numeric' => 'Le Dep/Vol doit être un numéro (ex: 299)',
            
            'numero_dep_vol.regex' => 'Le numéro Dep/Vol doit contenir uniquement des chiffres (ex: 041)',
            'numero_dep_vol.max' => 'Le numéro Dep/Vol ne peut pas dépasser 50 caractères',
            
            'date_requisition.date' => 'La date de réquisition doit être une date valide',
            'date_inscription.date' => 'La date d\'inscription doit être une date valide',
            
            'propriete_mere.required' => 'La propriété mère est obligatoire pour un morcellement',
            'titre_mere.required' => 'Le titre mère est obligatoire pour un morcellement',
            
            'id_dossier.required' => 'Le dossier est obligatoire',
            'id_dossier.exists' => 'Le dossier sélectionné n\'existe pas',
        ];
    }

    /**
     * Nettoyer et normaliser les données avant sauvegarde
     */
    public static function sanitize(array $data): array
    {
        // Normaliser le lot en majuscules
        if (isset($data['lot'])) {
            $data['lot'] = strtoupper(trim($data['lot']));
        }

        // Normaliser la nature
        if (isset($data['nature'])) {
            $data['nature'] = ucfirst(strtolower($data['nature']));
        }

        // Normaliser la vocation
        if (isset($data['vocation'])) {
            $data['vocation'] = ucfirst(strtolower($data['vocation']));
        }

        // Nettoyer le dep_vol (enlever espaces)
        if (isset($data['dep_vol'])) {
            $data['dep_vol'] = trim($data['dep_vol']);
        }

        // Nettoyer le numero_dep_vol et ajouter les zéros devant si nécessaire
        if (isset($data['numero_dep_vol']) && !empty($data['numero_dep_vol'])) {
            // Supprimer les espaces et caractères non numériques
            $numero = preg_replace('/[^\d]/', '', $data['numero_dep_vol']);
            // Formater sur 3 chiffres avec zéros devant (041)
            $data['numero_dep_vol'] = str_pad($numero, 3, '0', STR_PAD_LEFT);
        }

        // Supprimer les champs vides optionnels
        $optionalFields = [
            'titre', 'proprietaire', 'charge', 'situation', 'vocation',
            'numero_FN', 'dep_vol', 'numero_dep_vol', 'numero_requisition',
            'date_requisition', 'date_inscription', 'propriete_mere', 'titre_mere'
        ];

        foreach ($optionalFields as $field) {
            if (isset($data[$field]) && empty($data[$field])) {
                $data[$field] = null;
            }
        }

        return $data;
    }

    /**
     * Vérifier si une propriété est complète
     */
    public static function isComplete(array $data): bool
    {
        $requiredFields = [
            'lot', 'titre', 'contenance', 'proprietaire', 
            'nature', 'vocation', 'situation'
        ];

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Obtenir les champs manquants
     */
    public static function getMissingFields(array $data): array
    {
        $requiredFields = [
            'lot' => 'Lot',
            'titre' => 'Titre',
            'contenance' => 'Contenance',
            'proprietaire' => 'Propriétaire',
            'nature' => 'Nature',
            'vocation' => 'Vocation',
            'situation' => 'Situation',
        ];

        $missing = [];

        foreach ($requiredFields as $field => $label) {
            if (empty($data[$field])) {
                $missing[] = $label;
            }
        }

        return $missing;
    }

    /**
     * Valider le format du dep/vol
     */
    public static function validateDepVol(string $depVol): bool
    {
        return is_numeric($depVol);
    }

    /**
     * Suggérer un format dep/vol corrigé
     */
    public static function suggestDepVolFormat(string $depVol): ?string
    {
        // Enlever tous les caractères non numériques
        $depVol = preg_replace('/[^\d]/', '', $depVol);
        
        // Si vide après nettoyage
        if (empty($depVol)) {
            return null;
        }

        return $depVol;
    }

    /**
     * Formater le numéro dep/vol avec zéros devant
     */
    public static function formatNumeroDepVol(string $numero): string
    {
        // Enlever tout sauf les chiffres
        $numero = preg_replace('/[^\d]/', '', $numero);
        
        // Formater sur 3 chiffres
        return str_pad($numero, 3, '0', STR_PAD_LEFT);
    }
}