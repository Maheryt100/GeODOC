<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Demander;
use App\Services\PrixCalculatorService;
use Illuminate\Support\Facades\Log;

class RecalculerPrixCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'prix:recalculer {--all : Recalculer tous les prix, même non nuls}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalcule les prix pour toutes les demandes (par défaut seulement les prix à 0)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Démarrage du recalcul des prix...');
        
        $query = Demander::with(['propriete.dossier']);
        
        if (!$this->option('all')) {
            $query->where('total_prix', 0);
            $this->info('📊 Mode: Recalcul uniquement des prix à 0 AR');
        } else {
            $this->info('📊 Mode: Recalcul de TOUS les prix');
        }
        
        $demandes = $query->get();
        
        if ($demandes->isEmpty()) {
            $this->info('✅ Aucune demande à recalculer.');
            return 0;
        }

        $this->info("📦 {$demandes->count()} demande(s) à traiter");
        
        $bar = $this->output->createProgressBar($demandes->count());
        $bar->start();

        $success = 0;
        $errors = 0;
        $skipped = 0;

        foreach ($demandes as $demande) {
            try {
                $propriete = $demande->propriete;
                
                if (!$propriete) {
                    $this->newLine();
                    $this->warn("⚠️  Demande ID {$demande->id}: Propriété introuvable");
                    $errors++;
                    $bar->advance();
                    continue;
                }

                $ancienPrix = $demande->total_prix;
                
                try {
                    $nouveauPrix = PrixCalculatorService::calculerPrixTotal($propriete);
                    
                    $demande->update(['total_prix' => $nouveauPrix]);
                    
                    if ($ancienPrix != $nouveauPrix) {
                        Log::info('Prix recalculé', [
                            'demande_id' => $demande->id,
                            'propriete_lot' => $propriete->lot,
                            'ancien_prix' => $ancienPrix,
                            'nouveau_prix' => $nouveauPrix
                        ]);
                        $success++;
                    } else {
                        $skipped++;
                    }
                    
                } catch (\Exception $e) {
                    $this->newLine();
                    $this->error("❌ Demande ID {$demande->id}: {$e->getMessage()}");
                    $errors++;
                }

            } catch (\Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur demande ID {$demande->id}: {$e->getMessage()}");
                $errors++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Résumé
        $this->info('✅ Recalcul terminé !');
        $this->table(
            ['Résultat', 'Nombre'],
            [
                ['✅ Prix recalculés', $success],
                ['⏭️  Inchangés', $skipped],
                ['❌ Erreurs', $errors],
                ['📊 Total traité', $demandes->count()],
            ]
        );

        if ($errors > 0) {
            $this->warn("⚠️  {$errors} erreur(s) rencontrée(s). Consultez les logs pour plus de détails.");
        }

        return $errors > 0 ? 1 : 0;
    }
}