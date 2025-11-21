<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UploadService;
use App\Models\PieceJointe;

class MaintainPiecesJointes extends Command
{
    protected $signature = 'pieces-jointes:maintain {--clean : Nettoyer les fichiers orphelins}';
    protected $description = 'Maintenance des pièces jointes';

    public function handle()
    {
        $this->info('🔧 Maintenance des pièces jointes...');

        // Statistiques
        $total = PieceJointe::count();
        $this->info("📊 Total pièces jointes: {$total}");

        // Nettoyer les orphelins si demandé
        if ($this->option('clean')) {
            $this->info('🧹 Nettoyage des fichiers orphelins...');
            $deleted = UploadService::cleanOrphanFiles();
            $this->info("✅ {$deleted} fichier(s) orphelin(s) supprimé(s)");
        }

        // Vérifier l'intégrité
        $this->info('🔍 Vérification de l\'intégrité...');
        $missing = 0;
        
        PieceJointe::chunk(100, function($pieces) use (&$missing) {
            foreach ($pieces as $piece) {
                if (!$piece->exists()) {
                    $this->warn("❌ Fichier manquant: {$piece->nom_original} (ID: {$piece->id})");
                    $missing++;
                }
            }
        });

        if ($missing === 0) {
            $this->info('✅ Tous les fichiers sont présents');
        } else {
            $this->warn("⚠️  {$missing} fichier(s) manquant(s)");
        }

        $this->info('✅ Maintenance terminée');
        
        return 0;
    }
}