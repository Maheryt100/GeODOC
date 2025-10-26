<?php

namespace App\Http\Controllers;
use App\Models\Demandeur;
use App\Models\Dossier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;


class StatController extends Controller
{
    public function index(){

        $dossiers = Dossier::query()
            ->limit(6)
            ->get();

        $totalDmdrEtPptByDossier = $dossiers->totalDemandeurPropriete();


        $totalDmdrWithoutPptByDossier = Dossier::withCount([
            'demandeurs as demandeurs_sans_propriete' => function (Builder $query) {
                $query->whereDoesntHave('proprietes', function (Builder $subQuery) {
                    $subQuery->whereColumn('proprietes.id_dossier', 'dossiers.id');
                });
                $query->whereDoesntHave('consortLinks');
            }
        ])
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get();

        $dossiersTotals = Dossier::withCount('demandes');

        $totalDemandeByDossier = $dossiersTotals->limit(6)->get();

        $dossiersWithTotals = $dossiersTotals->withSum('demandes as prix', 'total_prix')
            ->orderBy('created_at', 'asc')
            ->get();



        return Inertia::render('dashboard',[
            'lineChartData' => $totalDemandeByDossier,
            'barChartData' => $totalDmdrEtPptByDossier,
            'chartRadialData' => $totalDmdrWithoutPptByDossier,
            'barChartInteractiveData' => $dossiersWithTotals,
        ]);
    }

}
