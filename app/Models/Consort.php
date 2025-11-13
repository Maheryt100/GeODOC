<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consort extends Model
{
    //
    protected $fillable = [
        'id_demandeur',
        'id_consort',
        'status',
    ];
    public function principal()
    {
        return $this->belongsTo(Demandeur::class, 'id_principal');
    }

    public function consort()
    {
        return $this->belongsTo(Demandeur::class, 'id_consort');
    }

    public function demandes()
    {
        return $this->belongsToMany(Demander::class, 'demande_consort', 'id_consort', 'id_demande');
    }
}
