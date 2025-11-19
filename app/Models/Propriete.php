<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class Propriete extends Model
{
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
        'numero_dep_vol', // ✅ NOUVEAU
        'status',
        'is_archived',
        'id_dossier',
        'id_user',
    ];

    protected $casts = [
        'date_requisition' => 'date',
        'date_inscription' => 'date',
        'status' => 'boolean',
        'is_archived' => 'boolean',
        'contenance' => 'integer',
    ];

    protected $appends = [
        'dep_vol_complet', // ✅ NOUVEAU: Format "Dep/Vol - Numéro"
        'is_incomplete',
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
        )->withPivot(['status', 'status_consort', 'total_prix', 'motif_archive'])
          ->withTimestamps();
    }

    public function demandes()
    {
        return $this->hasMany(Demander::class, 'id_propriete');
    }

    public function demandesActives()
    {
        return $this->demandes()->where('status', 'active');
    }

    public function recuPaiements()
    {
        return $this->hasMany(RecuPaiement::class, 'id_propriete');
    }

    // ============ ACCESSORS ============

    /**
     * Format complet du dep/vol avec numéro
     * Format: "299:041" ou "299" si pas de numéro
     */
    public function getDepVolCompletAttribute(): string
    {
        if (!$this->dep_vol) {
            return '-';
        }

        if ($this->numero_dep_vol) {
            return "{$this->dep_vol}:{$this->numero_dep_vol}";
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

    // ============ SCOPES ============
    
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('is_archived', true);
    }

    public function scopeNotArchived(Builder $query): Builder
    {
        return $query->where('is_archived', false);
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

    public function scopeWithDemandeurs(Builder $query): Builder
    {
        return $query->has('demandeurs');
    }

    public function scopeWithoutDemandeurs(Builder $query): Builder
    {
        return $query->doesntHave('demandeurs');
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

    /**
     * Recherche par lot
     */
    public function scopeByLot(Builder $query, string $lot): Builder
    {
        return $query->where('lot', 'like', "%{$lot}%");
    }

    /**
     * Recherche par titre
     */
    public function scopeByTitre(Builder $query, string $titre): Builder
    {
        return $query->where('titre', 'like', "%{$titre}%");
    }

    /**
     * Recherche par dep/vol complet
     */
    public function scopeByDepVol(Builder $query, string $depVol): Builder
    {
        return $query->where(function($q) use ($depVol) {
            $q->where('dep_vol', 'like', "%{$depVol}%")
              ->orWhere('numero_dep_vol', 'like', "%{$depVol}%");
        });
    }

    // ============ MÉTHODES MÉTIER ============

    /**
     * Archiver la propriété
     */
    public function archive(): bool
    {
        return $this->update(['is_archived' => true]);
    }

    /**
     * Désarchiver la propriété
     */
    public function unarchive(): bool
    {
        return $this->update(['is_archived' => false]);
    }

    /**
     * Vérifier si la propriété a des demandeurs actifs
     */
    public function hasActiveDemandeurs(): bool
    {
        return $this->demandesActives()->exists();
    }

    /**
     * Obtenir le nombre de demandeurs actifs
     */
    public function getActiveDemandeursCount(): int
    {
        return $this->demandesActives()->count();
    }

    /**
     * Vérifier si la propriété peut être modifiée
     */
    public function canBeModified(): bool
    {
        if ($this->is_archived) {
            return false;
        }

        // Vérifier si le dossier parent est fermé
        if ($this->dossier && $this->dossier->is_closed) {
            return false;
        }

        return true;
    }

    /**
     * Obtenir les statistiques de la propriété
     */
    public function getStats(): array
    {
        return [
            'total_demandeurs' => $this->demandeurs()->count(),
            'demandeurs_actifs' => $this->demandesActives()->count(),
            'is_archived' => $this->is_archived,
            'prix_unitaire' => $this->getPrixUnitaire(),
            'prix_total' => $this->getPrixTotal(),
            'is_complete' => !$this->is_incomplete,
            'has_demandeurs' => $this->hasActiveDemandeurs(),
        ];
    }

    /**
     * Formater les informations pour l'export
     */
    public function toExportArray(): array
    {
        return [
            'Lot' => $this->lot,
            'Titre' => $this->titre_complet,
            'Dep/Vol' => $this->dep_vol_complet,
            'Contenance (m²)' => $this->contenance,
            'Propriétaire' => $this->proprietaire,
            'Nature' => ucfirst($this->nature ?? ''),
            'Vocation' => ucfirst($this->vocation ?? ''),
            'Situation' => $this->situation,
            'Prix unitaire' => number_format($this->getPrixUnitaire(), 0, ',', ' ') . ' Ar',
            'Prix total' => number_format($this->getPrixTotal(), 0, ',', ' ') . ' Ar',
            'Statut' => $this->is_archived ? 'Acquise' : 'Active',
            'Nb demandeurs' => $this->getActiveDemandeursCount(),
        ];
    }

    // ============ VALIDATION HELPERS ============

    /**
     * Valider le format du dep/vol
     */
    public static function validateDepVolFormat(string $depVol): bool
    {
        // Format attendu: numéros (ex: 299)
        return is_numeric($depVol) || preg_match('/^\d+$/', $depVol) === 1;
    }

    /**
     * Valider le format du numéro dep/vol
     */
    public static function validateNumeroDepVolFormat(string $numero): bool
    {
        // Format attendu: numéros avec ou sans zéros devant (ex: 041, 41)
        return is_numeric($numero) || preg_match('/^\d+$/', $numero) === 1;
    }

    /**
     * Valider le numéro de lot
     */
    public static function validateLotFormat(string $lot): bool
    {
        // Le lot peut contenir lettres et chiffres
        return preg_match('/^[A-Z0-9-]+$/i', $lot) === 1;
    }

    // ============ BOOT METHOD ============
    
    protected static function boot()
    {
        parent::boot();

        // Avant la sauvegarde, valider certains champs
        static::saving(function ($propriete) {
            // Normaliser le format du lot (majuscules)
            if ($propriete->lot) {
                $propriete->lot = strtoupper($propriete->lot);
            }

            // Normaliser la nature
            if ($propriete->nature) {
                $propriete->nature = ucfirst(strtolower($propriete->nature));
            }

            // Normaliser la vocation
            if ($propriete->vocation) {
                $propriete->vocation = ucfirst(strtolower($propriete->vocation));
            }
        });
    }
}