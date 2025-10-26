<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Mockery\Exception;

class DossierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        return Inertia::render('dossiers/index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return Inertia::render('dossiers/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validate = $request->validate([
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'type' => 'required|string|max:30',
            'date_descente_debut' => 'required|date|before:today',
            'date_descente_fin' => 'required|date|after:date_descente_debut',
            'id_district' => 'required|numeric|exists:districts,id',
        ],[
            'commune.required' => 'La commune est obligatoire',
            'lot.required' => 'La lot est obligatoire',
            'titre.required' => 'La titre est obligatoire',
            'date_descente_fin.after' => 'La date de descente fin est doit etre après la date début',
        ]);
        try {
            $request->merge(['id_user' => Auth::user()->getAuthIdentifier()]);
            $dossier = Dossier::create($request->all());
            return Redirect::route('dossiers')->with('message', 'Dossier créé avec succès');
        }catch (\Exception $exception){
            return $exception->getMessage();
        }
    }

    /**
     * Display the specified resource.
     */
    public function search(Request $request)
    {
        //
        $validate = $request->validate([
           'search' => 'required|string|max:30',
        ]);

        try {
            $query = Dossier::withCount('demandeurs', 'proprietes');

            if ($request->filled('search')) {
                $search = $request->search;

                $query->where(function ($q) use ($search) {
                    $q->where('nom_dossier', 'ilike', "%{$search}%");
                });
            }

            $dossiers = $query->get();
            if ($dossiers->isEmpty()) {
                return back()->with('message', 'Aucun dossier ne correspond');
            }
            return Inertia::render('dossiers/index', [
                'dossiers' => $dossiers,
            ]);
        }catch (\Exception $exception){
            return $exception->getMessage();
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        //
        $dossier = Dossier::find($id);

        if(!$dossier){
            return Inertia::render('dossiers/index')->with("message", "Dossier introuvable ou n'existe pas");
        }

        return Inertia::render('dossiers/update',[
           'dossier' => $dossier,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        //
        $dossier = Dossier::find($id);
        if (!$dossier) {
            return Redirect::back()->with("message", "Dossier introuvable");
        }
        $validate = $request->validate([
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'type' => 'required|string|max:30',
            'date_descente_debut' => 'required|date|before:today',
            'date_descente_fin' => 'required|date|after:date_descente_debut',
            'id_district' => 'required|numeric|exists:districts,id',
        ],[
            'commune.required' => 'La commune est obligatoire',
            'fokontany.required' => 'le champ fokontany est obligatoire',
            'type.required' => 'La titre est obligatoire',
            'date_descente_fin.after' => 'La date de descente fin est doit etre après la date début',
        ]);
        try {
            $dossier->update($request->all());

            return Redirect::route("dossiers")->with("message", "Dossiers modifié avec succès");
        }catch (Exception $exception){
            return $exception->getMessage();
        }
    }

    public function demandeurs($id)
    {
        $dossier =  Dossier::find($id);
        $demandeurs = $dossier->demandeurs()
            ->paginate(20);


        return Inertia::render('demandeurs/index', [
           'demandeurs' => $demandeurs,
            'dossier' => $dossier,
        ]);
    }
    public function proprietes($id)
    {
        $dossier =  Dossier::find($id);
        $proprietes = DB::table('proprietes')
            ->join('dossiers', 'dossiers.id', '=', 'proprietes.id_dossier')
            ->select('proprietes.*')
            ->where('dossiers.id', '=', $dossier->id)
            ->paginate(20);

        return Inertia::render('proprietes/index', [
            'proprietes' => $proprietes,
            'dossier' => $dossier,
        ]);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
