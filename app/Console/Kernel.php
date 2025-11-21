<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ✅ NOUVEAU : Maintenance des pièces jointes - Daily
        $schedule->command('pieces-jointes:maintain')
            ->daily()
            ->at('03:00')
            ->appendOutputTo(storage_path('logs/cron.log'));

        // ✅ NOUVEAU : Nettoyage des fichiers orphelins - Weekly (Dimanche 2h)
        $schedule->command('pieces-jointes:maintain --clean')
            ->weekly()
            ->sundays()
            ->at('02:00')
            ->appendOutputTo(storage_path('logs/cron.log'));

        // ✅ NOUVEAU : Nettoyage des logs d'activité anciens - Monthly
        $schedule->command('activity:clean --days=90')
            ->monthly()
            ->appendOutputTo(storage_path('logs/cron.log'));

        // Exemple d'autres CRON jobs (optionnel)
        // $schedule->command('inspire')->hourly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}