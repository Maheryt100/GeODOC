<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    //

    protected $fillable = [
        'nom_province',
    ];

    public function regions() {
        return $this->hasMany(Region::class, 'id_province');
    }
}
