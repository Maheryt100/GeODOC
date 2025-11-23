<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UploadService;
use App\Models\PieceJointe;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MaintainPiecesJointes extends Command
{
    protected $signature = 'pieces-jointes:maintain 
                            {--clean : Nettoyer les fichiers orphelins}
                            {--check : Vérifier l\'intégrité}
                            {--stats : Afficher les statistiques}
                            {--all : Exécuter toutes les opérations}
                            {--fix : Corriger automatiquement les problèmes}';
    
    protected $description = 'Maintenance des pièces jointes (nettoyage, vérification, statistiques)';

    public function handle(): int
    {
        $this->info('🔧 Démarrage de la maintenance des pièces jointes...');
        $this->newLine();

        try {
            $runAll = $this->option('all');

            // Statistiques de base
            if ($this->option('stats') || $runAll || (!$this->hasAnyOption())) {
                $this->showStats();
            }

            // Nettoyage des orphelins
            if ($this->option('clean') || $runAll) {
                $this->cleanOrphans();
            }

            // Vérification d'intégrité
            if ($this->option('check') || $runAll) {
                $this->checkIntegrity();
            }

            $this->newLine();
            $this->info('✅ Maintenance terminée avec succès');

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur: ' . $e->getMessage());
            Log::error('Erreur maintenance pièces jointes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return self::FAILURE;
        }
    }

    private function hasAnyOption(): bool
    {
        return $this->option('clean') || 
               $this->option('check') || 
               $this->option('stats') || 
               $this->option('all');
    }

    private function showStats(): void
    {
        $this->info('📊 Statistiques des pièces jointes:');
        $this->newLine();
        
        $total = PieceJointe::count();
        $verified = PieceJointe::where('is_verified', true)->count();
        $notVerified = PieceJointe::where('is_verified', false)->count();
        $deleted = PieceJointe::onlyTrashed()->count();

        $this->table(
            ['Catégorie', 'Valeur'],
            [
                ['Total (actifs)', $total],
                ['Vérifiées', $verified],
                ['Non vérifiées', $notVerified],
                ['Supprimées (soft delete)', $deleted],
            ]
        );

        // Statistiques par catégorie
        $this->newLine();
        $this->info('📁 Par catégorie:');
        
        $categorieStats = PieceJointe::selectRaw('categorie, COUNT(*) as count')
            ->groupBy('categorie')
            ->get();
        
        foreach ($categorieStats as $stat) {
            $this->line("   • " . ucfirst($stat->categorie) . ": " . $stat->count);
        }

        // Statistiques de stockage
        $this->newLine();
        $stats = UploadService::getStorageStats();
        
        $this->info('💾 Stockage:');
        $this->line("   Taille totale: {$stats['total_size_formatted']}");
        
        if (isset($stats['by_categorie']) && count($stats['by_categorie']) > 0) {
            $this->newLine();
            $this->info('Par catégorie:');
            foreach ($stats['by_categorie'] as $categorie => $data) {
                $this->line("   • {$categorie}: {$data['count']} fichiers ({$data['size_formatted']})");
            }
        }

        // Top 10 des fichiers les plus lourds
        $this->newLine();
        $this->info('📈 Top 10 des fichiers les plus volumineux:');
        
        $heavyFiles = PieceJointe::orderBy('taille', 'desc')
            ->limit(10)
            ->get(['nom_original', 'taille', 'categorie', 'created_at']);
        
        if ($heavyFiles->count() > 0) {
            $this->table(
                ['Fichier', 'Taille', 'Catégorie', 'Date'],
                $heavyFiles->map(fn($f) => [
                    substr($f->nom_original, 0, 40) . (strlen($f->nom_original) > 40 ? '...' : ''),
                    UploadService::formatBytes($f->taille),
                    $f->categorie,
                    $f->created_at->format('Y-m-d'),
                ])->toArray()
            );
        }
    }

    private function cleanOrphans(): void
    {
        $this->newLine();
        $this->info('🧹 Nettoyage des fichiers orphelins...');
        
        $bar = $this->output->createProgressBar();
        $bar->start();
        
        $deleted = UploadService::cleanOrphanFiles();
        
        $bar->finish();
        $this->newLine();
        
        if ($deleted > 0) {
            $this->warn("⚠️  {$deleted} fichier(s) orphelin(s) supprimé(s)");
        } else {
            $this->info("✅ Aucun fichier orphelin trouvé");
        }
    }

    private function checkIntegrity(): void
    {
        $this->newLine();
        $this->info('🔍 Vérification de l\'intégrité des fichiers...');
        
        $result = UploadService::checkIntegrity();
        
        $this->line("✅ {$result['total_checked']} enregistrements vérifiés");
        
        if ($result['missing_count'] === 0) {
            $this->info('✅ Tous les fichiers référencés sont présents');
        } else {
            $this->warn("⚠️  {$result['missing_count']} fichier(s) manquant(s) détecté(s)!");
            $this->newLine();
            
            // Afficher les premiers fichiers manquants
            $displayCount = min(10, $result['missing_count']);
            $this->table(
                ['ID', 'Nom original', 'Chemin', 'Date création'],
                array_map(fn($m) => [
                    $m['id'],
                    substr($m['nom_original'], 0, 30) . (strlen($m['nom_original']) > 30 ? '...' : ''),
                    substr($m['chemin'], 0, 40) . (strlen($m['chemin']) > 40 ? '...' : ''),
                    $m['created_at']
                ], array_slice($result['missing_files'], 0, $displayCount))
            );
            
            if ($result['missing_count'] > $displayCount) {
                $this->line("... et " . ($result['missing_count'] - $displayCount) . " autre(s)");
            }
            
            // Proposer de corriger
            if ($this->option('fix') || $this->confirm('Supprimer les enregistrements orphelins de la base de données?', false)) {
                $deleted = 0;
                foreach ($result['missing_files'] as $missing) {
                    $piece = PieceJointe::find($missing['id']);
                    if ($piece) {
                        $piece->forceDelete();
                        $deleted++;
                    }
                }
                $this->info("✅ {$deleted} enregistrement(s) supprimé(s)");
            }
        }

        // Vérifier les chemins dupliqués
        $this->newLine();
        $this->info('🔍 Vérification des chemins dupliqués...');
        
        $duplicates = PieceJointe::select('chemin')
            ->whereNotNull('chemin')
            ->groupBy('chemin')
            ->havingRaw('COUNT(*) > 1')
            ->get();
        
        if ($duplicates->count() > 0) {
            $this->warn("⚠️  {$duplicates->count()} chemin(s) dupliqué(s) trouvé(s)");
            
            foreach ($duplicates->take(5) as $dup) {
                $count = PieceJointe::where('chemin', $dup->chemin)->count();
                $this->line("   • {$dup->chemin} ({$count} occurrences)");
            }
        } else {
            $this->info('✅ Aucun chemin dupliqué');
        }
    }
}