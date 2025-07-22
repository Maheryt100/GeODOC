<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    //
    protected $fillable = [
        'nom_region',
        'id_province',
    ];

    public function province() {
        return $this->belongsTo(Province::class);
    }
    public function districts() {
        return $this->hasMany(District::class, 'id_district');
    }

}
