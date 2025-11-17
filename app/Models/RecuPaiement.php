<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RecuPaiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'id_propriete',
        'id_demandeur',
        'id_user',
        'numero_recu',
        'montant',
        'date_recu',
        'file_path',
        'status',
    ];

    protected $casts = [
        'date_recu' => 'datetime', // ✅ CORRIGÉ : datetime au lieu de date
        'montant' => 'integer',    // ✅ CORRIGÉ : integer au lieu de decimal:2
    ];

    /**
     * Relation avec Propriete
     */
    public function propriete()
    {
        return $this->belongsTo(Propriete::class, 'id_propriete');
    }

    /**
     * Relation avec Demandeur
     */
    public function demandeur()
    {
        return $this->belongsTo(Demandeur::class, 'id_demandeur');
    }

    /**
     * Relation avec User (créateur du reçu)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    /**
     * Scope pour récupérer uniquement les reçus confirmés
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Vérifier si le fichier existe dans le storage
     */
    public function fileExists(): bool
    {
        return $this->file_path && Storage::disk('public')->exists($this->file_path);
    }
}