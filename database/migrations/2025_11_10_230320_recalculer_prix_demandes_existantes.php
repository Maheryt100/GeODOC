<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Demander;
use App\Models\Propriete;

return new class extends Migration
{
    /**
     * ✅ Recalculer tous les prix à 0 dans la table demander
     */
    public function up(): void
    {
        // Récupérer toutes les demandes avec prix = 0
        $demandesZero = Demander::where('total_prix', 0)
            ->with(['propriete.dossier'])
            ->get();

        Log::info('Début recalcul des prix', [
            'total_demandes_zero' => $demandesZero->count()
        ]);

        $success = 0;
        $errors = 0;

        foreach ($demandesZero as $demande) {
            try {
                $propriete = $demande->propriete;
                
                if (!$propriete) {
                    Log::warning('Propriété introuvable', ['demande_id' => $demande->id]);
                    $errors++;
                    continue;
                }

                // Normaliser la vocation
                $vocationColumn = $this->normalizeVocation($propriete->vocation);

                // Récupérer le prix du district
                $prixDistrict = DB::table('districts')
                    ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
                    ->select("districts.$vocationColumn as prix")
                    ->where('dossiers.id', $propriete->id_dossier)
                    ->first();

                if (!$prixDistrict || !isset($prixDistrict->prix) || $prixDistrict->prix <= 0) {
                    Log::warning('Prix non configuré', [
                        'demande_id' => $demande->id,
                        'propriete_id' => $propriete->id,
                        'vocation' => $propriete->vocation
                    ]);
                    $errors++;
                    continue;
                }

                $prixUnitaire = $prixDistrict->prix;
                $prixTotal = $prixUnitaire * $propriete->contenance;

                // Mettre à jour le prix
                $demande->update(['total_prix' => $prixTotal]);

                Log::info('Prix recalculé', [
                    'demande_id' => $demande->id,
                    'ancien_prix' => 0,
                    'nouveau_prix' => $prixTotal
                ]);

                $success++;

            } catch (\Exception $e) {
                Log::error('Erreur recalcul prix', [
                    'demande_id' => $demande->id,
                    'error' => $e->getMessage()
                ]);
                $errors++;
            }
        }

        Log::info('Fin recalcul des prix', [
            'success' => $success,
            'errors' => $errors,
            'total' => $demandesZero->count()
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rien à faire - on ne peut pas revenir en arrière
    }

    /**
     * Normaliser la vocation
     */
    private function normalizeVocation(string $vocation): string
    {
        $mapping = [
            'Edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Forestiere' => 'forestiere',
            'Touristique' => 'touristique',
        ];

        return $mapping[$vocation] ?? strtolower($vocation);
    }
};