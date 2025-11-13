<?php

namespace App\Models;

use App\Collection\DossierCollection;
use App\Traits\HasPiecesJointes;
use App\Traits\HasDistrictScope;
use Illuminate\Database\Eloquent\Attributes\CollectedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[CollectedBy(DossierCollection::class)]
class Dossier extends Model
{
    use HasPiecesJointes, HasDistrictScope;

    protected $fillable = [
        'nom_dossier',
        'date_descente_debut',
        'date_descente_fin',
        'type_commune',
        'commune',
        'fokontany',
        'circonscription',
        'id_district',
        'id_user',
    ];

    protected $appends = ['demandeurs_count', 'proprietes_count'];

    protected $casts = [
        'date_descente_debut' => 'date',
        'date_descente_fin' => 'date',
    ];

    // ============ ACCESSORS ============
    
    public function getDemandeursCountAttribute()
    {
        return $this->demandeurs()->count();
    }

    public function getProprietesCountAttribute()
    {
        return $this->proprietes()->count();
    }

    // ============ RELATIONS ============
    
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function demandeurs()
    {
        return $this->belongsToMany(Demandeur::class, 'contenir', 'id_dossier', 'id_demandeur');
    }

    public function proprietes()
    {
        return $this->hasMany(Propriete::class, 'id_dossier', 'id');
    }

    public function demandes(): HasManyThrough
    {
        return $this->hasManyThrough(
            Demander::class,
            Propriete::class,
            'id_dossier',
            'id_propriete',
            'id',
            'id'
        )->where('demander.status', 'active');
    }

    // ============ SCOPES PERSONNALISÉS ============
    
    /**
     * Dossiers récents
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('date_descente_debut', '>=', now()->subDays($days));
    }

    /**
     * Dossiers par commune
     */
    public function scopeByCommune($query, string $commune)
    {
        return $query->where('commune', 'ilike', "%{$commune}%");
    }

    /**
     * Dossiers avec statistiques
     */
    public function scopeWithStats($query)
    {
        return $query->withCount(['demandeurs', 'proprietes', 'demandes']);
    }

    // ============ MÉTHODES HELPER ============
    
    /**
     * Vérifier si le dossier est complet
     */
    public function isComplete(): bool
    {
        return $this->proprietes()->exists() && $this->demandeurs()->exists();
    }

    /**
     * Obtenir le statut du dossier
     */
    public function getStatusAttribute(): string
    {
        $proprietes = $this->proprietes()->count();
        $demandeurs = $this->demandeurs()->count();

        if ($proprietes === 0 && $demandeurs === 0) {
            return 'vide';
        }

        if ($proprietes > 0 && $demandeurs > 0) {
            return 'complet';
        }

        return 'en_cours';
    }

    /**
     * Obtenir la localisation complète
     */
    public function getFullLocationAttribute(): string
    {
        return "{$this->commune}, {$this->fokontany} - District {$this->district->nom_district}";
    }
}
