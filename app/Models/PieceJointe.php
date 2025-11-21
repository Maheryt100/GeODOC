<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class PieceJointe extends Model
{
    use SoftDeletes;

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
        return route('pieces-jointes.download', $this->id);
    }

    /**
     * Taille formatée lisible
     */
    public function getTailleFormateeAttribute(): string
    {
        $bytes = $this->taille;
        
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
        return match(strtolower($this->extension)) {
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
    public function exists(): bool
    {
        return Storage::disk('public')->exists($this->chemin);
    }

    /**
     * Obtenir le chemin complet du fichier
     */
    public function getFullPath(): string
    {
        return Storage::disk('public')->path($this->chemin);
    }

    /**
     * Obtenir l'URL publique du fichier
     */
    public function getPublicUrl(): string
    {
        return Storage::disk('public')->url($this->chemin);
    }

    /**
     * Vérifier le document
     */
    public function verify(?int $userId = null): bool
    {
        return $this->update([
            'is_verified' => true,
            'verified_by' => $userId,
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
        return in_array(strtolower($this->extension), ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);
    }

    /**
     * Vérifier si c'est un PDF
     */
    public function isPdf(): bool
    {
        return strtolower($this->extension) === 'pdf';
    }

    /**
     * Supprimer le fichier physique et l'enregistrement
     */
    public function deleteFile(): bool
    {
        if ($this->exists()) {
            Storage::disk('public')->delete($this->chemin);
        }
        
        return $this->delete();
    }

    // ============ BOOT ============

    protected static function boot()
    {
        parent::boot();

        // Supprimer le fichier physique lors de la suppression définitive
        static::forceDeleting(function (PieceJointe $piece) {
            if ($piece->exists()) {
                Storage::disk('public')->delete($piece->chemin);
            }
        });
    }
}