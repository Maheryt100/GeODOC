<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class DocumentGenere extends Model
{
    use HasFactory;
    
    protected $table = 'documents_generes';
    
    // Types de documents
    const TYPE_RECU = 'RECU';
    const TYPE_ADV = 'ADV';
    const TYPE_CSF = 'CSF';
    const TYPE_REQ = 'REQ';

    // Status
    const STATUS_ACTIVE = 'active';
    const STATUS_ARCHIVED = 'archived';
    const STATUS_OBSOLETE = 'obsolete';

    protected $fillable = [
        'type_document',
        'id_propriete',
        'id_demandeur',
        'id_dossier',
        'id_district',
        'numero_document',
        'file_path',
        'nom_fichier',
        'montant',
        'date_document',
        'has_consorts',
        'demandeurs_ids',
        'metadata',
        'generated_by',
        'generated_at',
        'download_count',
        'last_downloaded_at',
        'status',
    ];

    protected $casts = [
        'date_document' => 'date',
        'generated_at' => 'datetime',
        'last_downloaded_at' => 'datetime',
        'montant' => 'integer',
        'has_consorts' => 'boolean',
        'demandeurs_ids' => 'array',
        'metadata' => 'array',
        'download_count' => 'integer',
    ];

    /**
     * Relations
     */
    public function propriete()
    {
        return $this->belongsTo(Propriete::class, 'id_propriete');
    }

    public function demandeur()
    {
        return $this->belongsTo(Demandeur::class, 'id_demandeur');
    }

    public function dossier()
    {
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }

    public function district()
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type_document', $type);
    }

    /**
     * Vérifier si le fichier existe
     */
    public function fileExists(): bool
    {
        return $this->file_path && Storage::disk('public')->exists($this->file_path);
    }

    /**
     * Incrémenter le compteur de téléchargements
     */
    public function incrementDownloadCount()
    {
        $this->increment('download_count');
        $this->update(['last_downloaded_at' => now()]);
    }

    /**
     * ✅ CORRIGÉ : Récupérer un document existant avec vérification du district
     * 
     * @param string $type Type de document (RECU, ADV, CSF, REQ)
     * @param int $idPropriete
     * @param int|null $idDemandeur
     * @param int|null $idDistrict Ajout du paramètre district
     * @return self|null
     */
    public static function findExisting(
        string $type, 
        int $idPropriete, 
        ?int $idDemandeur = null,
        ?int $idDistrict = null
    ): ?self {
        $query = self::where('type_document', $type)
            ->where('id_propriete', $idPropriete)
            ->where('status', self::STATUS_ACTIVE);

        // ✅ AJOUT : Vérification du district pour éviter les conflits
        if ($idDistrict) {
            $query->where('id_district', $idDistrict);
        }

        // Pour REQ, pas besoin de demandeur
        if ($type === self::TYPE_REQ) {
            return $query->first();
        }

        // Pour les autres, vérifier le demandeur
        if ($idDemandeur) {
            $query->where(function($q) use ($idDemandeur) {
                // Soit c'est le demandeur principal
                $q->where('id_demandeur', $idDemandeur)
                  // Soit il fait partie des consorts
                  ->orWhereJsonContains('demandeurs_ids', $idDemandeur);
            });
        }

        return $query->first();
    }

    /**
     * ✅ NOUVEAU : Vérifier si un document existe pour une propriété (peu importe le demandeur)
     */
    public static function existsForPropriete(string $type, int $idPropriete, ?int $idDistrict = null): bool
    {
        $query = self::where('type_document', $type)
            ->where('id_propriete', $idPropriete)
            ->where('status', self::STATUS_ACTIVE);

        if ($idDistrict) {
            $query->where('id_district', $idDistrict);
        }

        return $query->exists();
    }

    /**
     * Obtenir le nom d'affichage du type de document
     */
    public function getTypeDisplayAttribute(): string
    {
        return match($this->type_document) {
            self::TYPE_RECU => 'Reçu de Paiement',
            self::TYPE_ADV => 'Acte de Vente',
            self::TYPE_CSF => 'Certificat de Situation Financière',
            self::TYPE_REQ => 'Réquisition',
            default => $this->type_document,
        };
    }

    /**
     * Obtenir le chemin complet du fichier
     */
    public function getFullPathAttribute(): string
    {
        return Storage::disk('public')->path($this->file_path);
    }

    /**
     * ✅ NOUVEAU : Obtenir l'URL de téléchargement
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('documents.recu.download', $this->id);
    }

    /**
     * ✅ NOUVEAU : Marquer comme obsolète (soft delete)
     */
    public function markAsObsolete(): bool
    {
        return $this->update(['status' => self::STATUS_OBSOLETE]);
    }
}