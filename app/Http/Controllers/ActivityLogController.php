<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class ActivityLogController extends Controller
{
    /**
     * Liste des logs d'activité
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $filters = $request->only(['user_id', 'action', 'document_type', 'date_from', 'date_to', 'search']);

        // Requête de base avec optimisation
        $query = ActivityLog::with(['user:id,name,email', 'district:id,nom_district'])
            ->orderBy('created_at', 'desc');

        // Filtrer par district si nécessaire
        if (!$user->isSuperAdmin()) {
            $query->where('id_district', $user->id_district);
        }

        // Appliquer les filtres avec validation
        if (!empty($filters['user_id']) && is_numeric($filters['user_id'])) {
            $query->where('id_user', $filters['user_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (!empty($filters['date_from'])) {
            try {
                $query->whereDate('created_at', '>=', Carbon::parse($filters['date_from']));
            } catch (\Exception $e) {
                // Ignorer les dates invalides
            }
        }

        if (!empty($filters['date_to'])) {
            try {
                $query->whereDate('created_at', '<=', Carbon::parse($filters['date_to']));
            } catch (\Exception $e) {
                // Ignorer les dates invalides
            }
        }

        // Recherche optimisée avec index
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function($q) use ($search) {
                $q->whereHas('user', function($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereRaw("JSON_EXTRACT(metadata, '$.lot') LIKE ?", ["%{$search}%"])
                ->orWhereRaw("JSON_EXTRACT(metadata, '$.numero_recu') LIKE ?", ["%{$search}%"]);
            });
        }

        // Pagination avec queryString préservé
        $logs = $query->paginate(50)->withQueryString();

        // Statistiques optimisées
        $stats = ActivityLogger::getGlobalStats(
            $user->isSuperAdmin() ? null : $user->id_district
        );

        // Liste des utilisateurs pour le filtre avec optimisation
        $usersQuery = User::select('id', 'name', 'email')
            ->where('status', true)
            ->orderBy('name');
            
        if (!$user->isSuperAdmin()) {
            $usersQuery->where('id_district', $user->id_district);
        }
        
        $users = $usersQuery->get();

        return Inertia::render('admin/activity-logs/Index', [
            'logs' => $logs,
            'filters' => $filters,
            'stats' => $stats,
            'users' => $users,
            'actions' => $this->getAvailableActions(),
            'documentTypes' => $this->getDocumentTypes(),
        ]);
    }

    /**
     * Statistiques de téléchargement des documents
     */
    public function documentStats()
    {
        /** @var User $user */
        $user = Auth::user();
        
        $stats = ActivityLogger::getUserDocumentStats();

        // Filtrer par district si nécessaire
        if (!$user->isSuperAdmin()) {
            $stats = $stats->filter(function($stat) use ($user) {
                return $stat->user && $stat->user->id_district == $user->id_district;
            });
        }

        $userStats = $stats->groupBy('id_user')->map(function ($userLogs) {
            $firstLog = $userLogs->first();
            
            return [
                'user' => $firstLog->user,
                'documents' => $userLogs->map(fn($log) => [
                    'type' => $log->document_type,
                    'count' => $log->download_count,
                    'last_download' => $log->last_download,
                ])->values(),
                'total' => $userLogs->sum('download_count'),
            ];
        })->values();

        return Inertia::render('admin/activity-logs/DocumentStats', [
            'userStats' => $userStats,
        ]);
    }

    /**
     * Activité d'un utilisateur spécifique
     */
    public function userActivity($userId)
    {
        /** @var User $user */
        $user = Auth::user();
        $targetUser = User::findOrFail($userId);

        // Vérifier les permissions avec message d'erreur approprié
        if (!$user->isSuperAdmin() && $targetUser->id_district != $user->id_district) {
            abort(403, 'Accès refusé. Vous ne pouvez consulter que les utilisateurs de votre district.');
        }

        $logs = ActivityLogger::getUserActivity($userId, 100);

        // Ajouter les statistiques de l'utilisateur
        $userStats = [
            'total_actions' => $logs->count(),
            'documents_generated' => $logs->where('action', ActivityLog::ACTION_GENERATE)->count(),
            'documents_downloaded' => $logs->where('action', ActivityLog::ACTION_DOWNLOAD)->count(),
            'last_activity' => $logs->first()?->created_at,
        ];

        return Inertia::render('admin/activity-logs/UserActivity', [
            'targetUser' => $targetUser,
            'logs' => $logs,
            'stats' => $userStats,
        ]);
    }

    /**
     * Export des logs en CSV
     */
    public function export(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $filters = $request->only(['user_id', 'action', 'document_type', 'date_from', 'date_to']);

        $query = ActivityLog::with(['user:id,name,email', 'district:id,nom_district'])
            ->orderBy('created_at', 'desc');

        // Filtre par district
        if (!$user->isSuperAdmin()) {
            $query->where('id_district', $user->id_district);
        }

        // Appliquer les filtres
        if (!empty($filters['user_id']) && is_numeric($filters['user_id'])) {
            $query->where('id_user', $filters['user_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (!empty($filters['date_from'])) {
            try {
                $query->whereDate('created_at', '>=', Carbon::parse($filters['date_from']));
            } catch (\Exception $e) {
                // Ignorer
            }
        }

        if (!empty($filters['date_to'])) {
            try {
                $query->whereDate('created_at', '<=', Carbon::parse($filters['date_to']));
            } catch (\Exception $e) {
                // Ignorer
            }
        }

        // Limiter le nombre de résultats pour éviter les timeouts
        $logs = $query->limit(10000)->get();

        // Logger l'export
        ActivityLogger::logExport('activity_log', [
            'filters' => $filters,
            'count' => $logs->count(),
            'exported_by' => $user->name,
        ]);

        // Génération du CSV avec BOM UTF-8 pour Excel
        $csv = "\xEF\xBB\xBF"; // BOM UTF-8
        $csv .= "Date/Heure,Utilisateur,Email,District,Action,Type Document,Entité,Détails,IP\n";
        
        foreach ($logs as $log) {
            $csv .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                $log->created_at->format('Y-m-d H:i:s'),
                $this->escapeCsv($log->user->name ?? 'Inconnu'),
                $this->escapeCsv($log->user->email ?? ''),
                $this->escapeCsv($log->district->nom_district ?? 'N/A'),
                $this->escapeCsv($log->action_label),
                $this->escapeCsv($log->document_type ?? 'N/A'),
                $this->escapeCsv($log->entity_label),
                $this->escapeCsv($this->formatMetadata($log->metadata)),
                $this->escapeCsv($log->ip_address ?? '')
            );
        }

        $fileName = 'activity_logs_' . now()->format('Y-m-d_His') . '.csv';

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', "attachment; filename=\"{$fileName}\"")
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Échapper les valeurs CSV pour éviter les injections
     */
    private function escapeCsv(?string $value): string
    {
        if ($value === null) {
            return '';
        }
        
        // Échapper les guillemets doubles
        $value = str_replace('"', '""', $value);
        
        // Échapper les formules Excel (commence par =, +, -, @)
        if (preg_match('/^[=+\-@]/', $value)) {
            $value = "'" . $value;
        }
        
        return $value;
    }

    /**
     * Formater les métadonnées pour l'export
     */
    private function formatMetadata(?array $metadata): string
    {
        if (empty($metadata)) {
            return '';
        }

        $parts = [];
        $excludeKeys = ['document_type', 'id_district'];
        
        foreach ($metadata as $key => $value) {
            if (!in_array($key, $excludeKeys) && !is_array($value)) {
                $label = ucfirst(str_replace('_', ' ', $key));
                $parts[] = "{$label}: {$value}";
            }
        }

        return implode(' | ', $parts);
    }

    /**
     * Liste des actions disponibles
     */
    private function getAvailableActions(): array
    {
        return [
            ActivityLog::ACTION_LOGIN => 'Connexion',
            ActivityLog::ACTION_LOGOUT => 'Déconnexion',
            ActivityLog::ACTION_GENERATE => 'Génération',
            ActivityLog::ACTION_DOWNLOAD => 'Téléchargement',
            ActivityLog::ACTION_CREATE => 'Création',
            ActivityLog::ACTION_UPDATE => 'Modification',
            ActivityLog::ACTION_DELETE => 'Suppression',
            ActivityLog::ACTION_ARCHIVE => 'Archivage',
            ActivityLog::ACTION_UNARCHIVE => 'Désarchivage',
            ActivityLog::ACTION_EXPORT => 'Export',
        ];
    }

    /**
     * Liste des types de documents
     */
    private function getDocumentTypes(): array
    {
        return [
            ActivityLog::DOC_RECU => 'Reçu',
            ActivityLog::DOC_ACTE_VENTE => 'Acte de Vente',
            ActivityLog::DOC_CSF => 'CSF',
            ActivityLog::DOC_REQUISITION => 'Réquisition',
        ];
    }
}