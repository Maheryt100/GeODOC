<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\District;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class DossierController extends Controller
{
    public function index()
    {
        $dossiers = Dossier::withCount(['demandeurs', 'proprietes'])
            ->orderBy('date_descente_debut', 'desc')
            ->get();
        
        return Inertia::render('dossiers/index', [
            'dossiers' => $dossiers,
        ]);
    }
    
    public function create()
    {
        $districts = District::all();
        return Inertia::render('dossiers/create', [
            'districts' => $districts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_dossier' => 'required|string|max:100',
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'id_district' => 'required|numeric|exists:districts,id',
        ], [
            'nom_dossier.required' => 'Le nom du dossier est obligatoire',
            'type_commune.required' => 'Le type de commune est obligatoire',
            'commune.required' => 'La commune est obligatoire',
            'fokontany.required' => 'Le fokontany est obligatoire',
            'type.required' => 'Le type de dossier est obligatoire',
            'date_descente_fin.after_or_equal' => 'La date de fin doit être après ou égale à la date de début',
        ]);
        
        try {
            $validated['id_user'] = Auth::id();
            
            Dossier::create($validated);
            
            return Redirect::route('dossiers')
                ->with('message', 'Dossier créé avec succès');
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    /**
     * Recherche améliorée - accepte n'importe quelle longueur
     * Si vide, retourne tous les dossiers
     */
    public function search(Request $request)
    {
        // Pas de validation de longueur minimale
        $search = $request->input('search', '');

        try {
            $query = Dossier::withCount('demandeurs', 'proprietes');

            // Si recherche vide, retourner tous les dossiers
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom_dossier', 'ilike', "%{$search}%")
                      ->orWhere('commune', 'ilike', "%{$search}%")
                      ->orWhere('circonscription', 'ilike', "%{$search}%")
                      ->orWhere('fokontany', 'ilike', "%{$search}%");
                });
            }

            $dossiers = $query->orderBy('date_descente_debut', 'desc')->get();
            
            $message = empty($search) 
                ? 'Tous les dossiers' 
                : ($dossiers->isEmpty() 
                    ? "Aucun dossier ne correspond à '{$search}'" 
                    : "{$dossiers->count()} dossier(s) trouvé(s)");
            
            return Inertia::render('dossiers/index', [
                'dossiers' => $dossiers,
            ])->with('message', $message);
            
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function edit($id)
    {
        $dossier = Dossier::findOrFail($id);
        $districts = District::all();
        
        return Inertia::render('dossiers/update', [
            'dossier' => $dossier,
            'districts' => $districts,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nom_dossier' => 'required|string|max:255',
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:255',
            'fokontany' => 'required|string|max:255',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'circonscription' => 'required|string|max:255',
            'id_district' => 'required|exists:districts,id',
        ]);

        $dossier = Dossier::findOrFail($id);
        $dossier->update($validated);

        return redirect()
            ->route('dossiers.show', $id)
            ->with('message', 'Dossier modifié avec succès');
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

    // public function show($id)
    // {
    //     $dossier = Dossier::with(['demandeurs', 'proprietes'])
    //         ->findOrFail($id);
        
    //     return Inertia::render('dossiers/Show', [
    //         'dossier' => $dossier,
    //     ]);
    // }
    public function show($id)
    {
        $dossier = Dossier::with([
            'demandeurs',
            'proprietes' => function($query) {
                $query->with('demandeurs')
                    ->select('*'); // S'assurer que type_operation est inclus
            }
        ])->findOrFail($id);

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