<?php
// this is bootstrap/app.php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\DistrictAccessMiddleware;
use App\Http\Middleware\CheckDossierAccess;
use App\Http\Middleware\LogUserAccess;
use App\Http\Middleware\CheckDossierClosed;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Middlewares globaux pour le groupe 'web'
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\HandleAppearance::class,
        ]);

        // Enregistrement des middlewares d'alias
        $middleware->alias([
            'district.access' => DistrictAccessMiddleware::class,
            'dossier.access' => CheckDossierAccess::class,
            'log.access' => LogUserAccess::class,
            'district.scope' => \App\Http\Middleware\EnsureDistrictScope::class,
            'check.dossier.closed' => CheckDossierClosed::class,
            'check.attachments' => \App\Http\Middleware\CheckAttachmentsAccess::class,
        ]);;
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();