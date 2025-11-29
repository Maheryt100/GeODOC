<?php

namespace App\Listeners;

use App\Events\AssociationCreated;
use App\Events\AssociationDissociated;
use Illuminate\Support\Facades\Log;

class LogAssociationActivity
{
    /**
     * Log la création d'une association
     */
    public function handleCreated(AssociationCreated $event): void
    {
        Log::channel('audit')->info('Association créée', [
            'demande_id' => $event->demande->id,
            'demandeur_id' => $event->demande->id_demandeur,
            'demandeur_nom' => $event->demande->demandeur->nom_complet ?? 'N/A',
            'propriete_id' => $event->demande->id_propriete,
            'propriete_lot' => $event->demande->propriete->lot ?? 'N/A',
            'user_id' => $event->user->id,
            'user_name' => $event->user->name,
            'prix_total' => $event->demande->total_prix,
            'ip' => request()->ip(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Log la dissociation
     */
    public function handleDissociated(AssociationDissociated $event): void
    {
        Log::channel('audit')->warning('Association dissociée', [
            'demandeur_id' => $event->demandeur->id,
            'demandeur_nom' => $event->demandeur->nom_complet,
            'propriete_id' => $event->propriete->id,
            'propriete_lot' => $event->propriete->lot,
            'user_id' => $event->user->id,
            'user_name' => $event->user->name,
            'reason' => $event->reason,
            'ip' => request()->ip(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Enregistrer les listeners
     */
    public function subscribe($events): void
    {
        $events->listen(
            AssociationCreated::class,
            [LogAssociationActivity::class, 'handleCreated']
        );

        $events->listen(
            AssociationDissociated::class,
            [LogAssociationActivity::class, 'handleDissociated']
        );
    }
}
