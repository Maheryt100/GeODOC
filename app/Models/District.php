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

    /**
     * Un district appartient à une région
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'id_region');
    }
    
    /**
     * ✅ AJOUT : Un district a plusieurs utilisateurs
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'id_district');
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
     * ✅ AJOUT : Un district a plusieurs dossiers
     */
    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class, 'id_district');
    }

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
     * Obtenir le prix formaté pour une vocation donnée
     */
    public function getFormattedPrice(string $vocation): string
    {
        $price = $this->$vocation ?? 0;
        return number_format($price, 0, ',', ' ') . ' Ar';
    }
}