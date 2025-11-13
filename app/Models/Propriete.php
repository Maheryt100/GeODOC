<?php

namespace App\Models;

use App\Traits\HasPiecesJointes;
use App\Traits\HasDistrictScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Propriete extends Model
{
    use HasPiecesJointes, HasDistrictScope;
    
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
        'vocation',
        'numero_FN',
        'numero_requisition',
        'date_requisition',
        'date_inscription',
        'dep_vol',
        'status',
        'type_operation',
        'id_dossier',
        'id_user'
    ];

    protected $casts = [
        'date_requisition' => 'date',
        'date_inscription' => 'date',
        'status' => 'boolean',
        'contenance' => 'integer',
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

    public function demandes(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete');
    }

    public function demandesActives(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->where('status', 'active');
    }

    public function demandesArchivees(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->where('status', 'archive');
    }

    public function demandeurs()
    {
        return $this->belongsToMany(Demandeur::class, 'demander', 'id_propriete', 'id_demandeur')
            ->wherePivot('status', 'active');
    }

    // ============ ACCESSORS ============

    /**
     * Vérifier si la propriété est archivée (acquise)
     */
    public function getIsArchivedAttribute(): bool
    {
        $activeCount = $this->demandesActives()->count();
        $archivedCount = $this->demandesArchivees()->count();
        
        return $archivedCount > 0 && $activeCount === 0;
    }

    /**
     * Obtenir le statut formaté
     */
    public function getStatusTextAttribute(): string
    {
        if ($this->is_archived) {
            return 'Archivée (Acquise)';
        }

        return $this->status ? 'Active' : 'Inactive';
    }

    /**
     * Obtenir la contenance formatée en Ha A Ca
     */
    public function getContenanceFormattedAttribute(): string
    {
        $superficie = $this->contenance;
        
        $hectares = intdiv($superficie, 10000);
        $reste = $superficie % 10000;
        $ares = intdiv($reste, 100);
        $centiares = $reste % 100;

        $result = '';
        
        if ($hectares > 0) {
            $result .= str_pad($hectares, 2, '0', STR_PAD_LEFT) . 'Ha ';
        }
        
        if ($ares > 0 || $hectares > 0) {
            $result .= str_pad($ares, 2, '0', STR_PAD_LEFT) . 'A ';
        }
        
        $result .= str_pad($centiares, 2, '0', STR_PAD_LEFT) . 'Ca';

        return trim($result);
    }

    /**
     * Obtenir le prix unitaire selon la vocation et le district
     */
    public function getPrixUnitaireAttribute(): ?int
    {
        if (!$this->dossier || !$this->dossier->district) {
            return null;
        }

        $vocationMap = [
            'Edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Touristique' => 'touristique',
        ];

        $columnName = $vocationMap[$this->vocation] ?? null;
        
        if (!$columnName) {
            return null;
        }

        return $this->dossier->district->$columnName ?? null;
    }

    /**
     * Calculer le prix total
     */
    public function getPrixTotalAttribute(): ?int
    {
        $prixUnitaire = $this->prix_unitaire;
        
        if (!$prixUnitaire || !$this->contenance) {
            return null;
        }

        return $prixUnitaire * $this->contenance;
    }

    // ============ SCOPES ============

    /**
     * Propriétés actives (non archivées)
     */
    public function scopeActive($query)
    {
        return $query->whereHas('demandesActives');
    }

    /**
     * Propriétés archivées
     */
    public function scopeArchived($query)
    {
        return $query->whereHas('demandesArchivees')
            ->whereDoesntHave('demandesActives');
    }

    /**
     * Propriétés par vocation
     */
    public function scopeByVocation($query, string $vocation)
    {
        return $query->where('vocation', $vocation);
    }

    /**
     * Propriétés par nature
     */
    public function scopeByNature($query, string $nature)
    {
        return $query->where('nature', $nature);
    }

    // ============ MÉTHODES HELPER ============

    /**
     * Vérifier si la propriété peut être modifiée
     */
    public function canBeModified(): bool
    {
        return !$this->is_archived;
    }

    /**
     * Vérifier si la propriété peut être archivée
     */
    public function canBeArchived(): bool
    {
        return $this->demandesActives()->count() > 0;
    }

    /**
     * Obtenir les demandeurs avec leur statut
     */
    public function getDemandeursWithStatus()
    {
        return $this->demandes()
            ->with('demandeur')
            ->get()
            ->map(function ($demande) {
                return [
                    'demandeur' => $demande->demandeur,
                    'status' => $demande->status,
                    'status_consort' => $demande->status_consort,
                    'total_prix' => $demande->total_prix,
                ];
            });
    }
}