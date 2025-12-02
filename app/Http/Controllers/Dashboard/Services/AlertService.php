<?php

namespace App\Http\Controllers\Dashboard\Services;

use Illuminate\Support\Facades\Auth;

class AlertService
{
    use Traits\QueryFilterTrait;

    /**
     * Récupérer les alertes système
     */
    public function getSystemAlerts(): array
    {
        $alerts = [];
        $user = Auth::user();
        
        // Dossiers sans demandeurs
        $dossiersVides = $this->baseQuery()->doesntHave('demandeurs')->count();
        if ($dossiersVides > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Dossiers incomplets',
                'message' => "{$dossiersVides} dossier(s) sans demandeur",
                'action' => route('dossiers'),
            ];
        }
        
        // Dossiers en retard (> 90 jours)
        $dossiersEnRetard = $this->baseQuery()
            ->whereNull('date_fermeture')
            ->where('date_ouverture', '<', now()->subDays(90))
            ->count();
        
        if ($dossiersEnRetard > 0) {
            $alerts[] = [
                'type' => 'danger',
                'title' => 'Dossiers en retard',
                'message' => "{$dossiersEnRetard} dossier(s) ouverts depuis plus de 90 jours",
                'action' => route('dossiers'),
            ];
        }
        
        // Dossiers sans propriétés
        $dossiersSansProprietes = $this->baseQuery()->doesntHave('proprietes')->count();
        if ($dossiersSansProprietes > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => 'Dossiers sans propriétés',
                'message' => "{$dossiersSansProprietes} dossier(s) sans propriété associée",
                'action' => route('dossiers'),
            ];
        }
        
        return $alerts;
    }
}