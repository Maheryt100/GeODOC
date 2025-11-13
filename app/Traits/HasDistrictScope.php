<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

/**
 * Trait pour appliquer automatiquement le filtrage par district
 * À utiliser dans les modèles Dossier, Propriete, etc.
 */
trait HasDistrictScope
{
    /**
     * Boot du trait - applique le scope global
     */
    protected static function bootHasDistrictScope(): void
    {
        // Appliquer le scope automatiquement à toutes les requêtes
        static::addGlobalScope('district', function (Builder $builder) {
            /** @var User|null $user */
            $user = Auth::user();
            
            // Si pas d'utilisateur authentifié, ne rien faire
            if (!$user) {
                return;
            }

            // Si super admin, ne pas filtrer
            if ($user->isSuperAdmin()) {
                return;
            }

            // Si utilisateur district, filtrer par son district
            if ($user->hasDistrictAccess()) {
                $tableName = $builder->getModel()->getTable();
                
                // Pour Dossier : filtrer directement
                if ($tableName === 'dossiers') {
                    $builder->where('dossiers.id_district', $user->id_district);
                }
                
                // Pour Propriete : filtrer via dossier
                elseif ($tableName === 'proprietes') {
                    $builder->whereHas('dossier', function ($q) use ($user) {
                        $q->where('id_district', $user->id_district);
                    });
                }
                
                // Pour Demandeur : filtrer via dossiers
                elseif ($tableName === 'demandeurs') {
                    $builder->whereHas('dossiers', function ($q) use ($user) {
                        $q->where('id_district', $user->id_district);
                    });
                }
            }
        });
    }

    /**
     * Scope pour désactiver temporairement le filtrage district
     */
    public function scopeWithoutDistrictScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('district');
    }

    /**
     * Scope pour forcer le filtrage par un district spécifique
     */
    public function scopeForDistrict(Builder $query, int $districtId): Builder
    {
        return $query->withoutGlobalScope('district')
            ->where('id_district', $districtId);
    }

    /**
     * Scope pour obtenir les données de tous les districts (super admin only)
     */
    public function scopeAllDistricts(Builder $query): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user || !$user->isSuperAdmin()) {
            abort(403, 'Accès refusé : Super administrateur requis');
        }
        
        return $query->withoutGlobalScope('district');
    }

    /**
     * Vérifier si l'enregistrement appartient au district de l'utilisateur
     */
    public function belongsToUserDistrict(): bool
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        $tableName = $this->getTable();

        // Pour Dossier
        if ($tableName === 'dossiers') {
            return $this->id_district === $user->id_district;
        }

        // Pour Propriete
        if ($tableName === 'proprietes') {
            // Charger la relation si nécessaire
            if (!$this->relationLoaded('dossier')) {
                $this->load('dossier');
            }
            
            return $this->dossier && $this->dossier->id_district === $user->id_district;
        }

        // Pour Demandeur
        if ($tableName === 'demandeurs') {
            return $this->dossiers()
                ->where('id_district', $user->id_district)
                ->exists();
        }

        return false;
    }

    /**
     * Vérifier si l'utilisateur peut effectuer une action sur cet enregistrement
     */
    public function userCan(string $action): bool
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }

        // Super admin peut tout faire
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Vérifier si l'enregistrement appartient au district de l'utilisateur
        if (!$this->belongsToUserDistrict()) {
            return false;
        }

        // Vérifier la permission spécifique
        return match($action) {
            'view' => true, // Tous peuvent voir dans leur district
            'create' => $user->canCreate(),
            'update' => $user->canUpdate(),
            'delete' => $user->canDelete(),
            'archive' => $user->canArchive(),
            default => false,
        };
    }
}
