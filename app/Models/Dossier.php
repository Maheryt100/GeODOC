<?php

namespace App\Models;

use App\Collection\DossierCollection;
use App\Traits\HasPiecesJointes;
use App\Traits\HasDistrictScope;
use Illuminate\Database\Eloquent\Attributes\CollectedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[CollectedBy(DossierCollection::class)]
class Dossier extends Model
{
    use HasPiecesJointes, HasDistrictScope;

    protected $fillable = [
        'nom_dossier',
        'numero_ouverture',
        'date_descente_debut',
        'date_descente_fin',
        'date_ouverture',
        'date_fermeture',
        'closed_by',
        'motif_fermeture',
        'type_commune',
        'commune',
        'fokontany',
        'circonscription',
        'id_district',
        'id_user',
    ];

    protected $appends = [
        'demandeurs_count', 
        'proprietes_count',
        'is_closed',
        'is_open',
        'status_label',
        'can_be_modified',
        'numero_ouverture_display'
    ];

    protected $casts = [
        'date_descente_debut' => 'date',
        'date_descente_fin' => 'date',
        'date_ouverture' => 'date',
        'date_fermeture' => 'date',
    ];

    protected $with = ['closedBy'];

    // ============ RELATIONS ============
    
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
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


     // ❌ NE PAS FAIRE CECI (filtrage au niveau du modèle)
    // public function proprietes(): HasMany
    // {
    //     return $this->hasMany(Propriete::class, 'id_dossier')
    //         ->where('is_archived', false); // ❌ Mauvais
    // }

    // ✅ Si vous voulez filtrer, créez des relations séparées
    public function proprietesActives(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_dossier')
            ->where('is_archived', false);
    }

    public function proprietesArchivees(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_dossier')
            ->where('is_archived', true);
    }
    // ============ ACCESSORS ============
    
    public function getDemandeursCountAttribute()
    {
        return $this->demandeurs()->count();
    }

    public function getProprietesCountAttribute()
    {
        return $this->proprietes()->count();
    }

    /**
     * Vérifier si le dossier est fermé
     */
    public function getIsClosedAttribute(): bool
    {
        return $this->date_fermeture !== null;
    }

    /**
     * Vérifier si le dossier est ouvert
     */
    public function getIsOpenAttribute(): bool
    {
        return $this->date_fermeture === null;
    }

    /**
     * Affichage formaté du numéro d'ouverture
     */
    public function getNumeroOuvertureDisplayAttribute(): string
    {
        if (!$this->numero_ouverture) {
            return 'Non assigné';
        }
        return $this->numero_ouverture;
    }

    /**
     * Label du statut pour l'affichage
     */
    public function getStatusLabelAttribute(): string
    {
        if ($this->is_closed) {
            return 'Fermé';
        }

        $proprietes = $this->proprietes()->count();
        $demandeurs = $this->demandeurs()->count();

        if ($proprietes === 0 && $demandeurs === 0) {
            return 'Vide';
        }

        if ($proprietes > 0 && $demandeurs > 0) {
            return 'En cours';
        }

        return 'Incomplet';
    }

    /**
     * Vérifier si le dossier peut être modifié
     */
    public function getCanBeModifiedAttribute(): bool
    {
        return $this->is_open;
    }

    // ============ SCOPES ============
    
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('date_fermeture');
    }

    public function scopeClosed(Builder $query): Builder
    {
        return $query->whereNotNull('date_fermeture');
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('date_descente_debut', '>=', now()->subDays($days));
    }

    public function scopeByCommune(Builder $query, string $commune): Builder
    {
        return $query->where('commune', 'ilike', "%{$commune}%");
    }

    public function scopeWithStats(Builder $query): Builder
    {
        return $query->withCount(['demandeurs', 'proprietes', 'demandes']);
    }

    public function scopeRecentlyClosed(Builder $query, int $days = 30): Builder
    {
        return $query->whereNotNull('date_fermeture')
            ->where('date_fermeture', '>=', now()->subDays($days));
    }

    /**
     * Recherche par numéro d'ouverture
     */
    public function scopeByNumeroOuverture(Builder $query, string $numero): Builder
    {
        return $query->where('numero_ouverture', 'like', "%{$numero}%");
    }

    // ============ MÉTHODES DE GESTION DE FERMETURE ============
    
    public function close(?int $userId = null, ?string $motif = null): bool
    {
        if ($this->is_closed) {
            return false;
        }

        $this->update([
            'date_fermeture' => now(),
            'closed_by' => $userId,
            'motif_fermeture' => $motif,
        ]);

        // Log de l'activité
        if (class_exists(\App\Models\ActivityLog::class) && $userId) {
            \App\Models\ActivityLog::create([
                'id_user' => $userId,
                'action' => 'close',
                'entity_type' => 'dossier',
                'entity_id' => $this->id,
                'id_district' => $this->id_district,
                'metadata' => json_encode([
                    'motif' => $motif,
                    'date_fermeture' => $this->date_fermeture,
                    'numero_ouverture' => $this->numero_ouverture,
                ]),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return true;
    }

    public function reopen(?int $userId = null): bool
    {
        if ($this->is_open) {
            return false;
        }

        $this->update([
            'date_fermeture' => null,
            'closed_by' => null,
            'motif_fermeture' => null,
        ]);

        // Log de l'activité
        if (class_exists(\App\Models\ActivityLog::class) && $userId) {
            \App\Models\ActivityLog::create([
                'id_user' => $userId,
                'action' => 'reopen',
                'entity_type' => 'dossier',
                'entity_id' => $this->id,
                'id_district' => $this->id_district,
                'metadata' => json_encode([
                    'reopened_at' => now(),
                    'numero_ouverture' => $this->numero_ouverture,
                ]),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return true;
    }

    public function canBeModifiedBy(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminDistrict() && $user->id_district === $this->id_district) {
            return true;
        }

        return $this->is_open && $user->canAccessDossier($this);
    }

    public function canBeClosedBy(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminDistrict() && $user->id_district === $this->id_district) {
            return true;
        }

        return false;
    }

    // ============ MÉTHODES HELPER ============
    
    public function isComplete(): bool
    {
        return $this->proprietes()->exists() && $this->demandeurs()->exists();
    }

    public function getStatusAttribute(): string
    {
        if ($this->is_closed) {
            return 'ferme';
        }

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

    public function getFullLocationAttribute(): string
    {
        return "{$this->commune}, {$this->fokontany} - District {$this->district->nom_district}";
    }

    /**
     * Obtenir le nombre de jours depuis l'ouverture
     */
    public function getDaysSinceOpeningAttribute(): int
    {
        if (!$this->date_ouverture) {
            return 0;
        }

        $dateOuverture = $this->date_ouverture instanceof Carbon 
            ? $this->date_ouverture 
            : Carbon::parse($this->date_ouverture);

        return $dateOuverture->diffInDays(now());
    }

    /**
     * Obtenir le nombre de jours depuis la fermeture
     */
    public function getDaysSinceClosureAttribute(): ?int
    {
        if (!$this->date_fermeture) {
            return null;
        }

        $dateFermeture = $this->date_fermeture instanceof Carbon 
            ? $this->date_fermeture 
            : Carbon::parse($this->date_fermeture);

        return $dateFermeture->diffInDays(now());
    }

    public function getStats(): array
    {
        return [
            'total_demandeurs' => $this->demandeurs()->count(),
            'total_proprietes' => $this->proprietes()->count(),
            'proprietes_archivees' => $this->proprietes()->where('is_archived', true)->count(),
            'demandes_actives' => $this->demandes()->where('status', 'active')->count(),
            'is_closed' => $this->is_closed,
            'days_since_opening' => $this->days_since_opening,
            'days_since_closure' => $this->days_since_closure,
            'numero_ouverture' => $this->numero_ouverture,
        ];
    }

    /**
     * Générer automatiquement un numéro d'ouverture
     * Format: DST-YYYY-0001
     */
    public static function generateNumeroOuverture(int $districtId): string
    {
        $district = District::find($districtId);
        $year = now()->year;
        
        // Récupérer le dernier numéro pour ce district cette année
        $lastDossier = static::where('id_district', $districtId)
            ->where('numero_ouverture', 'like', "DST{$district->id}-{$year}-%")
            ->orderBy('numero_ouverture', 'desc')
            ->first();

        if ($lastDossier && $lastDossier->numero_ouverture) {
            // Extraire le numéro séquentiel
            preg_match('/DST\d+-\d+-(\d+)$/', $lastDossier->numero_ouverture, $matches);
            $lastNumber = isset($matches[1]) ? intval($matches[1]) : 0;
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        // Format: DST1-2025-0001
        return sprintf("DST%d-%d-%04d", $district->id, $year, $nextNumber);
    }

    /**
     * Vérifier si un numéro d'ouverture existe déjà
     */
    public static function numeroOuvertureExists(string $numero, ?int $excludeId = null): bool
    {
        $query = static::where('numero_ouverture', $numero);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }

    // ============ BOOT METHOD ============
    
    protected static function boot()
    {
        parent::boot();

        // Générer automatiquement le numéro d'ouverture à la création si non fourni
        static::creating(function ($dossier) {
            if (empty($dossier->numero_ouverture)) {
                $dossier->numero_ouverture = static::generateNumeroOuverture($dossier->id_district);
            }

            // Définir la date d'ouverture par défaut
            if (empty($dossier->date_ouverture)) {
                $dossier->date_ouverture = $dossier->date_descente_debut ?? now();
            }
        });
    }
}