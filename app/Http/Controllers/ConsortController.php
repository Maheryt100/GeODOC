<?php

namespace App\Http\Controllers;


use App\Models\Consort;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConsortController extends Controller
{
    //

    public function index(){
        return Inertia::render('consorts/index');
    }
    public function search(Request $request){
        $cin = $request->input('cin');

        $demandeur  = DB::table('demandeurs')
            ->select('*')
            ->where('cin', $cin)
            ->first();

        if (!$demandeur) {
            return redirect()->route('consorts')->with('message', 'Vérifier le cin: aucun demandeur ne correspond');
        }


        $allConsorts = DB::table('consorts as c')
            ->select('d.*')
            ->join('demandeurs as d', 'd.id', '=', 'c.id_consort')
            ->where('c.id_demandeur', $demandeur->id)
            ->where('c.status', true)
            ->get();

        return Inertia::render('consorts/index', [
            'demandeur' => $demandeur,
            'allConsorts' => $allConsorts,
        ]);
        //return redirect()->route('consorts')->with('allConsorts', $allConsorts);
    }
    public function archive($consortId, $demandeurId){

        $consort = Consort::select('id')
            ->where('id_consort', $consortId)
            ->where('id_demandeur', $demandeurId)
            ->first();

        Consort::where('id', $consort->id)->update(['status' => false]);

        return to_route('consorts');
    }
}
