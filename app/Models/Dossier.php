<?php

namespace App\Models;

use App\Collection\DossierCollection;
use Illuminate\Database\Eloquent\Attributes\CollectedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Traits\HasPiecesJointes;

#[CollectedBy(DossierCollection::class)]
class Dossier extends Model
{
    use HasPiecesJointes;
    protected $fillable = [
        'nom_dossier',
        'date_descente_debut',
        'date_descente_fin',
        'type_commune',
        'commune',
        'fokontany',
        'circonscription',
        'id_district',
        'id_user',
    ];

    protected $appends = ['demandeurs_count', 'proprietes_count'];

    public function getDemandeursCountAttribute()
    {
        return $this->demandeurs()->count();
    }

    public function getProprietesCountAttribute()
    {
        return $this->proprietes()->count();
    }
    public function demandeurs()
    {
        return $this->belongsToMany(Demandeur::class, 'contenir', 'id_dossier', 'id_demandeur');
    }
    public function proprietes()
    {
        return $this->hasMany(Propriete::class, 'id_dossier', 'id');
    }
    public function demandes(): HasManyThrough
    {
        return $this->hasManyThrough(
            Demander::class,
            Propriete::class,
            'id_dossier',
            'id_propriete',
            'id',
            'id'
        )->where('demander.status', 'active');
    }

}
