<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Dossier;
use App\Models\District;

/**
 * Trait pour les contrôleurs
 * Facilite la gestion des autorisations et du filtrage par district
 */
trait ManagesDistrictAccess
{
    /**
     * Autoriser l'accès basé sur l'action
     * 
     * @param string $action L'action à vérifier (create, update, delete, etc.)
     * @param mixed|null $resource La ressource à vérifier (optionnel)
     * @return void
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
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
            'view', 'index', 'show' => true,
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
     * 
     * @param Builder $query La requête Eloquent
     * @param string|null $relationPath Le chemin de la relation vers le district (ex: 'dossier' pour Propriete)
     * @return Builder
     */
    protected function applyDistrictFilter(Builder $query, ?string $relationPath = null): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();

        // Super admin et central user voient tout
        if (!$user || $user->canAccessAllDistricts()) {
            return $query;
        }

        // Utilisateur avec district : filtrer
        if ($user->hasDistrictAccess() && $user->id_district) {
            $model = $query->getModel();
            $tableName = $model->getTable();
            
            // Si on a spécifié un chemin de relation
            if ($relationPath) {
                return $query->whereHas($relationPath, function ($q) use ($user) {
                    $q->where('id_district', $user->id_district);
                });
            }
            
            // Sinon, filtrage direct selon le modèle
            if ($tableName === 'dossiers') {
                return $query->where('id_district', $user->id_district);
            }
            
            if ($tableName === 'proprietes') {
                return $query->whereHas('dossier', function ($q) use ($user) {
                    $q->where('id_district', $user->id_district);
                });
            }
            
            if ($tableName === 'demandeurs') {
                return $query->whereHas('dossiers', function ($q) use ($user) {
                    $q->where('id_district', $user->id_district);
                });
            }
        }
        
        return $query;
    }

    /**
     * Obtenir les districts disponibles pour l'utilisateur
     * 
     * @param User|null $user L'utilisateur (par défaut: utilisateur connecté)
     * @return array
     */
    protected function getAvailableDistricts(?User $user = null): array
    {
        if (!$user) {
            /** @var User|null $user */
            $user = Auth::user();
        }

        if (!$user) {
            return [];
        }

        // Super admin et central user : tous les districts
        if ($user->canAccessAllDistricts()) {
            return District::with('region.province')
                ->orderBy('nom_district')
                ->get()
                ->toArray();
        }

        // Utilisateur district : seulement son district
        if ($user->district) {
            return [$user->district->load('region.province')->toArray()];
        }

        return [];
    }

    /**
     * Obtenir le nom du district de l'utilisateur (avec gestion du NULL)
     * 
     * @param User|null $user L'utilisateur (par défaut: utilisateur connecté)
     * @return string
     */
    protected function getUserDistrictName(?User $user = null): string
    {
        if (!$user) {
            /** @var User|null $user */
            $user = Auth::user();
        }

        if (!$user) {
            return 'Non connecté';
        }

        // Utilisation de l'opérateur null-safe et de la coalescence nulle
        return $user->district?->nom_district ?? 'Tous les districts';
    }

    /**
     * Vérifier si l'utilisateur peut accéder à un district spécifique
     * 
     * @param int $districtId L'ID du district à vérifier
     * @param User|null $user L'utilisateur (par défaut: utilisateur connecté)
     * @return bool
     */
    protected function canAccessDistrict(int $districtId, ?User $user = null): bool
    {
        if (!$user) {
            /** @var User|null $user */
            $user = Auth::user();
        }

        if (!$user) {
            return false;
        }

        // Super admin et central user peuvent accéder à tous les districts
        if ($user->canAccessAllDistricts()) {
            return true;
        }

        // Vérifier que c'est le district de l'utilisateur
        return $user->id_district === $districtId;
    }

    /**
     * Obtenir les statistiques du district
     * 
     * @return array
     */
    protected function getDistrictStats(): array
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return [
                'total_dossiers' => 0,
                'total_proprietes' => 0,
                'total_demandeurs' => 0,
                'proprietes_archived' => 0,
            ];
        }
        
        $baseQuery = Dossier::query();
        
        // Filtrer seulement si nécessaire
        if (!$user->canAccessAllDistricts()) {
            $baseQuery->where('id_district', $user->id_district);
        }

        $dossierIds = $baseQuery->pluck('id');

        return [
            'total_dossiers' => $baseQuery->count(),
            'total_proprietes' => \App\Models\Propriete::whereIn('id_dossier', $dossierIds)->count(),
            'total_demandeurs' => \App\Models\Demandeur::whereHas('dossiers', function($q) use ($user) {
                if (!$user->canAccessAllDistricts()) {
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
     * 
     * @param int $dossierId L'ID du dossier
     * @return Dossier
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
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
     * Logger une action utilisateur
     * 
     * @param string $action Le type d'action (create, update, delete, etc.)
     * @param string $resourceType Le type de ressource (dossier, propriete, etc.)
     * @param int|null $resourceId L'ID de la ressource (optionnel)
     * @return void
     */
    protected function logAction(string $action, string $resourceType, ?int $resourceId = null): void
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if ($user) {
            $user->logAccess($action, $resourceType, $resourceId);
        }
    }

    /**
     * Créer une requête avec filtrage automatique par district
     * 
     * @param string $modelClass La classe du modèle (ex: Dossier::class)
     * @param string|null $relationPath Le chemin de la relation (optionnel)
     * @return Builder
     */
    protected function queryWithDistrictFilter(string $modelClass, ?string $relationPath = null): Builder
    {
        $query = $modelClass::query();
        return $this->applyDistrictFilter($query, $relationPath);
    }

    /**
     * Obtenir le contexte district pour les vues
     * Utile pour passer aux vues Inertia
     * 
     * @return array{userDistrictName: string, canAccessAllDistricts: bool, availableDistricts: array, userDistrict: array|null}
     */
    protected function getDistrictContext(): array
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return [
                'userDistrictName' => 'Non connecté',
                'canAccessAllDistricts' => false,
                'availableDistricts' => [],
                'userDistrict' => null,
            ];
        }

        return [
            'userDistrictName' => $this->getUserDistrictName($user),
            'canAccessAllDistricts' => $user->canAccessAllDistricts(),
            'availableDistricts' => $this->getAvailableDistricts($user),
            'userDistrict' => $user->district?->toArray(),
        ];
    }
}