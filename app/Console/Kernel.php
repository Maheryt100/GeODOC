<?php
// Dans app/Console/Kernel.php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Les commandes Artisan fournies par votre application
     */
    protected $commands = [
        Commands\MaintainPiecesJointes::class,
        Commands\CleanOldActivityLogs::class,
    ];

    /**
     * Définir le planning de commandes
     */
    protected function schedule(Schedule $schedule): void
    {
        // Nettoyer les fichiers orphelins chaque semaine
        $schedule->command('pieces-jointes:maintain --clean')
            ->weekly()
            ->sundays()
            ->at('02:00');
        
        // Vérifier l'intégrité chaque mois
        $schedule->command('pieces-jointes:maintain --check')
            ->monthly()
            ->at('03:00');
        
        // Nettoyer les vieux logs tous les 3 mois
        $schedule->command('activity:clean --days=90')
            ->quarterly();
    }

    /**
     * Enregistrer les commandes
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}