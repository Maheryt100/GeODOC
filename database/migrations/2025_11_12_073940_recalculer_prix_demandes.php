<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Demander;
use App\Services\PrixCalculatorService;

return new class extends Migration
{
    /**
     * Recalculer tous les prix des demandes actives
     */
    public function up(): void
    {
        Log::info('Début du recalcul des prix pour toutes les demandes actives');
        
        $demandes = Demander::with('propriete.dossier')
            ->where('status', 'active')
            ->get();
        
        $success = 0;
        $errors = 0;
        
        foreach ($demandes as $demande) {
            try {
                if (!$demande->propriete) {
                    Log::warning("Demande {$demande->id}: propriété introuvable");
                    $errors++;
                    continue;
                }
                
                $ancienPrix = $demande->total_prix;
                $nouveauPrix = PrixCalculatorService::calculerPrixTotal($demande->propriete);
                
                if ($ancienPrix != $nouveauPrix) {
                    $demande->update(['total_prix' => $nouveauPrix]);
                    
                    Log::info("Prix recalculé", [
                        'demande_id' => $demande->id,
                        'lot' => $demande->propriete->lot,
                        'ancien_prix' => $ancienPrix,
                        'nouveau_prix' => $nouveauPrix
                    ]);
                    
                    $success++;
                }
                
            } catch (\Exception $e) {
                Log::error("Erreur recalcul demande {$demande->id}: {$e->getMessage()}");
                $errors++;
            }
        }
        
        Log::info("Recalcul terminé: {$success} succès, {$errors} erreurs sur {$demandes->count()} demandes");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Pas de rollback pour ce recalcul
    }
};