<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Demander extends Model
{
    protected $table = 'demander';
    
    protected $fillable = [
        'id_demandeur',
        'id_propriete',
        'total_prix',
        'status',
        'status_consort',
        'motif_archive',
        'id_user',
    ];

    protected $casts = [
        'total_prix' => 'integer',
        'status_consort' => 'boolean',
    ];

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

    /**
     * Consorts liés à cette demande
     */
    public function consorts(): BelongsToMany
    {
        return $this->belongsToMany(
            Consort::class,
            'demande_consorts',
            'id_demande',
            'id_consort'
        )->withTimestamps();
    }

    /**
     * Utilisateurs ayant téléchargé cette demande
     */
    public function userDemandes()
    {
        return $this->hasMany(UserDemande::class, 'id_demande');
    }

    /**
     * Utilisateurs ayant téléchargé le CSF
     */
    public function userCSF()
    {
        return $this->hasMany(UserCSF::class, 'id_demande');
    }

    // ============ SCOPES ============
    
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archive');
    }

    public function scopeWithConsorts($query)
    {
        return $query->where('status_consort', true);
    }

    public function scopeWithoutConsorts($query)
    {
        return $query->where('status_consort', false);
    }

    // ============ ACCESSORS ============

    /**
     * Vérifier si la demande a des consorts
     */
    public function hasConsorts(): bool
    {
        return $this->status_consort || $this->consorts()->exists();
    }

    /**
     * Obtenir le nombre de consorts
     */
    public function getConsortsCount(): int
    {
        return $this->consorts()->count();
    }

    /**
     * Formater le prix pour affichage
     */
    public function getPrixFormatte(): string
    {
        return number_format($this->total_prix, 0, ',', ' ') . ' Ar';
    }

    /**
     * Vérifier si la demande peut être modifiée
     */
    public function canBeModified(): bool
    {
        // Ne peut pas modifier si archivée
        if ($this->status === 'archive') {
            return false;
        }

        // Vérifier si le dossier est fermé
        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return true;
    }

    // ============ MÉTHODES MÉTIER ============

    /**
     * Archiver la demande
     */
    public function archive(string $motif = null): bool
    {
        return $this->update([
            'status' => 'archive',
            'motif_archive' => $motif
        ]);
    }

    /**
     * Désarchiver la demande
     */
    public function unarchive(): bool
    {
        return $this->update([
            'status' => 'active',
            'motif_archive' => null
        ]);
    }

    /**
     * Obtenir tous les demandeurs (principal + consorts)
     */
    public function getAllDemandeurs(): array
    {
        $demandeurs = [$this->demandeur];

        if ($this->hasConsorts()) {
            $consorts = $this->consorts()
                ->with('consort')
                ->get()
                ->pluck('consort')
                ->filter();
            
            $demandeurs = array_merge($demandeurs, $consorts->toArray());
        }

        return $demandeurs;
    }
}