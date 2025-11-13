<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    // Optionnel : customiser la redirection si non authentifié
    protected function redirectTo($request)
    {
        // Pour API, renvoie null, pour web, login
        if (! $request->expectsJson()) {
            return route('login');
        }
    }
}