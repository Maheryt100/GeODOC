<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle pour les permissions personnalisées
 */
class UserPermission extends Model
{
    protected $fillable = [
        'id_user',
        'permission',
        'granted',
    ];

    protected $casts = [
        'granted' => 'boolean',
    ];

    // ============ RELATIONS ============
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    // ============ SCOPES ============
    
    /**
     * Permissions accordées
     */
    public function scopeGranted($query)
    {
        return $query->where('granted', true);
    }

    /**
     * Permissions révoquées
     */
    public function scopeRevoked($query)
    {
        return $query->where('granted', false);
    }

    /**
     * Par utilisateur
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('id_user', $userId);
    }

    // ============ PERMISSIONS DISPONIBLES ============
    
    public const PERMISSION_VIEW_STATISTICS = 'view_statistics';
    public const PERMISSION_EXPORT_DATA = 'export_data';
    public const PERMISSION_MANAGE_PRICES = 'manage_prices';
    public const PERMISSION_ARCHIVE_DOCUMENTS = 'archive_documents';
    public const PERMISSION_DELETE_DOCUMENTS = 'delete_documents';
    public const PERMISSION_MANAGE_CONSORTS = 'manage_consorts';
    
    /**
     * Liste de toutes les permissions disponibles
     */
    public static function availablePermissions(): array
    {
        return [
            self::PERMISSION_VIEW_STATISTICS => 'Voir les statistiques',
            self::PERMISSION_EXPORT_DATA => 'Exporter les données',
            self::PERMISSION_MANAGE_PRICES => 'Gérer les prix',
            self::PERMISSION_ARCHIVE_DOCUMENTS => 'Archiver les documents',
            self::PERMISSION_DELETE_DOCUMENTS => 'Supprimer les documents',
            self::PERMISSION_MANAGE_CONSORTS => 'Gérer les consorts',
        ];
    }

    // ============ MÉTHODES STATIQUES ============
    
    /**
     * Accorder une permission à un utilisateur
     */
    public static function grant(int $userId, string $permission): self
    {
        return static::updateOrCreate(
            ['id_user' => $userId, 'permission' => $permission],
            ['granted' => true]
        );
    }

    /**
     * Révoquer une permission
     */
    public static function revoke(int $userId, string $permission): self
    {
        return static::updateOrCreate(
            ['id_user' => $userId, 'permission' => $permission],
            ['granted' => false]
        );
    }

    /**
     * Vérifier si un utilisateur a une permission
     */
    public static function check(int $userId, string $permission): bool
    {
        return static::where('id_user', $userId)
            ->where('permission', $permission)
            ->where('granted', true)
            ->exists();
    }

    /**
     * Obtenir toutes les permissions d'un utilisateur
     */
    public static function getUserPermissions(int $userId): array
    {
        return static::where('id_user', $userId)
            ->where('granted', true)
            ->pluck('permission')
            ->toArray();
    }
}