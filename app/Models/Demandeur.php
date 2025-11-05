<?php

namespace App\Models;
use App\Traits\HasPiecesJointes;

use Illuminate\Database\Eloquent\Model;

class Demandeur extends Model
{
    use HasPiecesJointes;
    //
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

    public function dossiers()
    {
        return $this->belongsToMany(Dossier::class, 'contenir', 'id_demandeur', 'id_dossier');
    }

    public function proprietes()
    {
        return $this->belongsToMany(Propriete::class,'demander', 'id_demandeur', 'id_propriete');
    }
    public function consortLinks()
    {
        return $this->hasMany(Consort::class, 'id_consort');
    }
}
