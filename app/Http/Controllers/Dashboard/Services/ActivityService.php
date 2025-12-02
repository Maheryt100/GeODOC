<?php

namespace App\Http\Controllers\Dashboard\Services;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityService
{
    /**
     * Récupérer l'activité récente
     */
    public function getRecentActivity(int $limit = 10): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $logs = ActivityLog::with('user:id,name')
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->entity_type,
                    'description' => $log->description,
                    'time' => $log->created_at->diffForHumans(),
                    'user' => $log->user->name ?? 'Système',
                ];
            });
        
        return $logs->toArray();
    }
}