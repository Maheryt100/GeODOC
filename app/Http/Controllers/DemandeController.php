<?php

namespace App\Http\Controllers;

use App\Models\Consort;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\District;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DemandeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return Inertia::render('documents/create',[
            'proprietes' => Propriete::all(),
            'demandeurs' => Demandeur::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //dd($request);

        //validation des données
        $validate = $request->validate([
           'propriete_id' => 'required|exists:proprietes,id',
           'demandeur_id' => 'required|exists:demandeurs,id',
           'consort' => 'array|nullable',
            'consort.*' => 'exists:demandeurs,id',
        ]);

        //parcours le tableau et insert un consort à un demandeur principale et verifie si le consort n'existe pas déjà
        foreach ($validate['consort'] as $id_consort) {
            $exists = Consort::where('id_demandeur', $validate['demandeur_id'])
                ->where('id_consort', $id_consort)
                ->exists();

            if (!$exists) {
                Consort::create([
                    'id_demandeur' => $validate['demandeur_id'],
                    'id_consort' => $id_consort,
                ]);
            }
        }


        // requête pour recupérer la nature du propriete
        $proprieteNature = Propriete::select('nature')->where('id', $validate['propriete_id'])->first();
        $nature = $proprieteNature->nature;

        //requête pour la récuperation du prix par district
        $prixDistrict = DB::table("districts")
            ->join('proprietes', 'districts.id', '=', 'proprietes.id_district')
            ->select("districts.$nature")
            ->where('proprietes.id', $validate['propriete_id'])
            ->first();
        $prix = $prixDistrict->$nature;

        //requête pour la récuperation du superficie (contenance)
        $superficie = DB::table("proprietes")
            ->select('contenance')
            ->where('proprietes.id', $validate['propriete_id'])
            ->first();
        $prixTotal = $prix * $superficie->contenance;

        try {

            //insertion association entre demandeur <----> propriete
            $document = Demander::create([
                'id_demandeur' => $validate['demandeur_id'],
                'id_propriete' => $validate['propriete_id'],
                'total_prix' => $prixTotal,
            ]);
        return redirect()->route('documents')->with('message', 'Demandeur liée avec succès');
        }catch (\Exception $exception){
            return back()->withErrors($exception->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
