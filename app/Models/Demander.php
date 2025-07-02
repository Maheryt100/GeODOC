<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Demander extends Model
{
    //

    protected $fillable = [
        'id_demandeur',
        'id_propriete',
        'total_prix',
    ];
}
