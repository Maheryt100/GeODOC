<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;

class Demander extends Model
{
    protected $table = 'demander';
    
    protected $fillable = [
        'id_demandeur',
        'id_propriete',
        'total_prix',
        'status',
        'status_consort',
        'ordre', // ✅ NOUVEAU
        'motif_archive',
        'id_user',
    ];

    protected $casts = [
        'total_prix' => 'integer',
        'status_consort' => 'boolean',
        'ordre' => 'integer', // ✅ NOUVEAU
    ];

    // ============ CONSTANTES ============
    
    const STATUS_ACTIVE = 'active';
    const STATUS_ARCHIVE = 'archive';
    const STATUS_PENDING = 'pending';
    const STATUS_CANCELLED = 'cancelled';

    // ============ RELATIONS ============
    
    public function demandeur(): BelongsTo
    {
        return $this->belongsTo(Demandeur::class, 'id_demandeur');
    }
    
    public function propriete(): BelongsTo
    {
        return $this->belongsTo(Propriete::class, 'id_propriete');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function consorts(): BelongsToMany
    {
        return $this->belongsToMany(
            Consort::class,
            'demande_consorts',
            'id_demande',
            'id_consort'
        )->withTimestamps();
    }

    // ============ ACCESSORS ============

    /**
     * ✅ Vérifier si c'est le demandeur principal
     */
    public function getIsPrincipalAttribute(): bool
    {
        return $this->ordre === 1;
    }

    /**
     * ✅ Vérifier si la demande est active
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * ✅ Vérifier si la demande est archivée
     */
    public function getIsArchivedAttribute(): bool
    {
        return $this->status === self::STATUS_ARCHIVE;
    }

    // ============ SCOPES ============
    
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVE);
    }

    public function scopePrincipal($query)
    {
        return $query->where('ordre', 1);
    }

    public function scopeConsorts($query)
    {
        return $query->where('ordre', '>', 1);
    }

    public function scopeForPropriete($query, int $proprieteId)
    {
        return $query->where('id_propriete', $proprieteId)
            ->orderBy('ordre', 'asc');
    }

    // ============ MÉTHODES MÉTIER ============

    /**
     * ✅ Vérifier si peut être dissociée
     */
    public function canBeDissociated(): bool
    {
        // ✅ LOGIQUE CORRECTE selon vos spécifications :
        // - Une demande ACTIVE peut être dissociée
        // - Une demande ARCHIVÉE ne peut PAS être dissociée
        // - Le dossier ne doit pas être fermé
        
        if ($this->status === self::STATUS_ARCHIVE) {
            return false;
        }

        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return true;
    }

    /**
     * ✅ Vérifier si peut être modifiée
     */
    public function canBeModified(): bool
    {
        if ($this->status === self::STATUS_ARCHIVE) {
            return false;
        }

        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return true;
    }

    /**
     * ✅ Archiver la demande
     */
    public function archive(string $motif = null): bool
    {
        return $this->update([
            'status' => self::STATUS_ARCHIVE,
            'motif_archive' => $motif
        ]);
    }

    /**
     * ✅ Désarchiver la demande
     */
    public function unarchive(): bool
    {
        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'motif_archive' => null
        ]);
    }

    /**
     * ✅ NOUVEAU : Promouvoir un consort en principal
     */
    public function promoteToMain(): bool
    {
        if ($this->ordre === 1) {
            return false; // Déjà principal
        }

        DB::transaction(function () {
            // Trouver l'actuel principal
            $currentMain = static::where('id_propriete', $this->id_propriete)
                ->where('ordre', 1)
                ->first();

            if ($currentMain) {
                // Échanger les ordres
                $currentMain->update(['ordre' => $this->ordre]);
            }

            $this->update(['ordre' => 1]);
        });

        return true;
    }

    /**
     * ✅ Obtenir tous les demandeurs de cette propriété (avec ordre)
     */
    public function getAllDemandeurs(): array
    {
        $demandes = static::where('id_propriete', $this->id_propriete)
            ->where('status', self::STATUS_ACTIVE)
            ->orderBy('ordre')
            ->with('demandeur')
            ->get();

        return $demandes->map(function ($demande) {
            return [
                'demande_id' => $demande->id,
                'demandeur' => $demande->demandeur,
                'ordre' => $demande->ordre,
                'is_principal' => $demande->is_principal,
            ];
        })->toArray();
    }

    /**
     * ✅ Obtenir le demandeur principal de cette propriété
     */
    public static function getMainDemandeur(int $proprieteId): ?self
    {
        return static::where('id_propriete', $proprieteId)
            ->where('status', self::STATUS_ACTIVE)
            ->where('ordre', 1)
            ->with('demandeur')
            ->first();
    }

    /**
     * ✅ Formater le prix pour affichage
     */
    public function getPrixFormatte(): string
    {
        return number_format($this->total_prix, 0, ',', ' ') . ' Ar';
    }

    // ============ BOOT METHOD ============

    protected static function boot()
    {
        parent::boot();

        // ✅ Auto-calculer l'ordre lors de la création
        static::creating(function ($demande) {
            if (!$demande->ordre) {
                $maxOrdre = static::where('id_propriete', $demande->id_propriete)
                    ->max('ordre') ?? 0;
                
                $demande->ordre = $maxOrdre + 1;
            }

            // ✅ Si c'est le premier, marquer status_consort = false
            if ($demande->ordre === 1) {
                $demande->status_consort = false;
            } else {
                $demande->status_consort = true;
            }
        });

        // ✅ Réorganiser les ordres après suppression
        static::deleted(function ($demande) {
            $remaining = static::where('id_propriete', $demande->id_propriete)
                ->orderBy('ordre')
                ->get();

            foreach ($remaining as $index => $d) {
                $newOrdre = $index + 1;
                if ($d->ordre !== $newOrdre) {
                    $d->update([
                        'ordre' => $newOrdre,
                        'status_consort' => $newOrdre > 1
                    ]);
                }
            }
        });
    }
}