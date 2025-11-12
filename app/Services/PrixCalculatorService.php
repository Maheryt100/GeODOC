<?php

namespace App\Services;

use App\Models\Propriete;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrixCalculatorService
{
    /**
     * Normalise le nom de la vocation pour correspondre aux colonnes de districts
     */
    private static function normalizeVocation(string $vocation): string
    {
        $mapping = [
            'Edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Forestiere' => 'forestiere',
            'Touristique' => 'touristique',
        ];

        return $mapping[$vocation] ?? strtolower($vocation);
    }

    /**
     * Calcule le prix total d'une propriété
     * 
     * @param Propriete $propriete
     * @return int Prix total (prix unitaire × contenance)
     * @throws \Exception Si le prix n'est pas configuré
     */
    public static function calculerPrixTotal(Propriete $propriete): int
    {
        $vocationColumn = self::normalizeVocation($propriete->vocation);
        
        Log::info('Calcul prix', [
            'propriete_id' => $propriete->id,
            'lot' => $propriete->lot,
            'vocation' => $propriete->vocation,
            'colonne_db' => $vocationColumn,
            'contenance' => $propriete->contenance,
            'dossier_id' => $propriete->id_dossier
        ]);

        // Récupérer le prix unitaire depuis le district
        $prixDistrict = DB::table('districts')
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select(
                "districts.$vocationColumn as prix",
                'districts.nom_district',
                'dossiers.nom_dossier'
            )
            ->where('dossiers.id', $propriete->id_dossier)
            ->first();

        if (!$prixDistrict) {
            Log::error('Configuration district introuvable', [
                'propriete_id' => $propriete->id,
                'dossier_id' => $propriete->id_dossier
            ]);
            
            throw new \Exception(
                "Configuration du district introuvable pour le dossier ID {$propriete->id_dossier}. " .
                "Veuillez vérifier la configuration."
            );
        }

        $prixUnitaire = $prixDistrict->prix ?? 0;

        if ($prixUnitaire <= 0) {
            Log::error('Prix non configuré', [
                'propriete_id' => $propriete->id,
                'vocation' => $propriete->vocation,
                'colonne' => $vocationColumn,
                'district' => $prixDistrict->nom_district,
                'dossier' => $prixDistrict->nom_dossier,
                'prix_trouve' => $prixUnitaire
            ]);
            
            throw new \Exception(
                "Le prix pour la vocation '{$propriete->vocation}' n'est pas configuré " .
                "dans le district '{$prixDistrict->nom_district}'. " .
                "Veuillez configurer le prix dans la section 'Prix des terrains'."
            );
        }

        $prixTotal = $prixUnitaire * $propriete->contenance;

        Log::info('Prix calculé avec succès', [
            'propriete_id' => $propriete->id,
            'prix_unitaire' => $prixUnitaire,
            'contenance' => $propriete->contenance,
            'prix_total' => $prixTotal
        ]);

        return $prixTotal;
    }

    /**
     * Récupère uniquement le prix unitaire (pour affichage dans les documents)
     * 
     * @param Propriete $propriete
     * @return int Prix unitaire par m²
     * @throws \Exception Si le prix n'est pas configuré
     */
    public static function getPrixUnitaire(Propriete $propriete): int
    {
        $vocationColumn = self::normalizeVocation($propriete->vocation);
        
        $prixDistrict = DB::table('districts')
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$vocationColumn as prix")
            ->where('dossiers.id', $propriete->id_dossier)
            ->first();

        if (!$prixDistrict || !isset($prixDistrict->prix) || $prixDistrict->prix <= 0) {
            throw new \Exception(
                "Prix unitaire introuvable pour la vocation '{$propriete->vocation}'"
            );
        }

        return (int) $prixDistrict->prix;
    }

    /**
     * Vérifie si le prix est configuré pour une vocation donnée
     * 
     * @param string $vocation
     * @param int $dossierId
     * @return bool
     */
    public static function isPrixConfigured(string $vocation, int $dossierId): bool
    {
        try {
            $vocationColumn = self::normalizeVocation($vocation);
            
            $prix = DB::table('districts')
                ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
                ->select("districts.$vocationColumn as prix")
                ->where('dossiers.id', $dossierId)
                ->first();

            return $prix && isset($prix->prix) && $prix->prix > 0;
        } catch (\Exception $e) {
            Log::error('Erreur vérification prix', [
                'vocation' => $vocation,
                'dossier_id' => $dossierId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}