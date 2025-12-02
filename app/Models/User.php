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
    const ROLE_CENTRAL_USER = 'central_user'; // ✅ NOUVEAU RÔLE
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

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'id_user');
    }

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

    // ✅ NOUVEAU : Vérifier si c'est un utilisateur central
    public function isCentralUser(): bool
    {
        return $this->role === self::ROLE_CENTRAL_USER && $this->status;
    }

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

    // ✅ MODIFIÉ : Les central_user peuvent aussi accéder à tous les districts
    public function canAccessAllDistricts(): bool
    {
        return $this->isSuperAdmin() || $this->isCentralUser();
    }

    // ============ PERMISSIONS ============
    
    public function canAccessDistrict(?int $districtId): bool
    {
        if (!$districtId) {
            return false;
        }

        // Super admin et central user peuvent accéder à tous les districts
        if ($this->canAccessAllDistricts()) {
            return true;
        }
        
        return $this->id_district === $districtId;
    }

    public function canAccessDossier(Dossier $dossier): bool
    {
        // Super admin et central user peuvent accéder à tous les dossiers
        if ($this->canAccessAllDistricts()) {
            return true;
        }
        
        return $this->id_district === $dossier->id_district;
    }

    // ✅ MODIFIÉ : Central user peut créer dans tous les districts
    public function canCreate(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // Super admin, admin district et central user peuvent créer
        if ($this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser()) {
            return true;
        }
        
        // User district peut créer dans son district
        if ($this->isUserDistrict() && $this->id_district) {
            return true;
        }
        
        return false;
    }

    // ✅ MODIFIÉ : Central user peut modifier dans tous les districts
    public function canUpdate(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // Super admin, admin district et central user peuvent modifier
        if ($this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser()) {
            return true;
        }
        
        // User district peut modifier dans son district
        return $this->isUserDistrict() && $this->id_district !== null;
    }

    // ✅ Central user NE PEUT PAS supprimer (réservé aux admins)
    public function canDelete(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // Seuls super_admin et admin_district peuvent supprimer
        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    // ✅ MODIFIÉ : Central user peut archiver
    public function canArchive(): bool
    {
        if (!$this->status) {
            return false;
        }

        return in_array($this->role, [
            self::ROLE_SUPER_ADMIN,
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT,
            self::ROLE_CENTRAL_USER, // ✅ AJOUTÉ
        ]);
    }

    // ✅ MODIFIÉ : Central user peut exporter
    public function canExportData(): bool
    {
        if (!$this->status) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser();
    }

    // ✅ Central user NE PEUT PAS gérer les utilisateurs
    public function canManageUsers(): bool
    {
        if (!$this->status) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    // ✅ Central user NE PEUT PAS configurer les prix
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

    // ✅ NOUVEAU : Scope pour les utilisateurs centraux
    public function scopeCentralUsers(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_CENTRAL_USER);
    }

    public function scopeDistrictUsers(Builder $query): Builder
    {
        return $query->whereIn('role', [
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT
        ])->whereNotNull('id_district');
    }

    // ============ ACCESSEURS (ATTRIBUTES) ============
    
    public function getRoleNameAttribute(): string
    {
        return match($this->role) {
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            self::ROLE_USER_DISTRICT => 'Utilisateur District',
            self::ROLE_CENTRAL_USER => 'Utilisateur Central', // ✅ AJOUTÉ
            self::ROLE_USER => 'Utilisateur',
            default => 'Utilisateur',
        };
    }

    public function getLocationAttribute(): string
    {
        // Super admin et central user ont accès à tous les districts
        if ($this->isSuperAdmin() || $this->isCentralUser()) {
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

    public function getStatusBadgeAttribute(): string
    {
        return $this->status ? 'Actif' : 'Inactif';
    }

    public function getStatusColorAttribute(): string
    {
        return $this->status ? 'success' : 'danger';
    }

    // ============ PERMISSIONS PERSONNALISÉES ============
    
    public function hasPermission(string $permission): bool
    {
        // Super admin a toutes les permissions
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        return $this->permissions()
            ->where('permission', $permission)
            ->where('granted', true)
            ->exists();
    }

    public function grantPermission(string $permission): void
    {
        UserPermission::grant($this->id, $permission);
    }

    public function revokePermission(string $permission): void
    {
        UserPermission::revoke($this->id, $permission);
    }

    public function getPermissionsList(): array
    {
        if ($this->isSuperAdmin()) {
            return array_keys(UserPermission::availablePermissions());
        }

        return UserPermission::getUserPermissions($this->id);
    }

    // ============ LOGGING ============
    
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

    public function getRecentLogs(int $limit = 10)
    {
        return $this->accessLogs()
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getRecentActivityLogs(int $limit = 50)
    {
        return $this->activityLogs()
            ->with(['district:id,nom_district'])
            ->latest()
            ->limit($limit)
            ->get();
    }

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
    
    public function canLogin(): bool
    {
        if (!$this->status) {
            return false;
        }

        // Les users district doivent avoir un district assigné
        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

        // Central user et super admin n'ont pas besoin de district
        return true;
    }

    public function getStats(): array
    {
        return [
            'dossiers_created' => $this->dossiers()->count(),
            'proprietes_created' => $this->proprietes()->count(),
            'demandeurs_created' => $this->demandeurs()->count(),
            'last_access' => $this->accessLogs()->latest()->first()?->created_at,
            'total_actions' => $this->accessLogs()->count(),
        ];
    }

    public function deactivate(): bool
    {
        return $this->update(['status' => false]);
    }

    public function activate(): bool
    {
        return $this->update(['status' => true]);
    }

    public function toggleStatus(): bool
    {
        return $this->update(['status' => !$this->status]);
    }

    // ============ VALIDATION HELPERS ============
    
    // ✅ MODIFIÉ : Central user ne doit pas avoir de district
    public function hasValidRoleDistrictCombination(): bool
    {
        // Super admin et central user ne doivent pas avoir de district
        if (in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_CENTRAL_USER])) {
            return $this->id_district === null;
        }

        // Admin et user district doivent avoir un district
        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

        return true;
    }

    public static function getAvailableRoles(?User $forUser = null): array
    {
        $allRoles = [
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            self::ROLE_CENTRAL_USER => 'Utilisateur Central', // ✅ AJOUTÉ
            self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            self::ROLE_USER_DISTRICT => 'Utilisateur District',
           
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

    // ============ COMPATIBILITÉ AVEC LARAVEL POLICIES ============
    
    /**
     * ✅ NOUVEAU : Méthode compatible avec auth()->user()->can()
     * Cette méthode permet d'utiliser Gate::allows() et $user->can()
     */
    public function can($ability, $arguments = []): bool
    {
        // Si c'est un modèle Dossier, vérifier les permissions spécifiques
        if ($arguments instanceof \App\Models\Dossier) {
            return $this->canManageDossier($ability, $arguments);
        }

        // Sinon, utiliser la vérification de permission standard
        if (is_string($ability)) {
            return $this->hasPermission($ability);
        }

        // Par défaut, retourner false
        return false;
    }

    /**
     * ✅ NOUVEAU : Vérifier les permissions spécifiques aux dossiers
     */
    private function canManageDossier(string $ability, \App\Models\Dossier $dossier): bool
    {
        switch ($ability) {
            case 'update':
                return $this->canUpdateDossier($dossier);
            
            case 'delete':
                return $this->canDeleteDossier($dossier);
            
            case 'close':
                return $this->canCloseDossier($dossier);
            
            case 'archive':
                return $this->canArchiveDossier($dossier);
            
            case 'export':
                return $this->canExportDossier($dossier);
            
            default:
                return false;
        }
    }

    /**
     * ✅ NOUVEAU : Peut modifier un dossier spécifique
     */
    public function canUpdateDossier(\App\Models\Dossier $dossier): bool
    {
        // Dossier fermé = non modifiable
        if ($dossier->is_closed) {
            return false;
        }

        // Vérifier l'accès au dossier
        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        // Super admin, admin district, central user peuvent modifier
        if ($this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser()) {
            return true;
        }

        // User district peut modifier ses propres dossiers dans son district
        if ($this->isUserDistrict()) {
            return $this->id === $dossier->id_user;
        }

        return false;
    }

    /**
     * ✅ NOUVEAU : Peut supprimer un dossier spécifique
     */
    public function canDeleteDossier(\App\Models\Dossier $dossier): bool
    {
        // Dossier fermé = non supprimable
        if ($dossier->is_closed) {
            return false;
        }

        // Vérifier l'accès au dossier
        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        // Seuls super_admin et admin_district peuvent supprimer
        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    /**
     * ✅ NOUVEAU : Peut fermer un dossier spécifique
     */
    public function canCloseDossier(\App\Models\Dossier $dossier): bool
    {
        // Déjà fermé
        if ($dossier->is_closed) {
            return false;
        }

        // Vérifier l'accès au dossier
        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        // Super admin, central user et admin district peuvent fermer
        return $this->isSuperAdmin() 
            || $this->isCentralUser() 
            || $this->isAdminDistrict();
    }

    /**
     * ✅ NOUVEAU : Peut archiver des éléments d'un dossier spécifique
     */
    public function canArchiveDossier(\App\Models\Dossier $dossier): bool
    {
        // Même logique que canUpdateDossier
        return $this->canUpdateDossier($dossier);
    }

    /**
     * ✅ NOUVEAU : Peut exporter un dossier spécifique
     */
    public function canExportDossier(\App\Models\Dossier $dossier): bool
    {
        // Vérifier l'accès au dossier
        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        // Super admin, central user et admin district peuvent exporter
        return $this->isSuperAdmin() 
            || $this->isCentralUser() 
            || $this->isAdminDistrict();
    }

    /**
     * ✅ NOUVEAU : Obtenir le label du rôle (pour compatibilité)
     */
    public function getRoleLabel(): string
    {
        return $this->role_name;
    }
}