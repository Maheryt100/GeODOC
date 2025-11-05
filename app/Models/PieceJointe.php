<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PieceJointe extends Model
{
    protected $fillable = [
        'nom_fichier',
        'nom_original',
        'chemin',
        'type_mime',
        'taille',
        'type_document',
        'description',
        'attachable_type',
        'attachable_id',
        'id_user',
    ];

    protected $casts = [
        'taille' => 'integer',
    ];

    protected $appends = ['taille_formatee', 'icone'];

    /**
     * Relation polymorphique
     */
    public function attachable()
    {
        return $this->morphTo();
    }

    /**
     * Utilisateur qui a uploadé le fichier
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    /**
     * Formater la taille du fichier
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
        } else {
            return $bytes . ' B';
        }
    }

    /**
     * Obtenir l'icône selon le type MIME
     */
    public function getIconeAttribute(): string
    {
        $mimeType = $this->type_mime;
        
        if (str_contains($mimeType, 'pdf')) {
            return 'FileText';
        } elseif (str_contains($mimeType, 'word') || str_contains($mimeType, 'document')) {
            return 'FileText';
        } elseif (str_contains($mimeType, 'image')) {
            return 'Image';
        } elseif (str_contains($mimeType, 'spreadsheet') || str_contains($mimeType, 'excel')) {
            return 'FileSpreadsheet';
        } else {
            return 'File';
        }
    }

    /**
     * Supprimer le fichier physique lors de la suppression du modèle
     */
    protected static function booted()
    {
        static::deleting(function (PieceJointe $piece) {
            if (Storage::disk('public')->exists($piece->chemin)) {
                Storage::disk('public')->delete($piece->chemin);
            }
        });
    }
}