<?php

namespace App\Services;

use App\Models\Propriete;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PrixCalculatorService
{
    /**
     * Cache TTL en secondes (1 heure)
     * Les prix changent rarement, donc on peut cacher
     */
    private const CACHE_TTL = 3600;

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

        $normalized = $mapping[$vocation] ?? strtolower($vocation);
        
        // Validation supplémentaire
        $validVocations = ['edilitaire', 'agricole', 'forestiere', 'touristique'];
        if (!in_array($normalized, $validVocations)) {
            Log::warning("Vocation invalide détectée: {$vocation}");
            throw new \InvalidArgumentException("Vocation '{$vocation}' non reconnue. Vocations valides: " . implode(', ', $validVocations));
        }

        return $normalized;
    }

    /**
     * Calcule le prix total d'une propriété avec validation et cache
     * 
     * @param Propriete $propriete
     * @return int Prix total (prix unitaire × contenance)
     * @throws \Exception Si le prix n'est pas configuré
     */
    public static function calculerPrixTotal(Propriete $propriete): int
    {
        // Validation des données de base
        if (!$propriete->vocation) {
            throw new \InvalidArgumentException("La propriété (lot: {$propriete->lot}) n'a pas de vocation définie");
        }

        if (!$propriete->contenance || $propriete->contenance <= 0) {
            throw new \InvalidArgumentException("La propriété (lot: {$propriete->lot}) n'a pas de contenance valide");
        }

        if (!$propriete->id_dossier) {
            throw new \InvalidArgumentException("La propriété (lot: {$propriete->lot}) n'est pas liée à un dossier");
        }

        $vocationColumn = self::normalizeVocation($propriete->vocation);
        
        Log::info('Calcul prix démarré', [
            'propriete_id' => $propriete->id,
            'lot' => $propriete->lot,
            'vocation' => $propriete->vocation,
            'colonne_db' => $vocationColumn,
            'contenance' => $propriete->contenance,
            'dossier_id' => $propriete->id_dossier
        ]);

        // Récupérer le prix unitaire (avec cache)
        $prixUnitaire = self::getPrixUnitaireWithCache($propriete->id_dossier, $vocationColumn);

        if ($prixUnitaire <= 0) {
            // Récupérer le nom du district pour un message d'erreur clair
            $district = DB::table('districts')
                ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
                ->select('districts.nom_district', 'dossiers.nom_dossier')
                ->where('dossiers.id', $propriete->id_dossier)
                ->first();

            Log::error('Prix non configuré', [
                'propriete_id' => $propriete->id,
                'vocation' => $propriete->vocation,
                'colonne' => $vocationColumn,
                'district' => $district->nom_district ?? 'Inconnu',
                'dossier' => $district->nom_dossier ?? 'Inconnu',
                'prix_trouve' => $prixUnitaire
            ]);
            
            throw new \Exception(
                "Le prix pour la vocation '{$propriete->vocation}' n'est pas configuré " .
                "dans le district '" . ($district->nom_district ?? 'Inconnu') . "'. " .
                "Veuillez configurer le prix dans la section 'Prix des terrains' avant de créer des demandes."
            );
        }

        $prixTotal = $prixUnitaire * $propriete->contenance;

        Log::info('Prix calculé avec succès', [
            'propriete_id' => $propriete->id,
            'prix_unitaire' => $prixUnitaire,
            'contenance' => $propriete->contenance,
            'prix_total' => $prixTotal,
            'formule' => "{$prixUnitaire} × {$propriete->contenance} = {$prixTotal}"
        ]);

        return $prixTotal;
    }

    /**
     * Récupère le prix unitaire avec système de cache
     * 
     * @param int $dossierId
     * @param string $vocationColumn
     * @return int
     */
    private static function getPrixUnitaireWithCache(int $dossierId, string $vocationColumn): int
    {
        $cacheKey = "prix_unitaire_{$dossierId}_{$vocationColumn}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($dossierId, $vocationColumn) {
            $prix = DB::table('districts')
                ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
                ->select("districts.$vocationColumn as prix")
                ->where('dossiers.id', $dossierId)
                ->first();

            return $prix ? (int) $prix->prix : 0;
        });
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
        return self::getPrixUnitaireWithCache($propriete->id_dossier, $vocationColumn);
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
            $prix = self::getPrixUnitaireWithCache($dossierId, $vocationColumn);
            
            return $prix > 0;
        } catch (\Exception $e) {
            Log::error('Erreur vérification prix', [
                'vocation' => $vocation,
                'dossier_id' => $dossierId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Invalide le cache des prix pour un dossier
     * À appeler quand les prix du district sont modifiés
     * 
     * @param int $dossierId
     */
    public static function invalidateCacheDossier(int $dossierId): void
    {
        $vocations = ['edilitaire', 'agricole', 'forestiere', 'touristique'];
        
        foreach ($vocations as $vocation) {
            $cacheKey = "prix_unitaire_{$dossierId}_{$vocation}";
            Cache::forget($cacheKey);
        }

        Log::info("Cache des prix invalidé pour dossier", ['dossier_id' => $dossierId]);
    }

    /**
     * Récupère tous les prix d'un district (utile pour affichage)
     * 
     * @param int $districtId
     * @return array ['edilitaire' => 1000, 'agricole' => 500, ...]
     */
    public static function getPrixDistrict(int $districtId): array
    {
        $district = DB::table('districts')
            ->select('edilitaire', 'agricole', 'forestiere', 'touristique')
            ->where('id', $districtId)
            ->first();

        if (!$district) {
            return [
                'edilitaire' => 0,
                'agricole' => 0,
                'forestiere' => 0,
                'touristique' => 0
            ];
        }

        return [
            'edilitaire' => (int) $district->edilitaire,
            'agricole' => (int) $district->agricole,
            'forestiere' => (int) $district->forestiere,
            'touristique' => (int) $district->touristique,
        ];
    }
}