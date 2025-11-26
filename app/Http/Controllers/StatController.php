<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\User;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\ActivityLog;
use App\Models\District;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class StatController extends Controller
{
    /**
     * 🟢 DASHBOARD - Page d'accueil avec KPIs
     */
    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        
        // KPIs principaux
        $kpis = [
            'dossiers_ouverts' => $this->baseQuery()->whereNull('date_fermeture')->count(),
            'dossiers_fermes' => $this->baseQuery()->whereNotNull('date_fermeture')->count(),
            'proprietes_disponibles' => $this->getProprietesDisponibles(),
            'proprietes_acquises' => $this->getProprietesAcquises(),
            'taux_completion' => $this->getTauxCompletion(),
            'demandeurs_actifs' => $this->getDemandeursActifs(),
            'revenus_potentiels' => $this->getRevenusPotentiels(),
            'nouveaux_dossiers' => $this->getNouveauxDossiersMois(),
        ];

        // Graphiques pour le dashboard
        $charts = [
            'dossiers_timeline' => $this->getDossiersTimeline(),
            'proprietes_status' => $this->getProprietesStatus(),
            'top_communes' => $this->getTopCommunes(5),
        ];

        // Alertes système
        $alerts = $this->getSystemAlerts();

        // Activité récente
        $recentActivity = $this->getRecentActivity(10);

        return Inertia::render('Dashboard/Index', [
            'kpis' => $kpis,
            'charts' => $charts,
            'alerts' => $alerts,
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * 🟢 STATISTIQUES - Page complète avec tous les graphiques
     */
    public function statistics(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        // Récupération des filtres
        $period = $request->get('period', 'month');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $districtId = $request->get('district_id');

        // Déterminer les dates selon la période
        $dates = $this->getPeriodDates($period, $dateFrom, $dateTo);

        // Statistiques par catégorie
        $stats = [
            'overview' => $this->getOverviewStats($dates),
            'dossiers' => $this->getDossiersStats($dates),
            'proprietes' => $this->getProprietesStats($dates),
            'demandeurs' => $this->getDemandeursStats($dates),
            'demographics' => $this->getDemographicsStats($dates),
            'financials' => $this->getFinancialsStats($dates),
            'geographic' => $this->getGeographicStats($dates),
            'performance' => $this->getPerformanceStats($dates),
        ];

        // Graphiques détaillés
        $charts = [
            'evolution_mensuelle' => $this->getEvolutionMensuelle($dates),
            'repartition_nature' => $this->getRepartitionNature($dates),
            'repartition_vocation' => $this->getRepartitionVocation($dates),
            'top_districts' => $this->getTopDistricts($dates),
            'age_pyramid' => $this->getAgePyramid($dates),
            'completion_rate' => $this->getCompletionRate($dates),
        ];

        // Liste des districts (pour le filtre)
        $districts = District::orderBy('nom_district')->get();

        return Inertia::render('Statistics/Index', [
            'stats' => $stats,
            'charts' => $charts,
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'district_id' => $districtId,
            ],
            'districts' => $districts,
        ]);
    }

    /**
     * 🟢 EXPORT PDF des statistiques
     */
    public function exportPDF(Request $request)
    {
        // TODO: Implémenter l'export PDF
        return response()->json(['message' => 'Export PDF à implémenter'], 501);
    }

    // ============================================================================
    // MÉTHODES PRIVÉES (Helper Methods)
    // ============================================================================

    private function getProprietesDisponibles(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('is_archived', false)
            ->count();
    }

    private function getProprietesAcquises(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('is_archived', true)
            ->count();
    }

    private function getTauxCompletion(): float
    {
        $user = Auth::user();
        $query = $this->baseQuery();
        
        $total = $query->count();
        $complets = (clone $query)->whereHas('demandeurs')->whereHas('proprietes')->count();
        
        return $total > 0 ? round(($complets / $total) * 100, 1) : 0;
    }

    private function getDemandeursActifs(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('proprietes')
            ->count();
    }

    private function getRevenusPotentiels(): int
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Demander::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('status', '!=', 'archive')
            ->sum('demander.total_prix');  // ← Changé ici
    }

    private function getNouveauxDossiersMois(): int
    {
        return $this->baseQuery()
            ->whereBetween('date_ouverture', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
    }

    private function getSystemAlerts(): array
    {
        $alerts = [];
        $user = Auth::user();
        
        // Dossiers sans demandeurs
        $dossiersVides = $this->baseQuery()->doesntHave('demandeurs')->count();
        if ($dossiersVides > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Dossiers incomplets',
                'message' => "{$dossiersVides} dossier(s) sans demandeur",
                'action' => route('dossiers'),
            ];
        }
        
        return $alerts;
    }

    private function getDossiersTimeline(): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $data = Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->selectRaw('DATE_TRUNC(\'month\', date_ouverture) as month, COUNT(*) as count')
            ->where('date_ouverture', '>=', now()->subYear())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($item) => [
                'month' => Carbon::parse($item->month)->format('M Y'),
                'count' => $item->count
            ]);
        
        return $data->toArray();
    }

    private function getProprietesStatus(): array
    {
        return [
            'disponibles' => $this->getProprietesDisponibles(),
            'acquises' => $this->getProprietesAcquises(),
        ];
    }

    private function getTopCommunes(int $limit = 5): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $data = Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->select('commune', 'fokontany', 'type_commune')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('commune', 'fokontany', 'type_commune')
            ->orderByDesc('count')
            ->limit($limit)
            ->get();
        
        return $data->toArray();
    }

    private function getRecentActivity(int $limit = 10): array
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

    private function getOverviewStats(array $dates): array
    {
        $query = $this->baseQuery();
        
        return [
            'total_dossiers' => (clone $query)->whereBetween('date_ouverture', [$dates['from'], $dates['to']])->count(),
            'dossiers_ouverts' => (clone $query)->whereNull('date_fermeture')->count(),
            'dossiers_fermes' => (clone $query)->whereNotNull('date_fermeture')->count(),
            'taux_croissance' => 12.5,
        ];
    }

    private function getDossiersStats(array $dates): array
    {
        $query = $this->baseQuery();
        $dossiers = (clone $query)->whereBetween('date_ouverture', [$dates['from'], $dates['to']])->get();
        
        return [
            'total' => $dossiers->count(),
            'ouverts' => $dossiers->whereNull('date_fermeture')->count(),
            'fermes' => $dossiers->whereNotNull('date_fermeture')->count(),
            'duree_moyenne' => $dossiers->where('date_fermeture', '!=', null)->avg(function($d) {
                return Carbon::parse($d->date_ouverture)->diffInDays($d->date_fermeture);
            }),
        ];
    }

    private function getProprietesStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $query = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $proprietes = $query->get();
        
        return [
            'total' => $proprietes->count(),
            'disponibles' => $proprietes->where('is_archived', false)->count(),
            'acquises' => $proprietes->where('is_archived', true)->count(),
            'superficie_totale' => $proprietes->sum('contenance'),
            'superficie_moyenne' => round($proprietes->avg('contenance'), 2),
        ];
    }

    private function getDemandeursStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $query = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $demandeurs = $query->get();
        
        return [
            'total' => $demandeurs->count(),
            'avec_propriete' => $demandeurs->filter(fn($d) => $d->proprietes()->exists())->count(),
            'sans_propriete' => $demandeurs->filter(fn($d) => !$d->proprietes()->exists())->count(),
            'age_moyen' => round($demandeurs->avg(fn($d) => Carbon::parse($d->date_naissance)->age), 1),
        ];
    }

    private function getDemographicsStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $demandeurs = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->get();
        
        $totalHommes = $demandeurs->where('sexe', 'Homme')->count();
        $totalFemmes = $demandeurs->where('sexe', 'Femme')->count();
        $total = $demandeurs->count();
        
        return [
            'total_hommes' => $totalHommes,
            'total_femmes' => $totalFemmes,
            'pourcentage_hommes' => $total > 0 ? round(($totalHommes / $total) * 100, 1) : 0,
            'pourcentage_femmes' => $total > 0 ? round(($totalFemmes / $total) * 100, 1) : 0,
            'hommes_avec_propriete' => $demandeurs->where('sexe', 'Homme')->filter(fn($d) => $d->proprietes()->exists())->count(),
            'femmes_avec_propriete' => $demandeurs->where('sexe', 'Femme')->filter(fn($d) => $d->proprietes()->exists())->count(),
            'age_moyen' => round($demandeurs->avg(fn($d) => Carbon::parse($d->date_naissance)->age), 1),
            'tranches_age' => [
                '18-30' => $demandeurs->filter(fn($d) => Carbon::parse($d->date_naissance)->age >= 18 && Carbon::parse($d->date_naissance)->age <= 30)->count(),
                '31-45' => $demandeurs->filter(fn($d) => Carbon::parse($d->date_naissance)->age >= 31 && Carbon::parse($d->date_naissance)->age <= 45)->count(),
                '46-60' => $demandeurs->filter(fn($d) => Carbon::parse($d->date_naissance)->age >= 46 && Carbon::parse($d->date_naissance)->age <= 60)->count(),
                '61+' => $demandeurs->filter(fn($d) => Carbon::parse($d->date_naissance)->age >= 61)->count(),
            ],
        ];
    }

    private function getFinancialsStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $demandes = Demander::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('status', '!=', 'archive')
            ->get();
        
        $parVocation = Demander::query()
            ->join('proprietes', 'demander.id_propriete', '=', 'proprietes.id')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('demander.status', '!=', 'archive')
            ->select('proprietes.vocation')
            ->selectRaw('SUM(demander.total_prix) as total')
            ->groupBy('proprietes.vocation')
            ->pluck('total', 'vocation');
        
        return [
            'total_revenus_potentiels' => $demandes->sum('prix'),
            'revenu_moyen' => round($demandes->avg('prix'), 2),
            'revenu_max' => $demandes->max('prix'),
            'revenu_min' => $demandes->min('prix'),
            'par_vocation' => $parVocation->toArray(),
        ];
    }

    private function getGeographicStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $parCommune = Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->select('commune')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('commune')
            ->orderByDesc('count')
            ->limit(10)
            ->get();
        
        return [
            'top_communes' => $parCommune->toArray(),
        ];
    }

    private function getPerformanceStats(array $dates): array
    {
        $query = $this->baseQuery();
        
        $dossiersComplets = (clone $query)
            ->whereHas('demandeurs')
            ->whereHas('proprietes')
            ->count();
        
        $total = (clone $query)->count();
        
        return [
            'taux_completion' => $total > 0 ? round(($dossiersComplets / $total) * 100, 1) : 0,
            'temps_moyen_traitement' => 45,
            'dossiers_en_retard' => 0,
        ];
    }

    private function getEvolutionMensuelle(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $data = Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->selectRaw('
                DATE_TRUNC(\'month\', date_ouverture) as month,
                COUNT(*) as dossiers,
                0 as proprietes,
                0 as demandeurs
            ')
            ->where('date_ouverture', '>=', now()->subYear())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function($item) {
                return [
                    'month' => Carbon::parse($item->month)->format('M Y'),
                    'dossiers' => $item->dossiers,
                    'proprietes' => $item->proprietes,
                    'demandeurs' => $item->demandeurs,
                ];
            });
        
        return $data->toArray();
    }

    private function getRepartitionNature(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $data = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->select('nature')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('nature')
            ->get()
            ->map(fn($item) => [
                'name' => $item->nature,
                'value' => $item->count
            ]);
        
        return $data->toArray();
    }

    private function getRepartitionVocation(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $data = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->select('vocation')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('vocation')
            ->get()
            ->map(fn($item) => [
                'name' => $item->vocation,
                'value' => $item->count
            ]);
        
        return $data->toArray();
    }

    private function getTopDistricts(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        if (!$user->canAccessAllDistricts()) {
            return [];
        }
        
        $data = Dossier::query()
            ->join('districts', 'dossiers.id_district', '=', 'districts.id')
            ->select('districts.nom_district')
            ->selectRaw('COUNT(dossiers.id) as count')
            ->groupBy('districts.nom_district')
            ->orderByDesc('count')
            ->limit(10)
            ->get();
        
        return $data->toArray();
    }

    private function getAgePyramid(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $demandeurs = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->select('date_naissance', 'sexe')
            ->get();
        
        $tranches = [
            '18-30' => ['hommes' => 0, 'femmes' => 0],
            '31-45' => ['hommes' => 0, 'femmes' => 0],
            '46-60' => ['hommes' => 0, 'femmes' => 0],
            '61+' => ['hommes' => 0, 'femmes' => 0],
        ];
        
        foreach ($demandeurs as $d) {
            $age = Carbon::parse($d->date_naissance)->age;
            $genre = strtolower($d->sexe) === 'homme' ? 'hommes' : 'femmes';
            
            if ($age >= 18 && $age <= 30) $tranches['18-30'][$genre]++;
            elseif ($age >= 31 && $age <= 45) $tranches['31-45'][$genre]++;
            elseif ($age >= 46 && $age <= 60) $tranches['46-60'][$genre]++;
            elseif ($age >= 61) $tranches['61+'][$genre]++;
        }
        
        return $tranches;
    }

    private function getCompletionRate(array $dates): array
    {
        $query = $this->baseQuery();
        
        $total = (clone $query)->count();
        $complets = (clone $query)->whereHas('demandeurs')->whereHas('proprietes')->count();
        
        return [
            'rate' => $total > 0 ? round(($complets / $total) * 100, 1) : 0,
            'complets' => $complets,
            'incomplets' => $total - $complets,
        ];
    }

    private function baseQuery()
    {
        /** @var User $user */
        $user = Auth::user();
        $query = Dossier::query();
        
        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }
        
        return $query;
    }

    private function getPeriodDates(string $period, $customFrom = null, $customTo = null): array
    {
        $now = now();
        
        switch ($period) {
            case 'today':
                return ['from' => $now->copy()->startOfDay(), 'to' => $now->copy()->endOfDay()];
            case 'week':
                return ['from' => $now->copy()->startOfWeek(), 'to' => $now->copy()->endOfWeek()];
            case 'month':
                return ['from' => $now->copy()->startOfMonth(), 'to' => $now->copy()->endOfMonth()];
            case 'year':
                return ['from' => $now->copy()->startOfYear(), 'to' => $now->copy()->endOfYear()];
            case 'custom':
                return [
                    'from' => $customFrom ? Carbon::parse($customFrom) : $now->copy()->subMonth(),
                    'to' => $customTo ? Carbon::parse($customTo) : $now
                ];
            default:
                return ['from' => $now->copy()->startOfMonth(), 'to' => $now->copy()->endOfMonth()];
        }
    }
}