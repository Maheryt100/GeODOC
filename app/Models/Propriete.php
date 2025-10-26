<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Propriete extends Model
{
    //
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
        'numero_FN',
        'numero_requisition',
        'date_requisition',
        'date_inscription',
        'dep_vol',
        'status',
        'id_dossier',
        'id_user'
    ];
    public function dossier()
    {
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }
    public function demandes(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')->where('status', 'active');
    }

    public function demandeurs()
    {
        return $this->belongsToMany(Demandeur::class, 'demander', 'id_propriete', 'id_demandeur');
    }
}
