<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contenir extends Model
{
    //
    protected $table = 'contenir';

    protected $fillable = [
        'id_dossier',
        'id_demandeur',
    ];

    public function demandeur(){
        return $this->belongsTo(Demandeur::class, 'id_demandeur');
    }

    public function dossier(){
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }
}
