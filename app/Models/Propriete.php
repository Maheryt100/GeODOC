<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'circonscription',
        'type',
        'nature',
        'id_district',
        'commune',
        'quartier',
        'date_descente',
        'numero_FN',
        'status',
    ];
}
