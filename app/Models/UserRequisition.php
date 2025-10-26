<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRequisition extends Model
{
    protected $fillable = [
        'id_user',
        'id_propriete',
    ];
}
