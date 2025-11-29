<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class District extends Model
{
    protected $fillable = [
        'nom_district',
        'id_region',
        'edilitaire',
        'agricole',
        'forestiere',
        'touristique',
    ];

    protected $casts = [
        'edilitaire' => 'decimal:2',
        'agricole' => 'decimal:2',
        'forestiere' => 'decimal:2',
        'touristique' => 'decimal:2',
    ];

    // ============================================================================
    // RELATIONS
    // ============================================================================
    
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'id_region');
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class, 'id_district');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'id_district');
    }

    public function proprietes(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_district');
    }

    // ============================================================================
    // SCOPES
    // ============================================================================
    
    /**
     * Districts avec prix complets
     */
    public function scopeWithCompletePrices(Builder $query): Builder
    {
        return $query->where('edilitaire', '>', 0)
            ->where('agricole', '>', 0)
            ->where('forestiere', '>', 0)
            ->where('touristique', '>', 0);
    }

    /**
     * Districts avec prix incomplets
     */
    public function scopeWithIncompletePrices(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('edilitaire', '<=', 0)
              ->orWhere('agricole', '<=', 0)
              ->orWhere('forestiere', '<=', 0)
              ->orWhere('touristique', '<=', 0);
        });
    }

    /**
     * Par région
     */
    public function scopeInRegion(Builder $query, int $regionId): Builder
    {
        return $query->where('id_region', $regionId);
    }

    /**
     * Par province (via région)
     */
    public function scopeInProvince(Builder $query, int $provinceId): Builder
    {
        return $query->whereHas('region', function ($q) use ($provinceId) {
            $q->where('id_province', $provinceId);
        });
    }

    /**
     * Recherche par nom
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('nom_district', 'LIKE', "%{$search}%");
    }

    // ============================================================================
    // ACCESSEURS (ATTRIBUTES)
    // ============================================================================
    
    /**
     * Vérifier si tous les prix sont configurés
     */
    public function hasPricesSet(): bool
    {
        return $this->edilitaire > 0 
            && $this->agricole > 0 
            && $this->forestiere > 0 
            && $this->touristique > 0;
    }

    /**
     * Obtenir le prix moyen
     */
    public function getAveragePriceAttribute(): float
    {
        $prices = array_filter([
            $this->edilitaire,
            $this->agricole,
            $this->forestiere,
            $this->touristique,
        ], fn($price) => $price > 0);

        return count($prices) > 0 ? array_sum($prices) / count($prices) : 0;
    }

    /**
     * Obtenir le prix minimum
     */
    public function getMinPriceAttribute(): float
    {
        $prices = array_filter([
            $this->edilitaire,
            $this->agricole,
            $this->forestiere,
            $this->touristique,
        ], fn($price) => $price > 0);

        return count($prices) > 0 ? min($prices) : 0;
    }

    /**
     * Obtenir le prix maximum
     */
    public function getMaxPriceAttribute(): float
    {
        return max(
            $this->edilitaire ?? 0,
            $this->agricole ?? 0,
            $this->forestiere ?? 0,
            $this->touristique ?? 0
        );
    }

    /**
     * Obtenir le nom complet avec hiérarchie
     */
    public function getFullNameAttribute(): string
    {
        if (!$this->relationLoaded('region')) {
            return $this->nom_district;
        }

        $region = $this->region;
        $province = $region?->province;

        return sprintf(
            '%s, %s, %s',
            $this->nom_district,
            $region?->nom_region ?? 'Région inconnue',
            $province?->nom_province ?? 'Province inconnue'
        );
    }

    /**
     * Statut de complétude des prix
     */
    public function getPriceStatusAttribute(): string
    {
        return $this->hasPricesSet() ? 'Complet' : 'Incomplet';
    }

    /**
     * Badge de statut coloré
     */
    public function getPriceStatusBadgeAttribute(): array
    {
        return $this->hasPricesSet() 
            ? ['label' => 'Complet', 'color' => 'success']
            : ['label' => 'Incomplet', 'color' => 'warning'];
    }

    // ============================================================================
    // MÉTHODES UTILITAIRES
    // ============================================================================
    
    /**
     * Obtenir le prix pour une vocation donnée
     */
    public function getPriceForVocation(string $vocation): float
    {
        return match(strtolower($vocation)) {
            'edilitaire', 'édilitaire' => $this->edilitaire ?? 0,
            'agricole' => $this->agricole ?? 0,
            'forestiere', 'forestière' => $this->forestiere ?? 0,
            'touristique' => $this->touristique ?? 0,
            default => 0,
        };
    }

    /**
     * Définir le prix pour une vocation donnée
     */
    public function setPriceForVocation(string $vocation, float $price): bool
    {
        $field = match(strtolower($vocation)) {
            'edilitaire', 'édilitaire' => 'edilitaire',
            'agricole' => 'agricole',
            'forestiere', 'forestière' => 'forestiere',
            'touristique' => 'touristique',
            default => null,
        };

        if (!$field) {
            return false;
        }

        return $this->update([$field => round($price, 2)]);
    }

    /**
     * Obtenir tous les prix sous forme de tableau
     */
    public function getPricesArray(): array
    {
        return [
            'edilitaire' => $this->edilitaire ?? 0,
            'agricole' => $this->agricole ?? 0,
            'forestiere' => $this->forestiere ?? 0,
            'touristique' => $this->touristique ?? 0,
        ];
    }

    /**
     * Obtenir les prix formatés
     */
    public function getFormattedPrices(): array
    {
        return [
            'edilitaire' => number_format($this->edilitaire ?? 0, 2, ',', ' ') . ' Ar/m²',
            'agricole' => number_format($this->agricole ?? 0, 2, ',', ' ') . ' Ar/m²',
            'forestiere' => number_format($this->forestiere ?? 0, 2, ',', ' ') . ' Ar/m²',
            'touristique' => number_format($this->touristique ?? 0, 2, ',', ' ') . ' Ar/m²',
        ];
    }

    /**
     * Réinitialiser tous les prix à zéro
     */
    public function resetPrices(): bool
    {
        return $this->update([
            'edilitaire' => 0,
            'agricole' => 0,
            'forestiere' => 0,
            'touristique' => 0,
        ]);
    }

    /**
     * Copier les prix d'un autre district
     */
    public function copyPricesFrom(District $sourceDistrict): bool
    {
        return $this->update([
            'edilitaire' => $sourceDistrict->edilitaire,
            'agricole' => $sourceDistrict->agricole,
            'forestiere' => $sourceDistrict->forestiere,
            'touristique' => $sourceDistrict->touristique,
        ]);
    }

    /**
     * Appliquer un pourcentage d'augmentation/diminution
     */
    public function adjustPrices(float $percentage): bool
    {
        $multiplier = 1 + ($percentage / 100);

        return $this->update([
            'edilitaire' => round($this->edilitaire * $multiplier, 2),
            'agricole' => round($this->agricole * $multiplier, 2),
            'forestiere' => round($this->forestiere * $multiplier, 2),
            'touristique' => round($this->touristique * $multiplier, 2),
        ]);
    }

    /**
     * Obtenir les statistiques du district
     */
    public function getStats(): array
    {
        return [
            'total_dossiers' => $this->dossiers()->count(),
            'dossiers_actifs' => $this->dossiers()->where('status', 'actif')->count(),
            'total_proprietes' => $this->proprietes()->count(),
            'total_users' => $this->users()->where('status', true)->count(),
            'prices_complete' => $this->hasPricesSet(),
            'average_price' => $this->average_price,
            'min_price' => $this->min_price,
            'max_price' => $this->max_price,
        ];
    }

    /**
     * Vérifier si le district a des données associées
     */
    public function hasData(): bool
    {
        return $this->dossiers()->exists() 
            || $this->proprietes()->exists() 
            || $this->users()->exists();
    }

    /**
     * Obtenir le nombre de prix manquants
     */
    public function getMissingPricesCount(): int
    {
        $count = 0;
        
        if ($this->edilitaire <= 0) $count++;
        if ($this->agricole <= 0) $count++;
        if ($this->forestiere <= 0) $count++;
        if ($this->touristique <= 0) $count++;
        
        return $count;
    }

    /**
     * Obtenir le pourcentage de complétude
     */
    public function getCompletionPercentage(): float
    {
        $total = 4; // 4 types de prix
        $set = $total - $this->getMissingPricesCount();
        
        return round(($set / $total) * 100, 2);
    }

    /**
     * Logger une activité sur le district
     */
    public function logActivity(string $action, int $userId, array $details = []): void
    {
        if (class_exists('App\Models\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'id_user' => $userId,
                'id_district' => $this->id,
                'action' => $action,
                'entity_type' => 'district',
                'entity_id' => $this->id,
                'details' => json_encode($details),
                'ip_address' => request()->ip(),
            ]);
        }
    }

    // ============================================================================
    // MÉTHODES STATIQUES
    // ============================================================================
    
    /**
     * Obtenir les statistiques globales
     */
    public static function getGlobalStats(): array
    {
        $total = static::count();
        $withPrices = static::withCompletePrices()->count();
        
        return [
            'total_districts' => $total,
            'districts_with_prices' => $withPrices,
            'districts_without_prices' => $total - $withPrices,
            'completion_percentage' => $total > 0 ? round(($withPrices / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Obtenir les districts nécessitant une configuration
     */
    public static function getNeedingConfiguration(int $limit = 10)
    {
        return static::with('region.province')
            ->withIncompletePrices()
            ->orderBy('nom_district')
            ->limit($limit)
            ->get();
    }

    /**
     * Rechercher des districts
     */
    public static function searchDistricts(string $query, int $limit = 20)
    {
        return static::with('region.province')
            ->where('nom_district', 'LIKE', "%{$query}%")
            ->orderBy('nom_district')
            ->limit($limit)
            ->get();
    }
}