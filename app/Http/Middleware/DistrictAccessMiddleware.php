<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour vérifier l'accès basé sur le district et les permissions
 */
class DistrictAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        /** @var User|null $user */
        $user = Auth::user();

        // Vérifier l'authentification
        if (!$user) {
            return redirect()->route('login')
                ->with('error', 'Vous devez être connecté pour accéder à cette page.');
        }

        // ✅ CRITIQUE : Vérifier si le compte est actif
        if (!$user->status) {
            Auth::logout();
            return redirect()->route('login')
                ->with('error', 'Votre compte a été désactivé. Contactez un administrateur.');
        }

        // ✅ CORRIGÉ : Vérifier si l'utilisateur a un district 
        // (sauf super_admin ET central_user qui ont accès à tous les districts)
        if (!$user->canAccessAllDistricts() && !$user->id_district) {
            Auth::logout();
            return redirect()->route('login')
                ->with('error', 'Aucun district assigné à votre compte. Contactez un administrateur.');
        }

        // Super admin et central user ont accès à tout
        if ($user->canAccessAllDistricts()) {
            return $next($request);
        }

        // Si une permission spécifique est requise
        if ($permission) {
            if (!$this->checkPermission($user, $permission)) {
                abort(403, "Vous n'avez pas la permission requise : {$permission}");
            }
        }

        return $next($request);
    }

    /**
     * Vérifier une permission spécifique
     */
    private function checkPermission(User $user, string $permission): bool
    {
        return match($permission) {
            'create' => $user->canCreate(),
            'update' => $user->canUpdate(),
            'delete' => $user->canDelete(),
            'archive' => $user->canArchive(),
            'export' => $user->canExportData(),
            'manage_users' => $user->canManageUsers(),
            'configure_prices' => $user->canConfigurePrices(),
            default => false,
        };
    }
}