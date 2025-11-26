<?php

namespace App\Observers;

use App\Models\Propriete;
use App\Services\PrixCalculatorService;
use Illuminate\Support\Facades\Log;

/**
 * Observer pour recalculer les prix des demandes quand une propriété change
 */
class ProprieteObserver
{
    /**
     * Quand la vocation ou la contenance change, recalculer les prix de toutes les demandes liées
     */
    public function updating(Propriete $propriete): void
    {
        // Vérifier si les champs impactant le prix ont changé
        $champsCritiques = ['vocation', 'contenance'];
        $aChange = false;

        foreach ($champsCritiques as $champ) {
            if ($propriete->isDirty($champ)) {
                $aChange = true;
                Log::info("Propriété modifiée: champ '{$champ}' changé", [
                    'propriete_id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'ancien' => $propriete->getOriginal($champ),
                    'nouveau' => $propriete->$champ
                ]);
            }
        }

        if (!$aChange) {
            return; // Pas besoin de recalculer
        }

        // Recalculer le nouveau prix
        try {
            $nouveauPrix = PrixCalculatorService::calculerPrixTotal($propriete);

            // Mettre à jour toutes les demandes liées à cette propriété
            $demandesAffectees = $propriete->demanders()->update([
                'total_prix' => $nouveauPrix
            ]);

            Log::info("Prix recalculés suite à modification propriété", [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'nouveau_prix' => $nouveauPrix,
                'demandes_affectees' => $demandesAffectees
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur recalcul prix après modification propriété", [
                'propriete_id' => $propriete->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Quand une propriété est créée, loguer l'info
     */
    public function created(Propriete $propriete): void
    {
        try {
            $prix = PrixCalculatorService::calculerPrixTotal($propriete);
            
            Log::info("Propriété créée", [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'vocation' => $propriete->vocation,
                'contenance' => $propriete->contenance,
                'prix_calcule' => $prix
            ]);
        } catch (\Exception $e) {
            Log::warning("Propriété créée mais prix non calculable", [
                'propriete_id' => $propriete->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}