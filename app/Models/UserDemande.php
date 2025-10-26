<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDemande extends Model
{
    protected $fillable = [
        'id_user',
        'id_demande',
    ];
}
