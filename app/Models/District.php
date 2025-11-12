<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class District extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'districts';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'nom_district',
        'id_region',
        'edilitaire',
        'agricole',
        'forestiere',      
        'touristique',   
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'edilitaire' => 'integer',
        'agricole' => 'integer',
        'forestiere' => 'integer',
        'touristique' => 'integer',
    ];

    /**
     * Get the region that owns the district.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'id_region');
    }
    
    /**
     * Get the demandeurs for the district.
     */
    public function demandeurs(): HasMany
    {
        return $this->hasMany(Demandeur::class, 'id_district');
    }
    
    /**
     * Get the proprietes for the district.
     */
    public function proprietes(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_district');
    }

    /**
     * Get the communes for the district.
     */
    public function communes(): HasMany
    {
        return $this->hasMany(Commune::class, 'id_district');
    }

    /**
     * Scope to filter by region
     */
    public function scopeByRegion($query, $regionId)
    {
        return $query->where('id_region', $regionId);
    }

    /**
     * Scope to filter districts with prices set
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
     * Check if all prices are set for this district
     */
    public function hasPricesSet(): bool
    {
        return $this->edilitaire > 0 
            && $this->agricole > 0 
            && $this->forestiere > 0 
            && $this->touristique > 0;
    }

    /**
     * Get the formatted price for a given vocation
     */
    public function getFormattedPrice(string $vocation): string
    {
        $price = $this->$vocation ?? 0;
        return number_format($price, 0, ',', ' ') . ' Ar';
    }
}