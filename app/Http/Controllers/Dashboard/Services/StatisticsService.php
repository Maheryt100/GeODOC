<?php

namespace App\Http\Controllers\Dashboard\Services;

use App\Models\User;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatisticsService
{
    use Traits\QueryFilterTrait;

    public function getAllStats(array $dates): array
    {
        return [
            'overview' => $this->getOverviewStats($dates),
            'dossiers' => $this->getDossiersStats($dates),
            'proprietes' => $this->getProprietesStats($dates),
            'demandeurs' => $this->getDemandeursStats($dates),
            'demographics' => $this->getDemographicsStats($dates),
            'financials' => $this->getFinancialsStats($dates),
            'geographic' => $this->getGeographicStats($dates),
            'performance' => $this->getPerformanceStats($dates),
        ];
    }

    public function getAllCharts(array $dates): array
    {
        return [
            'evolution_mensuelle' => $this->getEvolutionMensuelle(),
            'repartition_nature' => $this->getRepartitionNature($dates),
            'repartition_vocation' => $this->getRepartitionVocation($dates),
            'top_districts' => $this->getTopDistricts($dates),
            'age_pyramid' => $this->getAgePyramid($dates),
            'completion_rate' => $this->getCompletionRate($dates),
            'dossiers_par_statut' => $this->getDossiersParStatut($dates),
            'superficie_par_vocation' => $this->getSuperficieParVocation($dates),
            'demandeurs_par_situation' => $this->getDemandeursSituation($dates),
        ];
    }

    public function getPeriodDates(string $period, $customFrom = null, $customTo = null): array
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

    private function getOverviewStats(array $dates): array
    {
        $query = $this->baseQuery();
        
        $total = (clone $query)->whereBetween('date_ouverture', [$dates['from'], $dates['to']])->count();
        $ouverts = (clone $query)->whereNull('date_fermeture')->count();
        $fermes = (clone $query)->whereNotNull('date_fermeture')->count();
        
        // Taux de croissance calculé dynamiquement
        $tauxCroissance = $this->calculateGrowthRate($dates);
        
        return [
            'total_dossiers' => $total,
            'dossiers_ouverts' => $ouverts,
            'dossiers_fermes' => $fermes,
            'taux_croissance' => $tauxCroissance,
        ];
    }

    /**
     * ✅ Calcul dynamique du taux de croissance
     */
    private function calculateGrowthRate(array $dates): float
    {
        $currentPeriod = $this->baseQuery()
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->count();
        
        $periodLength = Carbon::parse($dates['from'])->diffInDays(Carbon::parse($dates['to']));
        $previousFrom = Carbon::parse($dates['from'])->subDays($periodLength);
        $previousTo = Carbon::parse($dates['to'])->subDays($periodLength);
        
        $previousPeriod = $this->baseQuery()
            ->whereBetween('date_ouverture', [$previousFrom, $previousTo])
            ->count();
        
        if ($previousPeriod == 0) return $currentPeriod > 0 ? 100 : 0;
        
        return round((($currentPeriod - $previousPeriod) / $previousPeriod) * 100, 1);
    }

    private function getDossiersStats(array $dates): array
    {
        $query = $this->baseQuery();
        $dossiers = (clone $query)->whereBetween('date_ouverture', [$dates['from'], $dates['to']])->get();
        
        $dossiersFermes = $dossiers->whereNotNull('date_fermeture');
        
        $dureeMoyenne = $dossiersFermes->isEmpty() ? 0 : $dossiersFermes->avg(function($d) {
            return Carbon::parse($d->date_ouverture)->diffInDays($d->date_fermeture);
        });
        
        return [
            'total' => $dossiers->count(),
            'ouverts' => $dossiers->whereNull('date_fermeture')->count(),
            'fermes' => $dossiersFermes->count(),
            'duree_moyenne' => round($dureeMoyenne, 1),
            'en_retard' => (clone $query)
                ->whereNull('date_fermeture')
                ->where('date_ouverture', '<', now()->subDays(90))
                ->count(),
        ];
    }

    /**
     * ✅ CORRIGÉ : Statistiques propriétés avec logique cohérente
     */
    private function getProprietesStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $query = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $proprietes = (clone $query)->get();
        
        // Propriétés avec au moins une demande active
        $disponibles = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
        
        // Propriétés dont toutes les demandes sont archivées
        $acquises = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->whereDoesntHave('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
        
        // Propriétés sans aucune demande
        $sansDemande = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->doesntHave('demandes')
            ->count();
        
        return [
            'total' => $proprietes->count(),
            'disponibles' => $disponibles,
            'acquises' => $acquises,
            'sans_demande' => $sansDemande,
            'superficie_totale' => $proprietes->sum('contenance') ?? 0,
            'superficie_moyenne' => $proprietes->count() > 0 
                ? round($proprietes->avg('contenance'), 2) 
                : 0,
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
        
        // Avec au moins une propriété
        $avecPropriete = $demandeurs->filter(fn($d) => $d->proprietes()->exists())->count();
        
        // Avec au moins une demande active
        $actifs = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
        
        // Âge moyen (optimisé avec requête SQL)
        $ageMoyen = DB::table('demandeurs')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereExists(function($subq) use ($user) {
                    $subq->from('contenir')
                        ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                        ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                        ->where('dossiers.id_district', $user->id_district);
                });
            })
            ->selectRaw('AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance))) as age_moyen')
            ->value('age_moyen');
        
        return [
            'total' => $demandeurs->count(),
            'avec_propriete' => $avecPropriete,
            'sans_propriete' => $demandeurs->count() - $avecPropriete,
            'actifs' => $actifs,
            'age_moyen' => round($ageMoyen ?? 0, 1),
        ];
    }

    /**
     * ✅ OPTIMISÉ : Tranches d'âge avec requête SQL au lieu de filter
     */
    private function getDemographicsStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $baseQuery = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $totalHommes = (clone $baseQuery)->where('sexe', 'Homme')->count();
        $totalFemmes = (clone $baseQuery)->where('sexe', 'Femme')->count();
        $total = $totalHommes + $totalFemmes;
        
        // Avec propriété
        $hommesAvecPropriete = (clone $baseQuery)
            ->where('sexe', 'Homme')
            ->whereHas('proprietes')
            ->count();
        
        $femmesAvecPropriete = (clone $baseQuery)
            ->where('sexe', 'Femme')
            ->whereHas('proprietes')
            ->count();
        
        // Âge moyen
        $ageMoyen = DB::table('demandeurs')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereExists(function($subq) use ($user) {
                    $subq->from('contenir')
                        ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                        ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                        ->where('dossiers.id_district', $user->id_district);
                });
            })
            ->selectRaw('AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance))) as age_moyen')
            ->value('age_moyen');
        
        // ✅ Tranches d'âge optimisées
        $tranchesAge = [];
        $tranches = [
            '18-30' => [18, 30],
            '31-45' => [31, 45],
            '46-60' => [46, 60],
            '61+' => [61, 999],
        ];
        
        foreach ($tranches as $label => [$min, $max]) {
            $tranchesAge[$label] = DB::table('demandeurs')
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereExists(function($subq) use ($user) {
                        $subq->from('contenir')
                            ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                            ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                            ->where('dossiers.id_district', $user->id_district);
                    });
                })
                ->whereRaw("EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance)) BETWEEN ? AND ?", [$min, $max])
                ->count();
        }
        
        return [
            'total_hommes' => $totalHommes,
            'total_femmes' => $totalFemmes,
            'pourcentage_hommes' => $total > 0 ? round(($totalHommes / $total) * 100, 1) : 0,
            'pourcentage_femmes' => $total > 0 ? round(($totalFemmes / $total) * 100, 1) : 0,
            'hommes_avec_propriete' => $hommesAvecPropriete,
            'femmes_avec_propriete' => $femmesAvecPropriete,
            'age_moyen' => round($ageMoyen ?? 0, 1),
            'tranches_age' => $tranchesAge,
        ];
    }

    /**
     * ✅ CORRIGÉ : Finances basées uniquement sur demandes actives
     */
    private function getFinancialsStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $demandes = Demander::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('status', 'active')
            ->get();
        
        $parVocation = Demander::query()
            ->join('proprietes', 'demander.id_propriete', '=', 'proprietes.id')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->join('dossiers', 'proprietes.id_dossier', '=', 'dossiers.id')
                  ->where('dossiers.id_district', $user->id_district);
            })
            ->where('demander.status', 'active')
            ->select('proprietes.vocation')
            ->selectRaw('SUM(demander.total_prix) as total')
            ->groupBy('proprietes.vocation')
            ->pluck('total', 'vocation')
            ->map(fn($val) => (int) $val);
        
        return [
            'total_revenus_potentiels' => $demandes->sum('total_prix') ?? 0,
            'revenu_moyen' => $demandes->count() > 0 
                ? round($demandes->avg('total_prix'), 2) 
                : 0,
            'revenu_max' => $demandes->max('total_prix') ?? 0,
            'revenu_min' => $demandes->where('total_prix', '>', 0)->min('total_prix') ?? 0,
            'par_vocation' => $parVocation->toArray(),
        ];
    }

    private function getGeographicStats(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $parCommune = Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->select('commune', 'fokontany', 'type_commune')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('commune', 'fokontany', 'type_commune')
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
        
        $dossiers = (clone $query)
            ->whereNotNull('date_fermeture')
            ->select('date_ouverture', 'date_fermeture')
            ->get();
        
        $tempsMoyen = 0;
        if ($dossiers->isNotEmpty()) {
            $totalDays = $dossiers->sum(function($dossier) {
                return Carbon::parse($dossier->date_ouverture)
                    ->diffInDays(Carbon::parse($dossier->date_fermeture));
            });
            $tempsMoyen = (int) round($totalDays / $dossiers->count());
        }
        
        $enRetard = (clone $query)
            ->whereNull('date_fermeture')
            ->where('date_ouverture', '<', now()->subDays(90))
            ->count();
        
        return [
            'taux_completion' => $total > 0 ? round(($dossiersComplets / $total) * 100, 1) : 0,
            'temps_moyen_traitement' => $tempsMoyen,
            'dossiers_en_retard' => $enRetard,
        ];
    }

    // ========================================
    // GRAPHIQUES
    // ========================================

    private function getEvolutionMensuelle(): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $months = collect();
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months->push([
                'month' => $date->format('M Y'),
                'date' => $date->format('Y-m'),
            ]);
        }

        return $months->map(function($month) use ($user) {
            $startOfMonth = Carbon::parse($month['date'])->startOfMonth();
            $endOfMonth = Carbon::parse($month['date'])->endOfMonth();

            return [
                'month' => $month['month'],
                'count' => Dossier::query()
                    ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                    ->whereBetween('date_ouverture', [$startOfMonth, $endOfMonth])
                    ->count(),
            ];
        })->toArray();
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
        
        $tranches = [
            '18-30' => ['hommes' => 0, 'femmes' => 0],
            '31-45' => ['hommes' => 0, 'femmes' => 0],
            '46-60' => ['hommes' => 0, 'femmes' => 0],
            '61+' => ['hommes' => 0, 'femmes' => 0],
        ];
        
        $ranges = [
            '18-30' => [18, 30],
            '31-45' => [31, 45],
            '46-60' => [46, 60],
            '61+' => [61, 999],
        ];
        
        foreach ($ranges as $label => [$min, $max]) {
            $hommes = DB::table('demandeurs')
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereExists(function($subq) use ($user) {
                        $subq->from('contenir')
                            ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                            ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                            ->where('dossiers.id_district', $user->id_district);
                    });
                })
                ->where('sexe', 'Homme')
                ->whereRaw("EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance)) BETWEEN ? AND ?", [$min, $max])
                ->count();
            
            $femmes = DB::table('demandeurs')
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereExists(function($subq) use ($user) {
                        $subq->from('contenir')
                            ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                            ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                            ->where('dossiers.id_district', $user->id_district);
                    });
                })
                ->where('sexe', 'Femme')
                ->whereRaw("EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance)) BETWEEN ? AND ?", [$min, $max])
                ->count();
            
            $tranches[$label] = ['hommes' => $hommes, 'femmes' => $femmes];
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

    /**
     * ✅ NOUVEAU : Dossiers par statut (ouvert/fermé)
     */
    private function getDossiersParStatut(array $dates): array
    {
        $query = $this->baseQuery();
        
        return [
            'ouverts' => (clone $query)->whereNull('date_fermeture')->count(),
            'fermes' => (clone $query)->whereNotNull('date_fermeture')->count(),
        ];
    }

    /**
     * ✅ NOUVEAU : Superficie par vocation
     */
    private function getSuperficieParVocation(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->select('vocation')
            ->selectRaw('SUM(contenance) as superficie')
            ->groupBy('vocation')
            ->get()
            ->mapWithKeys(fn($item) => [
                $item->vocation => (int) $item->superficie
            ])
            ->toArray();
    }

    /**
     * ✅ NOUVEAU : Demandeurs par situation familiale
     */
    private function getDemandeursSituation(array $dates): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->select('situation_familiale')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('situation_familiale')
            ->get()
            ->mapWithKeys(fn($item) => [
                $item->situation_familiale ?? 'Non défini' => $item->count
            ])
            ->toArray();
    }
}