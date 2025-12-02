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

    // ✅ CORRIGÉ : Constantes pour les rôles (ROLE_USER supprimé)
    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_ADMIN_DISTRICT = 'admin_district';
    const ROLE_USER_DISTRICT = 'user_district';
    const ROLE_CENTRAL_USER = 'central_user';

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

        if ($this->canAccessAllDistricts()) {
            return true;
        }
        
        return $this->id_district === $districtId;
    }

    public function canAccessDossier(Dossier $dossier): bool
    {
        if ($this->canAccessAllDistricts()) {
            return true;
        }
        
        return $this->id_district === $dossier->id_district;
    }

    public function canCreate(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        if ($this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser()) {
            return true;
        }
        
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

        if ($this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser()) {
            return true;
        }
        
        return $this->isUserDistrict() && $this->id_district !== null;
    }

    public function canDelete(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    public function canArchive(): bool
    {
        if (!$this->status) {
            return false;
        }

        return in_array($this->role, [
            self::ROLE_SUPER_ADMIN,
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT,
            self::ROLE_CENTRAL_USER,
        ]);
    }

    public function canExportData(): bool
    {
        if (!$this->status) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser();
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
            self::ROLE_CENTRAL_USER => 'Utilisateur Central',
            default => 'Utilisateur',
        };
    }

    public function getLocationAttribute(): string
    {
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

        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

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
    
    public function hasValidRoleDistrictCombination(): bool
    {
        if (in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_CENTRAL_USER])) {
            return $this->id_district === null;
        }

        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

        return true;
    }

    public static function getAvailableRoles(?User $forUser = null): array
    {
        $allRoles = [
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            self::ROLE_CENTRAL_USER => 'Utilisateur Central',
            self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            self::ROLE_USER_DISTRICT => 'Utilisateur District',
        ];

        if (!$forUser) {
            return $allRoles;
        }

        if ($forUser->isSuperAdmin()) {
            return $allRoles;
        }

        if ($forUser->isAdminDistrict()) {
            return [
                self::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        }

        return [];
    }

    // ============ MÉTHODES POUR DOSSIERS ============
    
    public function canUpdateDossier(\App\Models\Dossier $dossier): bool
    {
        if ($dossier->is_closed) {
            return false;
        }

        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        if ($this->isSuperAdmin() || $this->isAdminDistrict() || $this->isCentralUser()) {
            return true;
        }

        if ($this->isUserDistrict()) {
            return $this->id === $dossier->id_user;
        }

        return false;
    }

    public function canDeleteDossier(\App\Models\Dossier $dossier): bool
    {
        if ($dossier->is_closed) {
            return false;
        }

        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    public function canCloseDossier(\App\Models\Dossier $dossier): bool
    {
        if ($dossier->is_closed) {
            return false;
        }

        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        return $this->isSuperAdmin() 
            || $this->isCentralUser() 
            || $this->isAdminDistrict();
    }

    public function canArchiveDossier(\App\Models\Dossier $dossier): bool
    {
        return $this->canUpdateDossier($dossier);
    }

    public function canExportDossier(\App\Models\Dossier $dossier): bool
    {
        if (!$this->canAccessDossier($dossier)) {
            return false;
        }

        return $this->isSuperAdmin() 
            || $this->isCentralUser() 
            || $this->isAdminDistrict();
    }

    public function getRoleLabel(): string
    {
        return $this->role_name;
    }
}