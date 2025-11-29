<?php

namespace App\Models;

use App\Traits\HasPiecesJointes;
use App\Traits\HasDistrictScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Demandeur extends Model
{
    use HasPiecesJointes, HasDistrictScope;

    protected $fillable = [
        'titre_demandeur',
        'nom_demandeur',
        'prenom_demandeur',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'occupation',
        'nom_pere',
        'nom_mere',
        'cin',
        'date_delivrance',
        'lieu_delivrance',
        'date_delivrance_duplicata',
        'lieu_delivrance_duplicata',
        'domiciliation',
        'situation_familiale',
        'regime_matrimoniale',
        'date_mariage',
        'lieu_mariage',
        'nationalite',
        'marie_a',
        'telephone',
        'id_user'
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_delivrance' => 'date',
        'date_delivrance_duplicata' => 'date',
        'date_mariage' => 'date',
    ];

    protected $appends = [
        'nom_complet',
        'is_incomplete',
    ];

    // ============ RELATIONS ============

    public function dossiers(): BelongsToMany
    {
        return $this->belongsToMany(Dossier::class, 'contenir', 'id_demandeur', 'id_dossier')
            ->withTimestamps();
    }

    public function proprietes(): BelongsToMany
    {
        return $this->belongsToMany(Propriete::class, 'demander', 'id_demandeur', 'id_propriete')
            ->withPivot(['id', 'status', 'status_consort', 'total_prix', 'motif_archive'])
            ->withTimestamps();
    }

    /**
     * ✅ NOUVEAU : Relation directe vers les demandes (associations)
     */
    public function demandes(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_demandeur');
    }

    /**
     * ✅ Demandes actives uniquement
     */
    public function demandesActives(): HasMany
    {
        return $this->demandes()->where('status', 'active');
    }

    /**
     * ✅ Demandes archivées (acquises)
     */
    public function demandesArchivees(): HasMany
    {
        return $this->demandes()->where('status', 'archive');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    // ============ ACCESSORS ============

    /**
     * Nom complet formaté
     */
    public function getNomCompletAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->titre_demandeur,
            $this->nom_demandeur,
            $this->prenom_demandeur
        ])));
    }

    /**
     * Vérifier si le demandeur est incomplet
     */
    public function getIsIncompleteAttribute(): bool
    {
        return !$this->date_naissance
            || !$this->lieu_naissance
            || !$this->date_delivrance
            || !$this->lieu_delivrance
            || !$this->domiciliation
            || !$this->occupation
            || !$this->nom_mere;
    }

    // ============ SCOPES ============

    public function scopeIncomplete($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('date_naissance')
              ->orWhereNull('lieu_naissance')
              ->orWhereNull('date_delivrance')
              ->orWhereNull('lieu_delivrance')
              ->orWhereNull('domiciliation')
              ->orWhereNull('occupation')
              ->orWhereNull('nom_mere');
        });
    }

    public function scopeByCin($query, string $cin)
    {
        return $query->where('cin', 'like', "%{$cin}%");
    }

    public function scopeByNom($query, string $nom)
    {
        return $query->where(function ($q) use ($nom) {
            $q->where('nom_demandeur', 'ilike', "%{$nom}%")
              ->orWhere('prenom_demandeur', 'ilike', "%{$nom}%");
        });
    }

    // ============ MÉTHODES MÉTIER ============

    /**
     * ✅ Vérifier si peut être dissocié d'une propriété
     */
    public function canBeDissociatedFrom(Propriete $propriete): bool
    {
        // Trouver la demande active
        $demande = $this->demandesActives()
            ->where('id_propriete', $propriete->id)
            ->first();

        if (!$demande) {
            return false;
        }

        return $demande->canBeDissociated();
    }

    /**
     * ✅ Obtenir le nombre de propriétés actives
     */
    public function getActiveProprietesCount(): int
    {
        return $this->demandesActives()->count();
    }

    /**
     * ✅ Obtenir le nombre de propriétés acquises
     */
    public function getAcquiredProprietesCount(): int
    {
        return $this->demandesArchivees()->count();
    }

    /**
     * ✅ Vérifier si a des propriétés
     */
    public function hasProprietes(): bool
    {
        return $this->demandes()->exists();
    }

    /**
     * ✅ Obtenir les statistiques du demandeur
     */
    public function getStats(): array
    {
        return [
            'total_proprietes' => $this->demandes()->count(),
            'proprietes_actives' => $this->getActiveProprietesCount(),
            'proprietes_acquises' => $this->getAcquiredProprietesCount(),
            'is_complete' => !$this->is_incomplete,
            'total_dossiers' => $this->dossiers()->count(),
        ];
    }

    /**
     * ✅ Formater pour export
     */
    public function toExportArray(): array
    {
        return [
            'Titre' => $this->titre_demandeur,
            'Nom' => $this->nom_demandeur,
            'Prénom' => $this->prenom_demandeur ?? '',
            'CIN' => $this->cin,
            'Date naissance' => $this->date_naissance?->format('d/m/Y') ?? '',
            'Lieu naissance' => $this->lieu_naissance ?? '',
            'Sexe' => $this->sexe ?? '',
            'Occupation' => $this->occupation ?? '',
            'Domiciliation' => $this->domiciliation ?? '',
            'Téléphone' => $this->telephone ?? '',
            'Situation' => $this->situation_familiale ?? '',
            'Nb propriétés' => $this->getActiveProprietesCount(),
        ];
    }

    // ============ BOOT METHOD ============

    protected static function boot()
    {
        parent::boot();

        // Normaliser les noms avant sauvegarde
        static::saving(function ($demandeur) {
            if ($demandeur->nom_demandeur) {
                $demandeur->nom_demandeur = strtoupper($demandeur->nom_demandeur);
            }
            if ($demandeur->prenom_demandeur) {
                $demandeur->prenom_demandeur = ucwords(strtolower($demandeur->prenom_demandeur));
            }
        });
    }
}