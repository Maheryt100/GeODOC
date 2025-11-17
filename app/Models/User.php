<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Constantes pour les rôles
    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_ADMIN_DISTRICT = 'admin_district';
    const ROLE_USER_DISTRICT = 'user_district';
    const ROLE_USER = 'user';

    protected $fillable = [
        'name',
        'email',
        'role',
        'id_district',
        'status',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => 'boolean',
    ];

    // ============ RELATIONS ============
    
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(UserAccessLog::class, 'id_user');
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(UserPermission::class, 'id_user');
    }

    // ✅ AJOUT : Relation avec ActivityLog
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'id_user');
    }

    // Relations avec les entités créées
    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class, 'id_user');
    }

    public function proprietes(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_user');
    }

    public function demandeurs(): HasMany
    {
        return $this->hasMany(Demandeur::class, 'id_user');
    }

    // ============ VÉRIFICATIONS DE RÔLES ============
    
    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN && $this->status;
    }

    public function isAdminDistrict(): bool
    {
        return $this->role === self::ROLE_ADMIN_DISTRICT && $this->status;
    }

    public function isUserDistrict(): bool
    {
        return $this->role === self::ROLE_USER_DISTRICT && $this->status;
    }

    // ✅ AJOUT : Méthode isAdmin() pour faciliter les vérifications
    public function isAdmin(): bool
    {
        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    public function hasDistrictAccess(): bool
    {
        return $this->status && in_array($this->role, [
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT
        ]) && $this->id_district !== null;
    }

    public function canAccessAllDistricts(): bool
    {
        return $this->isSuperAdmin();
    }

    // ============ PERMISSIONS ============
    
    /**
     * Vérifier si l'utilisateur peut accéder à un district spécifique
     */
    public function canAccessDistrict(?int $districtId): bool
    {
        if (!$districtId) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }
        
        return $this->id_district === $districtId;
    }

    /**
     * Vérifier si l'utilisateur peut accéder à un dossier
     */
    public function canAccessDossier(Dossier $dossier): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        return $this->id_district === $dossier->id_district;
    }

    /**
     * Vérifier les permissions CRUD
     */
    public function canCreate(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        if ($this->isSuperAdmin() || $this->isAdminDistrict()) {
            return true;
        }
        
        // User district peut créer dans son district
        if ($this->isUserDistrict() && $this->id_district) {
            return true;
        }
        
        return false;
    }

    public function canUpdate(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        if ($this->isSuperAdmin() || $this->isAdminDistrict()) {
            return true;
        }
        
        // User district peut modifier dans son district
        return $this->isUserDistrict() && $this->id_district !== null;
    }

    public function canDelete(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // Seuls super_admin et admin_district peuvent supprimer
        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    public function canArchive(): bool
    {
        if (!$this->status) {
            return false;
        }

        // Tous sauf user simple peuvent archiver
        return in_array($this->role, [
            self::ROLE_SUPER_ADMIN,
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT,
        ]);
    }

    public function canExportData(): bool
    {
        if (!$this->status) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    public function canManageUsers(): bool
    {
        if (!$this->status) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    public function canConfigurePrices(): bool
    {
        if (!$this->status) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    // ============ SCOPES POUR FILTRAGE ============
    
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', false);
    }

    public function scopeForDistrict(Builder $query, int $districtId): Builder
    {
        return $query->where('id_district', $districtId);
    }

    public function scopeSuperAdmins(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_SUPER_ADMIN);
    }

    public function scopeAdminDistricts(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_ADMIN_DISTRICT);
    }

    public function scopeUserDistricts(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_USER_DISTRICT);
    }

    public function scopeDistrictUsers(Builder $query): Builder
    {
        return $query->whereIn('role', [
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT
        ])->whereNotNull('id_district');
    }

    // ============ ACCESSEURS (ATTRIBUTES) ============
    
    /**
     * Obtenir le nom du rôle formaté
     */
    public function getRoleNameAttribute(): string
    {
        return match($this->role) {
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            self::ROLE_USER_DISTRICT => 'Utilisateur District',
            self::ROLE_USER => 'Utilisateur',
            default => 'Utilisateur',
        };
    }

    /**
     * Obtenir la localisation de l'utilisateur
     */
    public function getLocationAttribute(): string
    {
        if ($this->isSuperAdmin()) {
            return 'Tous les districts';
        }
        
        if (!$this->district) {
            return 'Non assigné';
        }

        $districtName = $this->district->nom_district ?? 'District inconnu';
        $regionName = $this->district->region?->nom_region ?? 'Région inconnue';
        $provinceName = $this->district->region?->province?->nom_province ?? 'Province inconnue';
        
        return sprintf(
            '%s, %s, %s',
            $districtName,
            $regionName,
            $provinceName
        );
    }

    /**
     * Obtenir le badge de statut
     */
    public function getStatusBadgeAttribute(): string
    {
        return $this->status ? 'Actif' : 'Inactif';
    }

    /**
     * Obtenir la couleur du badge
     */
    public function getStatusColorAttribute(): string
    {
        return $this->status ? 'success' : 'danger';
    }

    // ============ PERMISSIONS PERSONNALISÉES ============
    
    /**
     * Vérifier si l'utilisateur a une permission spécifique
     */
    public function hasPermission(string $permission): bool
    {
        // Super admin a toutes les permissions
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        // Vérifier dans la table permissions
        return $this->permissions()
            ->where('permission', $permission)
            ->where('granted', true)
            ->exists();
    }

    /**
     * Accorder une permission
     */
    public function grantPermission(string $permission): void
    {
        UserPermission::grant($this->id, $permission);
    }

    /**
     * Révoquer une permission
     */
    public function revokePermission(string $permission): void
    {
        UserPermission::revoke($this->id, $permission);
    }

    /**
     * Obtenir toutes les permissions de l'utilisateur
     */
    public function getPermissionsList(): array
    {
        if ($this->isSuperAdmin()) {
            return array_keys(UserPermission::availablePermissions());
        }

        return UserPermission::getUserPermissions($this->id);
    }

    // ============ LOGGING (UserAccessLog - ancien système) ============
    
    /**
     * Log d'accès (ancien système - à conserver pour compatibilité)
     */
    public function logAccess(string $action, string $resourceType, ?int $resourceId = null): void
    {
        UserAccessLog::create([
            'id_user' => $this->id,
            'id_district' => $this->id_district,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Obtenir les logs récents de l'utilisateur (ancien système)
     */
    public function getRecentLogs(int $limit = 10)
    {
        return $this->accessLogs()
            ->latest()
            ->limit($limit)
            ->get();
    }

    // ✅ AJOUT : Méthodes pour ActivityLog (nouveau système)
    
    /**
     * Obtenir les logs d'activité récents
     */
    public function getRecentActivityLogs(int $limit = 50)
    {
        return $this->activityLogs()
            ->with(['district:id,nom_district'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Obtenir les statistiques d'activité
     */
    public function getActivityStats(): array
    {
        return [
            'total_actions' => $this->activityLogs()->count(),
            'documents_generated' => $this->activityLogs()
                ->where('entity_type', ActivityLog::ENTITY_DOCUMENT)
                ->where('action', ActivityLog::ACTION_GENERATE)
                ->count(),
            'documents_downloaded' => $this->activityLogs()
                ->where('entity_type', ActivityLog::ENTITY_DOCUMENT)
                ->where('action', ActivityLog::ACTION_DOWNLOAD)
                ->count(),
            'last_activity' => $this->activityLogs()->latest()->first()?->created_at,
        ];
    }

    // ============ MÉTHODES UTILITAIRES ============
    
    /**
     * Vérifier si le compte est valide pour connexion
     */
    public function canLogin(): bool
    {
        if (!$this->status) {
            return false;
        }

        // Vérifier que les users district ont bien un district assigné
        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

        return true;
    }

    /**
     * Obtenir les statistiques de l'utilisateur
     */
    public function getStats(): array
    {
        $stats = [
            'dossiers_created' => $this->dossiers()->count(),
            'proprietes_created' => $this->proprietes()->count(),
            'demandeurs_created' => $this->demandeurs()->count(),
            'last_access' => $this->accessLogs()->latest()->first()?->created_at,
            'total_actions' => $this->accessLogs()->count(),
        ];

        return $stats;
    }

    /**
     * Désactiver l'utilisateur
     */
    public function deactivate(): bool
    {
        return $this->update(['status' => false]);
    }

    /**
     * Activer l'utilisateur
     */
    public function activate(): bool
    {
        return $this->update(['status' => true]);
    }

    /**
     * Toggle du statut
     */
    public function toggleStatus(): bool
    {
        return $this->update(['status' => !$this->status]);
    }

    // ============ VALIDATION HELPERS ============
    
    /**
     * Vérifier la cohérence role/district
     */
    public function hasValidRoleDistrictCombination(): bool
    {
        // Super admin ne doit pas avoir de district
        if ($this->role === self::ROLE_SUPER_ADMIN) {
            return $this->id_district === null;
        }

        // Admin et user district doivent avoir un district
        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

        return true;
    }

    /**
     * Obtenir les rôles disponibles selon le rôle de l'utilisateur
     */
    public static function getAvailableRoles(?User $forUser = null): array
    {
        $allRoles = [
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            self::ROLE_USER_DISTRICT => 'Utilisateur District',
            self::ROLE_USER => 'Utilisateur',
        ];

        if (!$forUser) {
            return $allRoles;
        }

        // Super admin peut assigner tous les rôles
        if ($forUser->isSuperAdmin()) {
            return $allRoles;
        }

        // Admin district peut seulement créer des user_district
        if ($forUser->isAdminDistrict()) {
            return [
                self::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        }

        return [];
    }
}