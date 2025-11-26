<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Demander;
use App\Models\Propriete;
use App\Observers\DemanderObserver;
use App\Observers\ProprieteObserver;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ✅ Enregistrer les observers
        Demander::observe(DemanderObserver::class);
        Propriete::observe(ProprieteObserver::class);
    }
}