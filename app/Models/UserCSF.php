<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserCSF extends Model
{
    protected $table = 'user_csf';
    protected $fillable = [
        'id_user',
        'id_demande',
    ];
}
