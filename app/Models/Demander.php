<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Demander extends Model
{
    //
    protected $table = 'demander';
    protected $fillable = [
        'id_demandeur',
        'id_propriete',
        'total_prix',
        'status',
        'status_consort',
        'motif_archive',
        'id_user',
    ];

    public function demandeur(){
        return $this->belongsTo(Demandeur::class, 'id_demandeur');
    }
    public function propriete(){
        return $this->belongsTo(Propriete::class, 'id_propriete');
    }
    
}
