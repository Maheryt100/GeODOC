<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Demandeur extends Model
{
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
        'id_district',
    ];

    public function district()
    {
        return $this->belongsTo(District::class);
    }
}
