<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Dossier;

/**
 * Trait pour les contrôleurs
 * Facilite la gestion des autorisations
 */
trait ManagesDistrictAccess
{
    /**
     * Autoriser l'accès basé sur l'action
     */
    protected function authorizeDistrictAccess(string $action, $resource = null): void
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Non authentifié');
        }

        if (!$user->status) {
            abort(403, 'Votre compte est désactivé');
        }

        // Super admin a accès à tout
        if ($user->isSuperAdmin()) {
            return;
        }

        // Vérifier la permission pour l'action
        $canProceed = match($action) {
            'view', 'index', 'show' => true, // Tous peuvent voir dans leur district
            'create', 'store' => $user->canCreate(),
            'update', 'edit' => $user->canUpdate(),
            'delete', 'destroy' => $user->canDelete(),
            'archive', 'unarchive' => $user->canArchive(),
            'export' => $user->canExportData(),
            'manage_users' => $user->canManageUsers(),
            'configure_prices' => $user->canConfigurePrices(),
            default => false,
        };

        if (!$canProceed) {
            abort(403, "Vous n'avez pas la permission d'effectuer cette action : {$action}");
        }

        // Si une ressource est fournie, vérifier l'accès au district
        if ($resource) {
            if (method_exists($resource, 'belongsToUserDistrict')) {
                if (!$resource->belongsToUserDistrict()) {
                    abort(403, 'Cette ressource n\'appartient pas à votre district');
                }
            }
        }
    }

    /**
     * Appliquer le filtre de district à une requête
     */
    protected function applyDistrictFilter(Builder $query): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user || $user->isSuperAdmin()) {
            return $query;
        }

        if ($user->hasDistrictAccess()) {
            $model = $query->getModel();
            $tableName = $model->getTable();
            
            if ($tableName === 'dossiers') {
                return $query->where('id_district', $user->id_district);
            }
            
            // Pour les autres tables, utiliser HasDistrictScope trait
        }
        
        return $query;
    }

    /**
     * Obtenir les statistiques du district
     */
    protected function getDistrictStats(): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $baseQuery = Dossier::query();
        
        if (!$user->isSuperAdmin()) {
            $baseQuery->where('id_district', $user->id_district);
        }

        $dossierIds = $baseQuery->pluck('id');

        return [
            'total_dossiers' => $baseQuery->count(),
            'total_proprietes' => \App\Models\Propriete::whereIn('id_dossier', $dossierIds)->count(),
            'total_demandeurs' => \App\Models\Demandeur::whereHas('dossiers', function($q) use ($user) {
                if (!$user->isSuperAdmin()) {
                    $q->where('id_district', $user->id_district);
                }
            })->distinct('demandeurs.id')->count(),
            'proprietes_archived' => \App\Models\Propriete::whereIn('id_dossier', $dossierIds)
                ->where('is_archived', true)
                ->count(),
        ];
    }

    /**
     * Vérifier l'accès à un dossier spécifique
     */
    protected function authorizeDossierAccess(int $dossierId): Dossier
    {
        /** @var User $user */
        $user = Auth::user();
        
        $dossier = Dossier::findOrFail($dossierId);

        if (!$user->canAccessDossier($dossier)) {
            abort(403, 'Vous n\'avez pas accès à ce dossier');
        }

        return $dossier;
    }

    /**
     * Logger une action
     */
    protected function logAction(string $action, string $resourceType, ?int $resourceId = null): void
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if ($user) {
            $user->logAccess($action, $resourceType, $resourceId);
        }
    }
}