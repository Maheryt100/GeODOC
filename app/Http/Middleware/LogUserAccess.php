<?php

// app/Http/Middleware/LogUserAccess.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour logger les accès utilisateurs
 */
class LogUserAccess
{
    /**
     * Actions à logger
     */
    private const LOGGABLE_ROUTES = [
        'dossiers.store' => 'create',
        'dossiers.update' => 'update',
        'dossiers.destroy' => 'delete',
        'proprietes.store' => 'create',
        'proprietes.update' => 'update',
        'proprietes.destroy' => 'delete',
        'demandeurs.store' => 'create',
        'demandeurs.update' => 'update',
        'demandeurs.destroy' => 'delete',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Logger seulement après succès
        if ($response->isSuccessful()) {
            $this->logAccess($request);
        }

        return $response;
    }

    private function logAccess(Request $request): void
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return;
        }

        $routeName = $request->route()?->getName();

        if (!$routeName || !isset(self::LOGGABLE_ROUTES[$routeName])) {
            return;
        }

        $action = self::LOGGABLE_ROUTES[$routeName];
        $resourceType = explode('.', $routeName)[0] ?? 'unknown';
        $resourceId = $request->route('id') ?? $request->input('id');

        $user->logAccess($action, $resourceType, $resourceId);
    }
}