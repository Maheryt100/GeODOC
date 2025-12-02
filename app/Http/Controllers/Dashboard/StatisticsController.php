<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Dashboard\Services\StatisticsService;
use App\Models\District;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    public function __construct(
        private StatisticsService $statisticsService
    ) {}

    /**
     * 🟢 STATISTIQUES - Page complète avec tous les graphiques
     */
    public function index(Request $request)
    {
        // Récupération des filtres
        $period = $request->get('period', 'month');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $districtId = $request->get('district_id');

        // Déterminer les dates selon la période
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);

        return Inertia::render('Statistics/Index', [
            'stats' => $this->statisticsService->getAllStats($dates),
            'charts' => $this->statisticsService->getAllCharts($dates),
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'district_id' => $districtId,
            ],
            'districts' => District::orderBy('nom_district')->get(),
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
}