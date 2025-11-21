<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UploadService;

class CleanOrphanFiles extends Command
{
    protected $signature = 'files:clean-orphans';
    protected $description = 'Nettoyer les fichiers orphelins';

    public function handle()
    {
        $this->info('Nettoyage des fichiers orphelins...');
        
        $deleted = UploadService::cleanOrphanFiles();
        
        $this->info("{$deleted} fichier(s) supprimé(s)");
        
        return 0;
    }
}