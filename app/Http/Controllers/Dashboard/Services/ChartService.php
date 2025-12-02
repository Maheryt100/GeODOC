<?php

namespace App\Http\Controllers\Dashboard\Services;

use App\Models\User;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demander;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ChartService
{
    use Traits\QueryFilterTrait;

    /**
     * Récupérer tous les graphiques pour le dashboard
     */
    public function getAllCharts(): array
    {
        return [
            'dossiers_timeline' => $this->getDossiersTimeline(),
            'proprietes_status' => $this->getProprietesStatus(),
            'top_communes' => $this->getTopCommunes(5),
            'evolution_mensuelle' => $this->getEvolutionMensuelle(),
            'revenus_par_vocation' => $this->getRevenuParVocation(),
            'performance_trimestrielle' => $this->getPerformanceQuarterly(),
        ];
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
        /** @var User $user */
        $user = Auth::user();
        
        $disponibles = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
        
        $acquises = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->count();
        
        return [
            'disponibles' => $disponibles,
            'acquises' => $acquises,
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

    /**
     * Évolution mensuelle complète (dossiers, propriétés, demandeurs)
     */
    private function getEvolutionMensuelle(?array $dates = null): array
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

    /**
     * Revenus par vocation (seulement demandes actives)
     */
    private function getRevenuParVocation(): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $data = Demander::query()
            ->join('proprietes', 'demander.id_propriete', '=', 'proprietes.id')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->join('dossiers', 'proprietes.id_dossier', '=', 'dossiers.id')
                  ->where('dossiers.id_district', $user->id_district);
            })
            ->where('demander.status', 'active')
            ->select('proprietes.vocation')
            ->selectRaw('SUM(demander.total_prix) as montant')
            ->groupBy('proprietes.vocation')
            ->get();

        return $data->map(fn($item) => [
            'vocation' => ucfirst($item->vocation ?? 'Non défini'),
            'montant' => (int) ($item->montant ?? 0)
        ])->toArray();
    }

    /**
     * Évolution trimestrielle des dossiers par statut
     */
    private function getPerformanceQuarterly(): array
    {
        /** @var User $user */
        $user = Auth::user();
        
        $quarters = [];
        for ($i = 3; $i >= 0; $i--) {
            $date = now()->subQuarters($i);
            $quarters[] = [
                'quarter' => 'Q' . $date->quarter . ' ' . $date->year,
                'start' => $date->copy()->startOfQuarter(),
                'end' => $date->copy()->endOfQuarter(),
            ];
        }

        return collect($quarters)->map(function($quarter) use ($user) {
            $query = Dossier::query()
                ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                ->whereBetween('date_ouverture', [$quarter['start'], $quarter['end']]);

            $ouverts = (clone $query)->whereNull('date_fermeture')->count();
            $fermes = (clone $query)->whereNotNull('date_fermeture')->count();
            $total = (clone $query)->count();

            return [
                'quarter' => $quarter['quarter'],
                'ouverts' => $ouverts,
                'fermes' => $fermes,
                'total' => $total,
            ];
        })->toArray();
    }
}