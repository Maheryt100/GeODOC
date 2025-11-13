<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;


/**
 * Middleware pour forcer le filtrage par district
 */
class EnsureDistrictScope
{
    public function handle(Request $request, Closure $next): Response
    {
        
        /** @var User $user */
        $user = Auth::user();

        
        if (!$user) {
            return redirect()->route('login');
        }

        // Si ce n'est pas un super admin, ajouter le filtre district automatiquement
        if (!$user->isSuperAdmin() && $user->hasDistrictAccess()) {
            // Injecter le district_id dans la requête
            $request->merge(['_district_filter' => $user->id_district]);
        }

        return $next($request); 
    }
}