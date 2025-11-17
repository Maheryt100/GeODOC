<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ActivityLogger
{
    /**
     * Log une connexion
     */
    public static function logLogin(User $user): ActivityLog
    {
        return ActivityLog::create([
            'id_user' => $user->id,
            'action' => ActivityLog::ACTION_LOGIN,
            'entity_type' => ActivityLog::ENTITY_AUTH,
            'id_district' => $user->id_district,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log une déconnexion
     */
    public static function logLogout(User $user): ActivityLog
    {
        return ActivityLog::create([
            'id_user' => $user->id,
            'action' => ActivityLog::ACTION_LOGOUT,
            'entity_type' => ActivityLog::ENTITY_AUTH,
            'id_district' => $user->id_district,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log la génération d'un document
     */
    public static function logDocumentGeneration(
        string $documentType,
        int $entityId,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_GENERATE,
            ActivityLog::ENTITY_DOCUMENT,
            $entityId,
            array_merge(['document_type' => $documentType], $metadata)
        );
    }

    /**
     * Log le téléchargement d'un document
     */
    public static function logDocumentDownload(
        string $documentType,
        int $entityId,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_DOWNLOAD,
            ActivityLog::ENTITY_DOCUMENT,
            $entityId,
            array_merge(['document_type' => $documentType], $metadata)
        );
    }

    /**
     * Log la création d'une entité
     */
    public static function logCreation(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_CREATE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log la modification d'une entité
     */
    public static function logUpdate(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_UPDATE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log la suppression d'une entité
     */
    public static function logDeletion(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_DELETE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log l'archivage
     */
    public static function logArchive(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_ARCHIVE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log le désarchivage
     */
    public static function logUnarchive(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_UNARCHIVE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log un export
     */
    public static function logExport(
        string $entityType,
        array $metadata = []
    ): ActivityLog {
        return ActivityLog::logActivity(
            ActivityLog::ACTION_EXPORT,
            $entityType,
            null,
            $metadata
        );
    }

    /**
     * Obtenir les statistiques de téléchargement par utilisateur avec cache
     */
    public static function getUserDocumentStats(?int $userId = null)
    {
        $cacheKey = $userId 
            ? "user_doc_stats_{$userId}" 
            : 'all_user_doc_stats';
        
        return Cache::remember($cacheKey, 300, function () use ($userId) {
            $query = ActivityLog::documents()
                ->where('action', ActivityLog::ACTION_DOWNLOAD);

            if ($userId) {
                $query->where('id_user', $userId);
            }

            return $query->selectRaw('
                    id_user,
                    document_type,
                    COUNT(*) as download_count,
                    MAX(created_at) as last_download
                ')
                ->groupBy('id_user', 'document_type')
                ->with('user:id,name,email,id_district')
                ->get();
        });
    }

    /**
     * Obtenir l'activité récente avec cache
     */
    public static function getRecentActivity(int $limit = 50, ?int $districtId = null)
    {
        $cacheKey = $districtId 
            ? "recent_activity_district_{$districtId}_{$limit}" 
            : "recent_activity_all_{$limit}";
        
        return Cache::remember($cacheKey, 60, function () use ($limit, $districtId) {
            $query = ActivityLog::with(['user:id,name,email', 'district:id,nom_district'])
                ->orderBy('created_at', 'desc')
                ->limit($limit);

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            return $query->get();
        });
    }

    /**
     * Obtenir les statistiques globales avec cache optimisé
     */
    public static function getGlobalStats(?int $districtId = null): array
    {
        $cacheKey = $districtId 
            ? "global_stats_district_{$districtId}" 
            : 'global_stats_all';
        
        return Cache::remember($cacheKey, 300, function () use ($districtId) {
            $query = ActivityLog::query();

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            // Requête compatible PostgreSQL
            $stats = DB::select("
                SELECT 
                    COUNT(*) as total_actions,
                    SUM(CASE WHEN entity_type = ? THEN 1 ELSE 0 END) as total_documents,
                    SUM(CASE WHEN created_at::date = CURRENT_DATE THEN 1 ELSE 0 END) as today_actions,
                    SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as week_actions,
                    SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) 
                        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) THEN 1 ELSE 0 END) as month_actions
                FROM activity_logs
                " . ($districtId ? "WHERE id_district = ?" : ""),
                $districtId 
                    ? [ActivityLog::ENTITY_DOCUMENT, $districtId] 
                    : [ActivityLog::ENTITY_DOCUMENT]
            );

            $baseStats = (array) $stats[0];

            // Statistiques par action
            $byAction = (clone $query)->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action')
                ->toArray();

            // Statistiques par entité
            $byEntity = (clone $query)->selectRaw('entity_type, COUNT(*) as count')
                ->groupBy('entity_type')
                ->pluck('count', 'entity_type')
                ->toArray();

            return array_merge($baseStats, [
                'by_action' => $byAction,
                'by_entity' => $byEntity,
            ]);
        });
    }

    /**
     * Obtenir l'activité d'un utilisateur spécifique
     */
    public static function getUserActivity(int $userId, int $limit = 100)
    {
        return Cache::remember("user_activity_{$userId}_{$limit}", 60, function () use ($userId, $limit) {
            return ActivityLog::with(['district:id,nom_district'])
                ->where('id_user', $userId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();
        });
    }

    /**
     * Nettoyer les anciens logs (au-delà de X jours)
     */
    public static function cleanOldLogs(int $days = 90): int
    {
        $deleted = ActivityLog::where('created_at', '<', now()->subDays($days))
            ->delete();
        
        // Invalider les caches après nettoyage
        self::clearCache();
        
        return $deleted;
    }

    /**
     * Invalider les caches de statistiques
     */
    public static function clearCache(?int $districtId = null): void
    {
        if ($districtId) {
            Cache::forget("global_stats_district_{$districtId}");
            Cache::forget("recent_activity_district_{$districtId}_50");
        } else {
            // Invalider tous les caches de stats
            Cache::forget('global_stats_all');
            Cache::forget('all_user_doc_stats');
            Cache::forget('recent_activity_all_50');
        }
    }

    /**
     * Obtenir les statistiques d'activité par jour (pour graphiques)
     */
    public static function getDailyActivityStats(int $days = 30, ?int $districtId = null): array
    {
        $cacheKey = $districtId 
            ? "daily_stats_district_{$districtId}_{$days}" 
            : "daily_stats_all_{$days}";
        
        return Cache::remember($cacheKey, 3600, function () use ($days, $districtId) {
            $query = ActivityLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays($days))
                ->groupBy('date')
                ->orderBy('date');

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            return $query->get()->mapWithKeys(function ($item) {
                return [$item->date => $item->count];
            })->toArray();
        });
    }

    /**
     * Obtenir les utilisateurs les plus actifs
     */
    public static function getTopUsers(int $limit = 10, ?int $districtId = null): array
    {
        $cacheKey = $districtId 
            ? "top_users_district_{$districtId}_{$limit}" 
            : "top_users_all_{$limit}";
        
        return Cache::remember($cacheKey, 600, function () use ($limit, $districtId) {
            $query = ActivityLog::with('user:id,name,email')
                ->selectRaw('id_user, COUNT(*) as actions_count')
                ->groupBy('id_user')
                ->orderByDesc('actions_count')
                ->limit($limit);

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            return $query->get()->map(function ($item) {
                return [
                    'user' => $item->user,
                    'actions_count' => $item->actions_count,
                ];
            })->toArray();
        });
    }
}