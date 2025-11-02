<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class District extends Model
{
    protected $fillable = [
        'nom_district',
        'region_id',
        'edilitaire',
        'agricole',
        'forestiere',      // ✅ AJOUTER
        'touristique',     // ✅ AJOUTER
    ];

    public function region() {
        return $this->belongsTo(Region::class);
    }
    
    public function demandeur(){
        return $this->hasMany(Demandeur::class,'id_district');
    }
    
    public function propriete()
    {
        return $this->hasMany(Propriete::class,'id_district');
    }
}