<?php

namespace App\Console\Commands;

use App\Services\ActivityLogger;
use Illuminate\Console\Command;

class CleanOldActivityLogs extends Command
{
    protected $signature = 'activity:clean {--days=90 : Number of days to keep}';
    protected $description = 'Clean old activity logs';

    public function handle()
    {
        $days = $this->option('days');
        $deleted = ActivityLogger::cleanOldLogs($days);
        
        $this->info("Supprimé {$deleted} logs datant de plus de {$days} jours.");
    }
}