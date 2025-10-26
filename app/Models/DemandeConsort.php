<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemandeConsort extends Model
{
    protected $fillable = [
        'id_consort',
        'id_demande',
    ];
    public function demander()
    {
        return $this->belongsTo(Demander::class, 'id_demande');
    }

    public function consort(){
        return $this->belongsTo(Consort::class, 'id_consort');
    }
}
