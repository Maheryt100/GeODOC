<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Dashboard\Services\KpiService;
use App\Http\Controllers\Dashboard\Services\ChartService;
use App\Http\Controllers\Dashboard\Services\AlertService;
use App\Http\Controllers\Dashboard\Services\ActivityService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private KpiService $kpiService,
        private ChartService $chartService,
        private AlertService $alertService,
        private ActivityService $activityService
    ) {}

    /**
     * 🟢 DASHBOARD - Page d'accueil avec KPIs améliorés
     */
    public function index()
    {
        return Inertia::render('Dashboard/Index', [
            'kpis' => $this->kpiService->getAllKpis(),
            'charts' => $this->chartService->getAllCharts(),
            'alerts' => $this->alertService->getSystemAlerts(),
            'recentActivity' => $this->activityService->getRecentActivity(10),
        ]);
    }
}