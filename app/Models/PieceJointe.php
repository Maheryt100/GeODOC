<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PieceJointe extends Model
{
    use SoftDeletes;

    protected $table = 'pieces_jointes';

    // ============ CONSTANTES CATÉGORIES ============
    const CATEGORIE_GLOBAL = 'global';
    const CATEGORIE_DEMANDEUR = 'demandeur';
    const CATEGORIE_PROPRIETE = 'propriete';
    const CATEGORIE_ADMINISTRATIF = 'administratif';

    // ============ TYPES DE DOCUMENTS ============
    const TYPE_CIN = 'CIN';
    const TYPE_ACTE_NAISSANCE = 'Acte de naissance';
    const TYPE_ACTE_MARIAGE = 'Acte de mariage';
    const TYPE_CERTIFICAT_RESIDENCE = 'Certificat de résidence';
    const TYPE_PLAN_TERRAIN = 'Plan du terrain';
    const TYPE_TITRE_FONCIER = 'Titre foncier';
    const TYPE_PV_BORNAGE = 'PV de bornage';
    const TYPE_AUTRE = 'Autre';

    protected $fillable = [
        'attachable_type',
        'attachable_id',
        'nom_original',
        'nom_fichier',
        'chemin',
        'type_mime',
        'taille',
        'extension',
        'categorie',
        'type_document',
        'description',
        'id_user',
        'id_district',
        'is_verified',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'taille' => 'integer',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'attachable_id' => 'integer',
        'id_user' => 'integer',
        'id_district' => 'integer',
        'verified_by' => 'integer',
    ];

    protected $appends = [
        'url',
        'view_url',
        'taille_formatee',
        'icone',
        'categorie_label',
        'is_image',
        'is_pdf',
    ];

    // ============ RELATIONS ============

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ============ ACCESSORS ============

    public function getUrlAttribute(): string
    {
        if (!$this->exists || !$this->getKey()) {
            return '#';
        }
        return route('pieces-jointes.download', ['id' => $this->getKey()]);
    }

    public function getViewUrlAttribute(): string
    {
        if (!$this->exists || !$this->getKey()) {
            return '#';
        }
        return route('pieces-jointes.view', ['id' => $this->getKey()]);
    }

    public function getTailleFormateeAttribute(): string
    {
        $bytes = (int)$this->taille;
        
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        
        return $bytes . ' octets';
    }

    public function getIconeAttribute(): string
    {
        $ext = strtolower($this->extension ?? '');
        
        return match($ext) {
            'pdf' => 'file-text',
            'doc', 'docx' => 'file-text',
            'xls', 'xlsx' => 'file-spreadsheet',
            'jpg', 'jpeg', 'png', 'gif', 'webp' => 'image',
            'zip', 'rar', '7z' => 'archive',
            default => 'file',
        };
    }

    public function getCategorieLabelAttribute(): string
    {
        return match($this->categorie) {
            self::CATEGORIE_GLOBAL => 'Document général',
            self::CATEGORIE_DEMANDEUR => 'Document demandeur',
            self::CATEGORIE_PROPRIETE => 'Document propriété',
            self::CATEGORIE_ADMINISTRATIF => 'Document administratif',
            default => ucfirst($this->categorie ?? 'Non défini'),
        };
    }

    public function getIsImageAttribute(): bool
    {
        $ext = strtolower($this->extension ?? '');
        return in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);
    }

    public function getIsPdfAttribute(): bool
    {
        return strtolower($this->extension ?? '') === 'pdf';
    }

    // ============ MÉTHODES STATIQUES ============

    public static function getCategories(): array
    {
        return [
            self::CATEGORIE_GLOBAL => 'Document général',
            self::CATEGORIE_DEMANDEUR => 'Document demandeur',
            self::CATEGORIE_PROPRIETE => 'Document propriété',
            self::CATEGORIE_ADMINISTRATIF => 'Document administratif',
        ];
    }

    public static function getTypesDocuments(): array
    {
        return [
            self::TYPE_CIN => 'CIN',
            self::TYPE_ACTE_NAISSANCE => 'Acte de naissance',
            self::TYPE_ACTE_MARIAGE => 'Acte de mariage',
            self::TYPE_CERTIFICAT_RESIDENCE => 'Certificat de résidence',
            self::TYPE_PLAN_TERRAIN => 'Plan du terrain',
            self::TYPE_TITRE_FONCIER => 'Titre foncier',
            self::TYPE_PV_BORNAGE => 'PV de bornage',
            self::TYPE_AUTRE => 'Autre',
        ];
    }

    // ============ MÉTHODES ============

    public function fileExists(): bool
    {
        return Storage::disk('public')->exists($this->chemin ?? '');
    }

    public function getFullPath(): string
    {
        if (!$this->chemin) {
            return '';
        }
        return Storage::disk('public')->path($this->chemin);
    }

    public function getPublicUrl(): string
    {
        if (!$this->chemin) {
            return '';
        }
        return asset('storage/' . $this->chemin);
    }

    public function verify(?int $userId = null): bool
    {
        return $this->update([
            'is_verified' => true,
            'verified_by' => $userId ?? auth()->id(),
            'verified_at' => now(),
        ]);
    }

    public function unverify(): bool
    {
        return $this->update([
            'is_verified' => false,
            'verified_by' => null,
            'verified_at' => null,
        ]);
    }

    public function deleteFile(): bool
    {
        try {
            if ($this->fileExists()) {
                Storage::disk('public')->delete($this->chemin);
            }
            
            return (bool)$this->delete();
        } catch (\Exception $e) {
            Log::error('Erreur suppression fichier', [
                'piece_id' => $this->getKey(),
                'chemin' => $this->chemin,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    // ============ SCOPES ============

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeNotVerified($query)
    {
        return $query->where('is_verified', false);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type_document', $type);
    }

    public function scopeByCategorie($query, string $categorie)
    {
        return $query->where('categorie', $categorie);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('id_user', $userId);
    }

    public function scopeByDistrict($query, int $districtId)
    {
        return $query->where('id_district', $districtId);
    }

    public function scopeForAttachable($query, string $type, int $id)
    {
        return $query->where('attachable_type', $type)
                     ->where('attachable_id', $id);
    }

    // ============ BOOT ============

    protected static function boot()
    {
        parent::boot();

        static::forceDeleting(function (PieceJointe $piece) {
            try {
                if ($piece->fileExists()) {
                    Storage::disk('public')->delete($piece->chemin);
                }
            } catch (\Exception $e) {
                Log::error('Erreur suppression fichier lors du forceDelete', [
                    'piece_id' => $piece->getKey(),
                    'error' => $e->getMessage()
                ]);
            }
        });
    }
}