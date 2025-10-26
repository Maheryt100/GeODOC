<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDistrict extends Model
{
    protected $fillable = [
        'id_user',
        'id_district',
        'edilitaire',
        'agricole',
    ];
}
