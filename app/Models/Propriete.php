<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Propriete extends Model
{
    //
    protected $fillable = [
        'lot',
        'propriete_mere',
        'titre',
        'proprietaire',
        'contenance',
        'charge',
        'situation',
        'circonscription',
        'type',
        'nature',
        'id_district'

    ];
}
