<?php

namespace App\Models;
use App\Traits\HasPiecesJointes;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Propriete extends Model
{
    use HasPiecesJointes;
    
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

    protected $appends = ['is_archived'];

    public function dossier()
    {
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }

    public function demandes(): HasMany
    {
        // Charger TOUTES les demandes (actives ET archivées)
        return $this->hasMany(Demander::class, 'id_propriete');
    }

    public function demandeurs()
    {
        return $this->belongsToMany(Demandeur::class, 'demander', 'id_propriete', 'id_demandeur')
            ->wherePivot('status', 'active');
    }

    /**
     * Accesseur pour vérifier si la propriété est archivée
     */
    protected function isArchived(): Attribute
    {
        return Attribute::make(
            get: function () {
                $demandesActives = $this->demandes()->where('status', 'active')->count();
                $demandesArchivees = $this->demandes()->where('status', 'archive')->count();
                
                return $demandesArchivees > 0 && $demandesActives === 0;
            }
        );
    }
}