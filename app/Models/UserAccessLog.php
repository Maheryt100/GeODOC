<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle pour tracer les accès utilisateurs
 */
class UserAccessLog extends Model
{
    protected $fillable = [
        'id_user',
        'id_district',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ============ RELATIONS ============
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    // ============ SCOPES ============
    
    /**
     * Logs récents
     */
    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }

    /**
     * Par action
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Par type de ressource
     */
    public function scopeByResourceType($query, string $resourceType)
    {
        return $query->where('resource_type', $resourceType);
    }

    /**
     * Par utilisateur
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('id_user', $userId);
    }

    /**
     * Par district
     */
    public function scopeByDistrict($query, int $districtId)
    {
        return $query->where('id_district', $districtId);
    }

    // ============ MÉTHODES STATIQUES ============
    
    /**
     * Obtenir les statistiques d'activité
     */
    public static function getActivityStats(int $days = 7): array
    {
        $from = now()->subDays($days);
        
        return [
            'total_actions' => static::where('created_at', '>=', $from)->count(),
            'unique_users' => static::where('created_at', '>=', $from)
                ->distinct('id_user')
                ->count(),
            'actions_by_type' => static::where('created_at', '>=', $from)
                ->groupBy('action')
                ->selectRaw('action, COUNT(*) as count')
                ->pluck('count', 'action')
                ->toArray(),
            'actions_by_resource' => static::where('created_at', '>=', $from)
                ->groupBy('resource_type')
                ->selectRaw('resource_type, COUNT(*) as count')
                ->pluck('count', 'resource_type')
                ->toArray(),
        ];
    }

    /**
     * Obtenir les utilisateurs les plus actifs
     */
    public static function getMostActiveUsers(int $limit = 10, int $days = 7)
    {
        return static::where('created_at', '>=', now()->subDays($days))
            ->with('user')
            ->groupBy('id_user')
            ->selectRaw('id_user, COUNT(*) as actions_count')
            ->orderByDesc('actions_count')
            ->limit($limit)
            ->get();
    }
}

// ==========================================================
