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
        Log::info('Début du recalcul des prix pour toutes les demandes');
        
        $demandes = Demander::with('propriete.dossier.district')
            ->whereIn('status', ['active', 'pending'])
            ->get();
        
        $success = 0;
        $errors = 0;
        $skipped = 0;
        
        foreach ($demandes as $demande) {
            try {
                // Vérifier la propriété
                if (!$demande->propriete) {
                    Log::warning("Demande {$demande->id}: propriété introuvable");
                    $errors++;
                    continue;
                }

                // Vérifier le dossier
                if (!$demande->propriete->dossier) {
                    Log::warning("Demande {$demande->id}: dossier introuvable");
                    $errors++;
                    continue;
                }
                
                $propriete = $demande->propriete;
                $ancienPrix = $demande->total_prix;
                
                // Calculer le nouveau prix
                $nouveauPrix = $this->calculerPrix($propriete);
                
                if ($nouveauPrix === null) {
                    Log::warning("Demande {$demande->id}: impossible de calculer le prix", [
                        'vocation' => $propriete->vocation,
                        'district_id' => $propriete->dossier->id_district
                    ]);
                    $skipped++;
                    continue;
                }
                
                // Mettre à jour si différent
                if ($ancienPrix != $nouveauPrix) {
                    $demande->update(['total_prix' => $nouveauPrix]);
                    
                    Log::info("Prix recalculé", [
                        'demande_id' => $demande->id,
                        'lot' => $propriete->lot,
                        'vocation' => $propriete->vocation,
                        'contenance' => $propriete->contenance,
                        'ancien_prix' => $ancienPrix,
                        'nouveau_prix' => $nouveauPrix
                    ]);
                    
                    $success++;
                } else {
                    $skipped++;
                }
                
            } catch (\Exception $e) {
                Log::error("Erreur recalcul demande {$demande->id}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $errors++;
            }
        }
        
        Log::info("Recalcul terminé", [
            'total_demandes' => $demandes->count(),
            'succès' => $success,
            'ignorées' => $skipped,
            'erreurs' => $errors
        ]);
    }

    /**
     * Calculer le prix d'une propriété
     */
    private function calculerPrix($propriete): ?float
    {
        if (!$propriete->vocation || !$propriete->contenance) {
            return null;
        }

        // Normaliser la vocation pour correspondre aux colonnes de la table districts
        $vocationColumn = $this->normalizeVocation($propriete->vocation);

        // Récupérer le prix du district
        $district = DB::table('districts')
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$vocationColumn as prix_unitaire")
            ->where('dossiers.id', $propriete->id_dossier)
            ->first();

        if (!$district || !isset($district->prix_unitaire) || $district->prix_unitaire <= 0) {
            return null;
        }

        return $district->prix_unitaire * $propriete->contenance;
    }

    /**
     * Normaliser la vocation pour correspondre aux colonnes
     */
    private function normalizeVocation(string $vocation): string
    {
        $mapping = [
            'Edilitaire' => 'edilitaire',
            'edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Forestiere' => 'forestiere',
            'forestière' => 'forestiere',
            'forestiere' => 'forestiere',
            'Touristique' => 'touristique',
            'touristique' => 'touristique',
        ];

        return $mapping[$vocation] ?? strtolower($vocation);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Pas de rollback pour un recalcul de données
        Log::info('Rollback du recalcul des prix: aucune action');
    }
};