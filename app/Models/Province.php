<?php

// ========================================
// Province.php - CORRECT ✅
// ========================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $fillable = [
        'nom_province',
    ];

    /**
     * Une province a plusieurs régions
     */
    public function regions()
    {
        return $this->hasMany(Region::class, 'id_province');
    }
}