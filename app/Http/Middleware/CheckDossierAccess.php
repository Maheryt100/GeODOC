<?php

// app/Http/Middleware/CheckDossierAccess.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Dossier;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour vérifier l'accès à un dossier spécifique
 */
class CheckDossierAccess
{
    /**
     * Vérifier l'accès à un dossier via son ID dans les paramètres de route
     */
    public function handle(Request $request, Closure $next, string $paramName = 'id'): Response
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Non authentifié');
        }

        // Super admin a accès à tout
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Récupérer l'ID du dossier depuis les paramètres de route
        $dossierId = $request->route($paramName);

        if (!$dossierId) {
            abort(400, 'ID du dossier manquant');
        }

        // Récupérer le dossier
        $dossier = Dossier::find($dossierId);

        if (!$dossier) {
            abort(404, 'Dossier introuvable');
        }

        // Vérifier l'accès au district du dossier
        if (!$user->canAccessDossier($dossier)) {
            abort(403, 'Vous n\'avez pas accès à ce dossier');
        }

        // Ajouter le dossier à la requête pour éviter de le recharger
        $request->merge(['_dossier' => $dossier]);

        return $next($request);
    }
}