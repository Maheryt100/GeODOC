<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UploadService;
use App\Models\PieceJointe;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MaintainPiecesJointes extends Command
{
    protected $signature = 'pieces-jointes:maintain {--clean : Nettoyer les fichiers orphelins}';
    protected $description = 'Maintenance des pièces jointes (vérification d\'intégrité et nettoyage)';

    public function handle(): int
    {
        $this->info('🔧 Démarrage de la maintenance des pièces jointes...');

        try {
            // Statistiques
            $total = PieceJointe::count();
            $verified = PieceJointe::where('is_verified', true)->count();
            $notVerified = PieceJointe::where('is_verified', false)->count();
            $deleted = PieceJointe::onlyTrashed()->count();

            $this->info("📊 Statistiques:");
            $this->line("   Total: {$total}");
            $this->line("   ✅ Vérifiées: {$verified}");
            $this->line("   ❌ Non vérifiées: {$notVerified}");
            $this->line("   🗑️  Supprimées (soft): {$deleted}");

            // Nettoyer les orphelins si demandé
            if ($this->option('clean')) {
                $this->info('');
                $this->info('🧹 Nettoyage des fichiers orphelins...');
                
                $deletedOrphan = UploadService::cleanOrphanFiles();
                
                if ($deletedOrphan > 0) {
                    $this->info("✅ {$deletedOrphan} fichier(s) orphelin(s) supprimé(s)");
                } else {
                    $this->info("✅ Aucun fichier orphelin trouvé");
                }
            }

            // Vérifier l'intégrité
            $this->info('');
            $this->info('🔍 Vérification de l\'intégrité des fichiers...');
            
            $missing = [];
            $total_checked = 0;
            
            PieceJointe::whereNull('deleted_at')
                ->chunk(100, function($pieces) use (&$missing, &$total_checked) {
                    foreach ($pieces as $piece) {
                        $total_checked++;
                        
                        if (!Storage::disk('public')->exists($piece->chemin ?? '')) {
                            $missing[] = $piece;
                            
                            $this->warn("❌ Fichier manquant: {$piece->nom_original} " .
                                "(ID: {$piece->id}, Chemin: {$piece->chemin})");
                        }
                    }
                });

            $this->line("✅ {$total_checked} fichiers vérifiés");

            if (count($missing) === 0) {
                $this->info('✅ Tous les fichiers physiques sont présents');
            } else {
                $this->warn("⚠️  " . count($missing) . " fichier(s) manquant(s) en base");
                
                // Ligne 81
                if ($this->confirm('Supprimer les enregistrements orphelins en base de données?')) {
                    foreach ($missing as $piece) {
                        $piece->forceDelete();
                        $this->line("   🗑️  Supprimé: {$piece->nom_original}");
                    }
                    $this->info("✅ " . count($missing) . " enregistrement(s) supprimé(s)");
                }
            }

            // Vérifier l'espace disque
            $this->info('');
            $this->info('💾 Espace disque:');
            
            $totalSize = PieceJointe::whereNull('deleted_at')->sum('taille');
            $formattedSize = $this->formatBytes($totalSize);
            $this->line("   Taille totale: {$formattedSize}");

            // Informations supplémentaires
            $this->info('');
            $this->info('ℹ️  Informations:');
            
            $oldestPiece = PieceJointe::whereNull('deleted_at')
                ->orderBy('created_at', 'asc')
                ->first();
            
            if ($oldestPiece) {
                $days = now()->diffInDays($oldestPiece->created_at);
                $this->line("   Fichier le plus ancien: {$oldestPiece->nom_original} ({$days} jours)");
            }

            $newestPiece = PieceJointe::whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->first();
                
            if ($newestPiece) {
                $this->line("   Fichier le plus récent: {$newestPiece->nom_original}");
            }

            $this->info('');
            $this->info('✅ Maintenance terminée avec succès');
            
            Log::info('Maintenance pièces jointes complétée', [
                'total' => $total,
                'verified' => $verified,
                'total_size' => $totalSize,
                'missing_files' => count($missing),
                'cleaned_orphans' => $this->option('clean'),
            ]);

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de la maintenance: ' . $e->getMessage());
            
            Log::error('Erreur maintenance pièces jointes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }

    /**
     * Formater les bytes en format lisible
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}