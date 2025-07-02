<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class District extends Model
{
    //

    protected $fillable = [
        'nom_district',
        'region_id',
        'edilitaire',
        'agricole',
    ];
}
