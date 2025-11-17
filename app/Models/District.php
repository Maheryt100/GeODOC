<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class District extends Model
{
    protected $table = 'districts';

    protected $fillable = [
        'nom_district',
        'id_region',
        'edilitaire',
        'agricole',
        'forestiere',      
        'touristique',   
    ];

    protected $casts = [
        'edilitaire' => 'integer',
        'agricole' => 'integer',
        'forestiere' => 'integer',
        'touristique' => 'integer',
    ];

    // ============ RELATIONS ============

    /**
     * Un district appartient à une région
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'id_region');
    }
    
    /**
     * Un district a plusieurs utilisateurs
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'id_district');
    }
    
    /**
     * ✅ AJOUT : Un district a plusieurs logs d'activité
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'id_district');
    }
    
    /**
     * Un district a plusieurs demandeurs
     */
    public function demandeurs(): HasMany
    {
        return $this->hasMany(Demandeur::class, 'id_district');
    }
    
    /**
     * Un district a plusieurs propriétés
     */
    public function proprietes(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_district');
    }

    /**
     * Un district a plusieurs dossiers
     */
    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class, 'id_district');
    }

    // ============ SCOPES ============

    /**
     * Scope pour filtrer par région
     */
    public function scopeByRegion($query, $regionId)
    {
        return $query->where('id_region', $regionId);
    }

    /**
     * Scope pour les districts avec prix définis
     */
    public function scopeWithPrices($query)
    {
        return $query->where(function($q) {
            $q->where('edilitaire', '>', 0)
              ->orWhere('agricole', '>', 0)
              ->orWhere('forestiere', '>', 0)
              ->orWhere('touristique', '>', 0);
        });
    }

    // ============ MÉTHODES UTILITAIRES ============

    /**
     * Vérifier si tous les prix sont définis
     */
    public function hasPricesSet(): bool
    {
        return $this->edilitaire > 0 
            && $this->agricole > 0 
            && $this->forestiere > 0 
            && $this->touristique > 0;
    }

    /**
     * Obtenir le prix pour une vocation donnée
     */
    public function getPriceForVocation(string $vocation): int
    {
        $normalizedVocation = $this->normalizeVocation($vocation);
        return $this->$normalizedVocation ?? 0;
    }

    /**
     * Normaliser le nom de la vocation
     */
    private function normalizeVocation(string $vocation): string
    {
        $mapping = [
            'Edilitaire' => 'edilitaire',
            'edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Forestiere' => 'forestiere',
            'forestière' => 'forestiere',
            'forestiere' => 'forestiere',
            'Touristique' => 'touristique',
            'touristique' => 'touristique',
        ];

        return $mapping[$vocation] ?? 'edilitaire';
    }

    /**
     * Obtenir le prix formaté pour une vocation donnée
     */
    public function getFormattedPrice(string $vocation): string
    {
        $normalizedVocation = $this->normalizeVocation($vocation);
        $price = $this->$normalizedVocation ?? 0;
        return number_format($price, 0, ',', ' ') . ' Ar';
    }

    /**
     * ✅ AJOUT : Obtenir tous les prix formatés
     */
    public function getAllFormattedPrices(): array
    {
        return [
            'edilitaire' => $this->getFormattedPrice('edilitaire'),
            'agricole' => $this->getFormattedPrice('agricole'),
            'forestiere' => $this->getFormattedPrice('forestiere'),
            'touristique' => $this->getFormattedPrice('touristique'),
        ];
    }

    /**
     * ✅ AJOUT : Vérifier quels prix sont manquants
     */
    public function getMissingPrices(): array
    {
        $missing = [];
        
        if ($this->edilitaire <= 0) $missing[] = 'edilitaire';
        if ($this->agricole <= 0) $missing[] = 'agricole';
        if ($this->forestiere <= 0) $missing[] = 'forestiere';
        if ($this->touristique <= 0) $missing[] = 'touristique';
        
        return $missing;
    }

    /**
     * ✅ AJOUT : Mettre à jour les prix en masse
     */
    public function updatePrices(array $prices): bool
    {
        $allowedKeys = ['edilitaire', 'agricole', 'forestiere', 'touristique'];
        $updateData = [];
        
        foreach ($prices as $key => $value) {
            if (in_array($key, $allowedKeys)) {
                $updateData[$key] = (int) $value;
            }
        }
        
        if (empty($updateData)) {
            return false;
        }
        
        return $this->update($updateData);
    }

    // ============ STATISTIQUES ============

    /**
     * ✅ AJOUT : Obtenir les statistiques du district
     */
    public function getStats(): array
    {
        return [
            'total_users' => $this->users()->count(),
            'active_users' => $this->users()->where('status', true)->count(),
            'total_dossiers' => $this->dossiers()->count(),
            'total_proprietes' => $this->proprietes()->count(),
            'total_demandeurs' => $this->demandeurs()->count(),
            'has_all_prices' => $this->hasPricesSet(),
            'missing_prices' => $this->getMissingPrices(),
        ];
    }

    /**
     * ✅ AJOUT : Obtenir les statistiques d'activité
     */
    public function getActivityStats(): array
    {
        return [
            'total_actions' => $this->activityLogs()->count(),
            'today_actions' => $this->activityLogs()
                ->whereDate('created_at', today())
                ->count(),
            'week_actions' => $this->activityLogs()
                ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->count(),
            'documents_generated' => $this->activityLogs()
                ->where('entity_type', ActivityLog::ENTITY_DOCUMENT)
                ->where('action', ActivityLog::ACTION_GENERATE)
                ->count(),
        ];
    }

    // ============ ACCESSEURS ============

    /**
     * ✅ AJOUT : Obtenir le nom complet avec région
     */
    public function getFullNameAttribute(): string
    {
        if (!$this->region) {
            return $this->nom_district;
        }

        return sprintf(
            '%s (%s)',
            $this->nom_district,
            $this->region->nom_region ?? 'Région inconnue'
        );
    }

    /**
     * ✅ AJOUT : Obtenir le statut des prix
     */
    public function getPricesStatusAttribute(): string
    {
        if ($this->hasPricesSet()) {
            return 'Complet';
        }

        $missing = $this->getMissingPrices();
        return 'Incomplet (' . count($missing) . ' prix manquants)';
    }
}