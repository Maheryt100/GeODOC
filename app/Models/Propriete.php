<?php

namespace App\Models;

use App\Traits\HasPiecesJointes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class Propriete extends Model
{
    use HasPiecesJointes;
    
    protected $fillable = [
        'lot',
        'propriete_mere',
        'titre_mere',
        'titre',
        'proprietaire',
        'contenance',
        'charge',
        'situation',
        'nature',
        'type_operation',
        'vocation',
        'numero_FN',
        'numero_requisition',
        'date_requisition',
        'date_inscription',
        'dep_vol',
        'numero_dep_vol',
        'id_dossier',
        'id_user',
    ];

    protected $casts = [
        'date_requisition' => 'date',
        'date_inscription' => 'date',
        'contenance' => 'integer',
    ];

    protected $appends = [
        'dep_vol_complet',
        'is_incomplete',
        'is_archived', // ✅ Calculé dynamiquement
        'has_active_demandes',
    ];

    // ============ RELATIONS ============
    
    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function demandeurs(): BelongsToMany
    {
        return $this->belongsToMany(
            Demandeur::class,
            'demander',
            'id_propriete',
            'id_demandeur'
        )->withPivot(['id', 'status', 'status_consort', 'ordre', 'total_prix', 'motif_archive'])
          ->withTimestamps();
    }

    public function demandes()
    {
        return $this->hasMany(Demander::class, 'id_propriete');
    }

    public function demandesActives()
    {
        return $this->demandes()->where('status', Demander::STATUS_ACTIVE);
    }

    public function demandesArchivees()
    {
        return $this->demandes()->where('status', Demander::STATUS_ARCHIVE);
    }

    public function recuPaiements()
    {
        return $this->hasMany(RecuPaiement::class, 'id_propriete');
    }

    // ============ ACCESSORS ============

    /**
     * ✅ CALCUL DYNAMIQUE : Une propriété est archivée SI :
     * - Elle a au moins UNE demande archivée
     * - ET aucune demande active
     * 
     * LOGIQUE : Toutes les demandes sont closes = propriété acquise
     */
    public function getIsArchivedAttribute(): bool
    {
        $demandesActives = $this->demandesActives()->count();
        $demandesArchivees = $this->demandesArchivees()->count();
        
        // ✅ Propriété acquise = AU MOINS 1 archivée ET AUCUNE active
        return $demandesArchivees > 0 && $demandesActives === 0;
    }

    /**
     * ✅ Vérifier si a des demandes actives
     */
    public function getHasActiveDemandesAttribute(): bool
    {
        return $this->demandesActives()->exists();
    }

    /**
     * Format complet du dep/vol avec numéro
     */
    public function getDepVolCompletAttribute(): string
    {
        if (!$this->dep_vol) {
            return '-';
        }

        if ($this->numero_dep_vol) {
            return "{$this->dep_vol} n°{$this->numero_dep_vol}";
        }

        return $this->dep_vol;
    }

    /**
     * Vérifier si la propriété est incomplète
     */
    public function getIsIncompleteAttribute(): bool
    {
        return !$this->titre 
            || !$this->contenance 
            || !$this->proprietaire 
            || !$this->nature 
            || !$this->vocation 
            || !$this->situation;
    }

    /**
     * Obtenir le prix selon la vocation et le district
     */
    public function getPrixUnitaire(): int
    {
        if (!$this->dossier || !$this->dossier->district) {
            return 0;
        }

        $district = $this->dossier->district;
        
        return match(strtolower($this->vocation)) {
            'edilitaire' => $district->edilitaire ?? 0,
            'agricole' => $district->agricole ?? 0,
            'forestiere', 'forestière' => $district->forestiere ?? 0,
            'touristique' => $district->touristique ?? 0,
            default => 0,
        };
    }

    /**
     * Calculer le prix total
     */
    public function getPrixTotal(): int
    {
        if (!$this->contenance) {
            return 0;
        }

        return $this->getPrixUnitaire() * $this->contenance;
    }

    /**
     * Formater le titre complet
     */
    public function getTitreCompletAttribute(): string
    {
        if (!$this->titre) {
            return 'Non attribué';
        }
        return "TNº{$this->titre}";
    }

    // ============ MÉTHODES MÉTIER ============

    /**
     * ✅ Vérifier si peut être dissociée
     */
    public function canBeDissociated(): bool
    {
        // ✅ Ne peut pas dissocier si TOUTES les demandes sont archivées
        if ($this->is_archived) {
            return false;
        }

        // Ne peut pas dissocier si le dossier est fermé
        if ($this->dossier && $this->dossier->is_closed) {
            return false;
        }

        return true;
    }

    /**
     * ✅ Vérifier si peut être modifiée
     */
    public function canBeModified(): bool
    {
        // ✅ Peut modifier SI au moins UNE demande est active
        if ($this->is_archived) {
            return false;
        }

        if ($this->dossier && $this->dossier->is_closed) {
            return false;
        }

        return true;
    }

    /**
     * Obtenir le nombre de demandeurs actifs
     */
    public function getActiveDemandeursCount(): int
    {
        return $this->demandesActives()->count();
    }

    /**
     * ✅ Obtenir le demandeur principal
     */
    public function getMainDemandeur(): ?Demandeur
    {
        $demande = $this->demandesActives()
            ->where('ordre', 1)
            ->with('demandeur')
            ->first();

        return $demande?->demandeur;
    }

    /**
     * ✅ Obtenir tous les demandeurs actifs avec ordre
     */
    public function getActiveDemandeursWithOrder(): array
    {
        return $this->demandesActives()
            ->orderBy('ordre')
            ->with('demandeur')
            ->get()
            ->map(function ($demande) {
                return [
                    'demande_id' => $demande->id,
                    'demandeur' => $demande->demandeur,
                    'ordre' => $demande->ordre,
                    'is_principal' => $demande->ordre === 1,
                    'total_prix' => $demande->total_prix,
                ];
            })
            ->toArray();
    }

    /**
     * Obtenir les statistiques de la propriété
     */
    public function getStats(): array
    {
        return [
            'total_demandes' => $this->demandes()->count(),
            'demandes_actives' => $this->demandesActives()->count(),
            'demandes_archivees' => $this->demandesArchivees()->count(),
            'is_archived' => $this->is_archived,
            'has_active_demandes' => $this->has_active_demandes,
            'prix_unitaire' => $this->getPrixUnitaire(),
            'prix_total' => $this->getPrixTotal(),
            'is_complete' => !$this->is_incomplete,
            'demandeur_principal' => $this->getMainDemandeur()?->nom_complet,
        ];
    }

    // ============ SCOPES ============
    
    /**
     * ✅ Propriétés avec au moins une demande active
     */
    public function scopeWithActiveDemandes(Builder $query): Builder
    {
        return $query->whereHas('demandesActives');
    }

    /**
     * ✅ Propriétés sans aucune demande active (vides OU archivées)
     */
    public function scopeWithoutActiveDemandes(Builder $query): Builder
    {
        return $query->whereDoesntHave('demandesActives');
    }

    /**
     * ✅ Propriétés archivées (toutes demandes archivées)
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereHas('demandesArchivees')
            ->whereDoesntHave('demandesActives');
    }

    /**
     * ✅ Propriétés sans aucune demande (jamais liées)
     */
    public function scopeEmpty(Builder $query): Builder
    {
        return $query->whereDoesntHave('demandes');
    }

    public function scopeByDossier(Builder $query, int $dossierId): Builder
    {
        return $query->where('id_dossier', $dossierId);
    }

    public function scopeByVocation(Builder $query, string $vocation): Builder
    {
        return $query->where('vocation', 'ilike', "%{$vocation}%");
    }

    public function scopeByNature(Builder $query, string $nature): Builder
    {
        return $query->where('nature', 'ilike', "%{$nature}%");
    }

    public function scopeIncomplete(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('titre')
              ->orWhereNull('contenance')
              ->orWhereNull('proprietaire')
              ->orWhereNull('nature')
              ->orWhereNull('vocation')
              ->orWhereNull('situation');
        });
    }

    public function scopeByLot(Builder $query, string $lot): Builder
    {
        return $query->where('lot', 'like', "%{$lot}%");
    }

    // ============ BOOT METHOD ============
    
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($propriete) {
            if ($propriete->lot) {
                $propriete->lot = strtoupper($propriete->lot);
            }

            if ($propriete->nature) {
                $propriete->nature = ucfirst(strtolower($propriete->nature));
            }

            if ($propriete->vocation) {
                $propriete->vocation = ucfirst(strtolower($propriete->vocation));
            }
        });
    }
}