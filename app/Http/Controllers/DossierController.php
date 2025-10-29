<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class DossierController extends Controller
{
    public function index()
    {
        $dossiers = Dossier::withCount(['demandeurs', 'proprietes'])->get();
        
        return Inertia::render('dossiers/index', [
            'dossiers' => $dossiers,
        ]);
    }
    
    public function create()
    {
        $districts = \App\Models\District::all();
        return Inertia::render('dossiers/create', [
            'districts' => $districts,
        ]);
    }

    public function store(Request $request)
    {
        $validate = $request->validate([
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'date_descente_debut' => 'required|date|before:today',
            'date_descente_fin' => 'required|date|after:date_descente_debut',
            'id_district' => 'required|numeric|exists:districts,id',
            'nom_dossier' => 'required|string|max:100',
        ],[
            'commune.required' => 'La commune est obligatoire',
            'fokontany.required' => 'Le fokontany est obligatoire',
            'date_descente_fin.after' => 'La date de fin doit être après la date de début',
        ]);
        
        try {
            $request->merge(['id_user' => Auth::id()]);
            Dossier::create($request->all());
            return Redirect::route('dossiers')->with('message', 'Dossier créé avec succès');
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function search(Request $request)
    {
        $validate = $request->validate([
           'search' => 'required|string|max:30',
        ]);

        try {
            $query = Dossier::withCount('demandeurs', 'proprietes');

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where('nom_dossier', 'ilike', "%{$search}%");
            }

            $dossiers = $query->get();
            
            if ($dossiers->isEmpty()) {
                return back()->with('message', 'Aucun dossier ne correspond');
            }
            
            return Inertia::render('dossiers/index', [
                'dossiers' => $dossiers,
            ]);
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function edit($id)
    {
        $dossier = Dossier::find($id);

        if (!$dossier) {
            return redirect()->route('dossiers')->with("message", "Dossier introuvable");
        }

        return Inertia::render('dossiers/update', [
           'dossier' => $dossier,
           'district' => \App\Models\District::all(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $dossier = Dossier::find($id);
        
        if (!$dossier) {
            return Redirect::back()->with("message", "Dossier introuvable");
        }
        
        $validate = $request->validate([
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'date_descente_debut' => 'required|date|before:today',
            'date_descente_fin' => 'required|date|after:date_descente_debut',
            'id_district' => 'required|numeric|exists:districts,id',
            'nom_dossier' => 'required|string|max:100',
        ]);
        
        try {
            $dossier->update($request->all());
            return Redirect::route("dossiers")->with("message", "Dossier modifié avec succès");
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function demandeurs($id)
    {
        $dossier = Dossier::findOrFail($id);
        $demandeurs = $dossier->demandeurs()->paginate(20);

        return Inertia::render('demandeurs/index', [
           'demandeurs' => $demandeurs,
            'dossier' => $dossier,
        ]);
    }
    
    public function proprietes($id)
    {
        $dossier = Dossier::findOrFail($id);
        $proprietes = $dossier->proprietes()->paginate(20);

        return Inertia::render('proprietes/index', [
            'proprietes' => $proprietes,
            'dossier' => $dossier,
        ]);
    }

    public function show($id)
    {
        $dossier = Dossier::with(['demandeurs', 'proprietes'])
            ->findOrFail($id);
        
        return Inertia::render('dossiers/Show', [
            'dossier' => $dossier,
        ]);
    }

    public function destroy(string $id)
    {
        $dossier = Dossier::find($id);
        
        if (!$dossier) {
            return back()->with('message', 'Dossier introuvable');
        }
        
        $dossier->delete();
        return redirect()->route('dossiers')->with('message', 'Dossier supprimé avec succès');
    }
}