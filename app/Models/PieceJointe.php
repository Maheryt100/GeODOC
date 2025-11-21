<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;


/**
 * @property int $id
 * @property string $nom_original
 * ...
 */

class PieceJointe extends Model
{
    use SoftDeletes;

    protected $table = 'pieces_jointes';

    protected $fillable = [
        'attachable_type',
        'attachable_id',
        'nom_original',
        'nom_fichier',
        'chemin',
        'type_mime',
        'taille',
        'extension',
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
    ];

    protected $appends = [
        'url',
        'taille_formatee',
        'icone',
    ];

    // ============ RELATIONS ============

    /**
     * Relation polymorphique vers l'entité parente
     */
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

    /**
     * URL de téléchargement
     */
    public function getUrlAttribute(): string
    {
        if (!$this->exists || !$this->getKey()) {
            return '#';
        }
        return route('pieces-jointes.download', ['id' => $this->getKey()]);
    }

    /**
     * Taille formatée lisible
     */
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

    /**
     * Icône selon le type de fichier
     */
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

    // ============ MÉTHODES ============

    /**
     * Vérifier si le fichier existe physiquement
     */
    public function fileExists(): bool
    {
        return Storage::disk('public')->exists($this->chemin ?? '');
    }

    /**
     * Obtenir le chemin complet du fichier
     */
    public function getFullPath(): string
    {
        if (!$this->chemin) {
            return '';
        }
        return Storage::disk('public')->path($this->chemin);
    }

    /**
     * Obtenir l'URL publique du fichier
     */
    public function getPublicUrl(): string
    {
        if (!$this->chemin) {
            return '';
        }
        return asset('storage/' . $this->chemin);
    }

    /**
     * Vérifier le document
     */
    public function verify(?int $userId = null): bool
    {
        return $this->update([
            'is_verified' => true,
            'verified_by' => $userId ?? auth()->id(),
            'verified_at' => now(),
        ]);
    }

    /**
     * Révoquer la vérification
     */
    public function unverify(): bool
    {
        return $this->update([
            'is_verified' => false,
            'verified_by' => null,
            'verified_at' => null,
        ]);
    }

    /**
     * Vérifier si c'est une image
     */
    public function isImage(): bool
    {
        $ext = strtolower($this->extension ?? '');
        return in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);
    }

    /**
     * Vérifier si c'est un PDF
     */
    public function isPdf(): bool
    {
        return strtolower($this->extension ?? '') === 'pdf';
    }

    /**
     * Supprimer le fichier physique et l'enregistrement
     */
    public function deleteFile(): bool
    {
        try {
            if ($this->fileExists()) {
                Storage::disk('public')->delete($this->chemin);
            }
            
            return (bool)$this->delete();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur suppression fichier', [
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

    public function scopeByUser($query, int $userId)
    {
        return $query->where('id_user', $userId);
    }

    public function scopeByDistrict($query, int $districtId)
    {
        return $query->where('id_district', $districtId);
    }

    // ============ BOOT ============

    protected static function boot()
    {
        parent::boot();

        // Supprimer le fichier physique lors de la suppression définitive
        static::forceDeleting(function (PieceJointe $piece) {
            try {
                if ($piece->fileExists()) {
                    Storage::disk('public')->delete($piece->chemin);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Erreur suppression fichier lors du forceDelete', [
                    'piece_id' => $piece->getKey(),
                    'error' => $e->getMessage()
                ]);
            }
        });
    }
}