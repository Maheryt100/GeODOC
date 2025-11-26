<?php

namespace App\Observers;

use App\Models\Demander;
use App\Services\PrixCalculatorService;
use Illuminate\Support\Facades\Log;

/**
 * Observer pour calculer automatiquement le prix lors de la création/modification d'une demande
 */
class DemanderObserver
{
    /**
     * Événement déclenché AVANT la création d'une demande
     * Permet de calculer le prix avant l'insertion en DB
     */
    public function creating(Demander $demander): void
    {
        $this->calculerPrix($demander, 'creating');
    }

    /**
     * Événement déclenché AVANT la mise à jour d'une demande
     * Recalcule le prix si la propriété a changé
     */
    public function updating(Demander $demander): void
    {
        // Recalculer seulement si la propriété a changé
        if ($demander->isDirty('id_propriete')) {
            $this->calculerPrix($demander, 'updating');
        }
    }

    /**
     * Calcule et assigne le prix total
     */
    private function calculerPrix(Demander $demander, string $event): void
    {
        try {
            // Charger la propriété si elle n'est pas déjà chargée
            if (!$demander->relationLoaded('propriete')) {
                $demander->load('propriete.dossier');
            }

            $propriete = $demander->propriete;

            if (!$propriete) {
                Log::warning("Observer Demander [{$event}]: Propriété introuvable", [
                    'demander_id' => $demander->id,
                    'id_propriete' => $demander->id_propriete
                ]);
                return;
            }

            // Calculer le prix via le service
            $prixTotal = PrixCalculatorService::calculerPrixTotal($propriete);
            
            // Assigner le prix (sera sauvegardé automatiquement)
            $demander->total_prix = $prixTotal;

            Log::info("Observer Demander [{$event}]: Prix calculé", [
                'demander_id' => $demander->id ?? 'nouveau',
                'id_propriete' => $propriete->id,
                'lot' => $propriete->lot,
                'vocation' => $propriete->vocation,
                'contenance' => $propriete->contenance,
                'prix_calcule' => $prixTotal
            ]);

        } catch (\Exception $e) {
            Log::error("Observer Demander [{$event}]: Erreur calcul prix", [
                'demander_id' => $demander->id ?? 'nouveau',
                'id_propriete' => $demander->id_propriete,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Ne pas bloquer la création/modification même en cas d'erreur
            // Le prix restera à 0 et pourra être recalculé plus tard
        }
    }

    /**
     * Événement après sauvegarde - pour logging
     */
    public function saved(Demander $demander): void
    {
        if ($demander->total_prix > 0) {
            Log::info("Demande sauvegardée avec prix", [
                'demander_id' => $demander->id,
                'total_prix' => $demander->total_prix
            ]);
        }
    }
}