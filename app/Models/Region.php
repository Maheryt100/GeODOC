<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $fillable = [
        'nom_region',
        'id_province',
    ];

    /**
     * Une région appartient à une province
     */
    public function province()
    {
        return $this->belongsTo(Province::class, 'id_province');
    }

    /**
     * Une région a plusieurs districts
     * ✅ CORRECTION : Utiliser 'id_region' au lieu de 'id_district'
     */
    public function districts()
    {
        return $this->hasMany(District::class, 'id_region'); // ✅ CORRIGÉ
    }
}

