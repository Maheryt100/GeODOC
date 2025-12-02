<?php

namespace App\Http\Controllers\Dashboard\Services\Traits;

use App\Models\Dossier;
use Illuminate\Support\Facades\Auth;

trait QueryFilterTrait
{
    /**
     * Query de base avec filtre district
     */
    protected function baseQuery()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $query = Dossier::query();
        
        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }
        
        return $query;
    }
}