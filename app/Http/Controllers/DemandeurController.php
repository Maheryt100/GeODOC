<?php

namespace App\Http\Controllers;

use App\Models\Contenir;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\Dossier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DemandeurController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, $id_dossier)
    {
        $dossier = Dossier::find($id_dossier);

        $query = $dossier->demandeurs();
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom_demandeur', 'ilike', "%{$search}%")
                    ->orWhere('prenom_demandeur', 'ilike', "%{$search}%")
                    ->orWhere('cin', 'ilike', "%{$search}%");
            });
        }

        $demandeurs = $query->paginate(20)->withQueryString();

        return Inertia::render('demandeurs/index', [
            'dossier' => $dossier,
            'demandeurs' => $demandeurs,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create($id)
    {
        $dossier = Dossier::find($id);
        return Inertia::render('demandeurs/create', [
            'dossier' => $dossier,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validateData = $request->validate([
       
            'titre_demandeur' => 'required|string|max:12',
            'nom_demandeur' => 'required|string|max:40',
            'prenom_demandeur' => 'nullable|string|max:50',
            'date_naissance' => 'required|date|before:-18 years',
            
            // Champs nullable
            'lieu_naissance' => 'nullable|string|max:100',
            'sexe' => 'nullable',
            'occupation' => 'nullable|string|max:30',
            'nom_pere' => 'nullable|string',
            'nom_mere' => 'nullable|string',
            'cin' => 'required|string|max:15|unique:' . Demandeur::class,
            'date_delivrance' => 'nullable|date|before:today',
            'lieu_delivrance' => 'nullable|string|max:40',
            'date_delivrance_duplicata' => 'nullable|date|before:today',
            'lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'domiciliation' => 'nullable|string|max:60',
            'situation_familiale' => 'nullable|string|max:40',
            'regime_matrimoniale' => 'nullable|string|max:40',
            'telephone' => 'nullable|string|max:10',
            'date_mariage' => 'nullable|date|before:today',
            'lieu_mariage' => 'nullable|string|max:40',
            'marie_a' => 'nullable|string|max:40',
            'nationalite' => 'nullable|string|max:40',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            'pieces.*' => 'nullable|file',
        ], [
            'titre_demandeur.required' => 'Le titre est obligatoire.',
            'nom_demandeur.required' => 'Le nom est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans.',
            'cin.nullable' => 'Le numéro CIN est obligatoire.',
            'cin.unique' => 'Le numéro CIN est déjà pris.',
            'id_dossier.required' => 'Le dossier est obligatoire.',
        ]);

        // Le reste du code reste identique
        try {
            $request->merge(['id_user' => Auth::user()->getAuthIdentifier()]);
            $demandeur = Demandeur::create(
                $request->except(['_token', 'id_dossier']),
            );
            $contenir = Contenir::create([
                'id_demandeur' => $demandeur->id,
                'id_dossier' => request()->id_dossier,
            ]);

            return redirect::route('dossiers.show', $request->id_dossier)->with('success', 'Demandeur ajouté avec succès');
        } catch (\Exception $e) {
            return back()->with('error', 'Une erreur est survenue : ' . $e->getMessage());
        }
    }
    
    /**
     * Display the specified resource.
     */
    public function search(Request $request)
    {
        $var = $request->search;
        $dossier = Dossier::where('nom_dossier', 'ILIKE', '%' . $var . '%')->first();
        if (!$dossier) {
            return Redirect::route("demandeurs")->with("message", "Dossier introuvable");
        }
        $demandeurs = $dossier->demandeurs->toArray();

        return Inertia::render('demandeurs/index', [
            'demandeurs' => $demandeurs,
            'dossiers' => $dossier,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id_dossier, $id_demandeur)
    {
        return Inertia::render('demandeurs/update', [
            'demandeur' => Demandeur::find($id_demandeur),
            'dossier' => Dossier::find($id_dossier),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $existDemandeur = Demandeur::find($id);
        if (!$existDemandeur) {
            return Redirect::route('demandeurs.index')->with('error', 'Demandeur introuvable.');
        }

        $validateData = $request->validate([
            'titre_demandeur' => 'required|string|max:12',
            'nom_demandeur' => 'required|string|max:40',
            'prenom_demandeur' => 'nullable|string|max:50',
            'date_naissance' => 'required|date|before:-18 years',
            'lieu_naissance' => 'nullable|string|max:100',
            'sexe' => 'nullable',
            'occupation' => 'nullable|string|max:30',
            'nom_pere' => 'nullable|string',
            'nom_mere' => 'nullable|string',
            'cin' => ['nullable','numeric', Rule::unique(Demandeur::class)->ignore($id)],
            'date_delivrance' => 'nullable|date|before:today',
            'lieu_delivrance' => 'nullable|string|max:40',
            'date_delivrance_duplicata' => 'nullable|date|before:today',
            'lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'domiciliation' => 'nullable|string|max:60',
            'situation_familiale' => 'nullable|string|max:40',
            'regime_matrimoniale' => 'nullable|string|max:40',
            'telephone' => 'nullable|string|max:10',
            'date_mariage' => 'nullable|date|before:today',
            'lieu_mariage' => 'nullable|string|max:40',
            'marie_a' => 'nullable|string|max:40',
            'nationalite' => 'nullable|string|max:40',
            'pieces.*' => 'nullable|file',
            'id_dossier' => 'required|exists:dossiers,id',
        ], [
            'titre_demandeur.required' => 'Le titre est obligatoire.',
            'nom_demandeur.required' => 'Le nom est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans.',
            'cin.nullable' => 'Le numéro CIN est obligatoire.',
            'cin.unique' => 'Le numéro CIN est déjà pris.',
        ]);

        try {
            $existDemandeur->update(
                collect($validateData)->except(['id_dossier'])->toArray()
            );
            return redirect::route('dossiers.show', $request->id_dossier)->with('success', 'Demandeur modifié avec succès');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }
    
    public function exist($id)
    {
        return Inertia::render('demandeurs/exist', [
            'dossier' => Dossier::find($id),
        ]);
    }
    
    public function searchCin(Request $request)
    {
        $demandeur = Demandeur::where('cin', $request->get('cin'))->first();
        $dossier = Dossier::find($request->id_dossier);

        if (!$demandeur){
            return back()->with('message', 'Aucun demandeur ne correspond à ce CIN');
        }

        $contenir = Contenir::where('id_demandeur', $demandeur->id)
            ->where('id_dossier', $dossier->id)
            ->exists();
        if($contenir) {
            return to_route('dossiers.demandeurs', $dossier->id)->with('message', 'Le demandeur existe déjà dans le dossier');
        }else{
            return Inertia::render('demandeurs/createExist', [
                'demandeur' => $demandeur,
                'dossier' => $dossier,
            ]);
        }
    }
    
    public function storeExist(Request $request)
    {
        $contenir = Contenir::create(
            $request->only(['id_dossier', 'id_demandeur'])
        );

        return to_route('dossiers.demandeurs', $request->id_dossier)->with('message', 'Demandeur existant bien ajouté!');
    }
    
    /**
     * Remove the specified resource from the dossier only
     */
    public function destroy($id_dossier, $id_demandeur)
    {
        try {
            Log::info('Tentative de retirer du dossier', [
                'id_dossier' => $id_dossier,
                'id_demandeur' => $id_demandeur
            ]);

            DB::beginTransaction();

            // ✅ Vérifier si le demandeur a des propriétés DANS CE DOSSIER (actives OU archivées)
            $proprietesDansDossier = Demander::where('id_demandeur', (int)$id_demandeur)
                ->whereHas('propriete', function($q) use ($id_dossier) {
                    $q->where('id_dossier', $id_dossier);
                })
                ->with('propriete')
                ->get();

            if ($proprietesDansDossier->count() > 0) {
                $lots = $proprietesDansDossier->pluck('propriete.lot')->toArray();
                $lotsStr = implode(', ', $lots);
                
                $actives = $proprietesDansDossier->where('status', 'active')->count();
                $archivees = $proprietesDansDossier->where('status', 'archive')->count();
                
                $message = "❌ Impossible de retirer ce demandeur du dossier. Il est associé à {$proprietesDansDossier->count()} propriété(s) dans ce dossier : Lot(s) {$lotsStr}.";
                
                if ($actives > 0) {
                    $message .= " ({$actives} active(s))";
                }
                if ($archivees > 0) {
                    $message .= " ({$archivees} archivée(s))";
                }
                
                $message .= ". Veuillez d'abord dissocier le demandeur de toutes ces propriétés.";
                
                Log::warning('Impossible de retirer du dossier - propriétés liées', [
                    'demandeur_id' => $id_demandeur,
                    'proprietes_count' => $proprietesDansDossier->count(),
                    'actives' => $actives,
                    'archivees' => $archivees,
                    'lots' => $lots
                ]);

                DB::rollBack();
                
                return redirect()->route('dossiers.show', $id_dossier)
                    ->with('error', $message);
            }

            // Si pas de propriétés, on peut supprimer
            $contenir = Contenir::where('id_dossier', (int)$id_dossier)
                ->where('id_demandeur', (int)$id_demandeur)
                ->first();

            if (!$contenir) {
                Log::warning('Relation contenir introuvable');
                DB::rollBack();
                return redirect()->route('dossiers.show', $id_dossier)
                    ->with('error', 'Demandeur introuvable dans ce dossier.');
            }
            
            $deleted = $contenir->delete();
            
            Log::info('Demandeur retiré du dossier', [
                'deleted' => $deleted,
                'contenir_id' => $contenir->id
            ]);

            DB::commit();
            
            return redirect()->route('dossiers.show', $id_dossier)
                ->with('success', 'Demandeur retiré du dossier avec succès.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la suppression', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('dossiers.show', $id_dossier)
                ->with('error', 'Erreur lors de la suppression : ' . $e->getMessage());
        }
    }
    
    /**
     * Remove the demandeur definitively from the database
     */
    public function destroyDefinitive($id_demandeur)
    {
        try {
            Log::info('Tentative de suppression définitive', [
                'id_demandeur' => $id_demandeur,
                'type' => gettype($id_demandeur)
            ]);

            DB::beginTransaction();
            
            $demandeur = Demandeur::find((int)$id_demandeur);
            
            if (!$demandeur) {
                DB::rollBack();
                Log::warning('Demandeur introuvable');
                return back()->with('error', 'Demandeur introuvable.');
            }
            
            // ✅ Vérifier TOUTES les propriétés liées DANS TOUS LES DOSSIERS (actives ET archivées)
            $proprietesToutes = Demander::where('id_demandeur', (int)$id_demandeur)
                ->with(['propriete', 'propriete.dossier'])
                ->get();
            
            if ($proprietesToutes->count() > 0) {
                // Grouper par dossier
                $parDossier = [];
                foreach ($proprietesToutes as $demande) {
                    $dossierNom = $demande->propriete->dossier->nom_dossier ?? 'Inconnu';
                    if (!isset($parDossier[$dossierNom])) {
                        $parDossier[$dossierNom] = ['actives' => [], 'archivees' => []];
                    }
                    
                    if ($demande->status === 'active') {
                        $parDossier[$dossierNom]['actives'][] = $demande->propriete->lot;
                    } else {
                        $parDossier[$dossierNom]['archivees'][] = $demande->propriete->lot;
                    }
                }
                
                $message = "❌ Impossible de supprimer définitivement ce demandeur. Il est associé à des propriétés dans " . count($parDossier) . " dossier(s) :\n\n";
                
                foreach ($parDossier as $dossier => $lots) {
                    $message .= "📁 {$dossier} :\n";
                    if (!empty($lots['actives'])) {
                        $message .= "  • Propriétés actives : Lot(s) " . implode(', ', $lots['actives']) . "\n";
                    }
                    if (!empty($lots['archivees'])) {
                        $message .= "  • Propriétés archivées : Lot(s) " . implode(', ', $lots['archivees']) . "\n";
                    }
                }
                
                $message .= "\nVeuillez d'abord dissocier le demandeur de TOUTES ces propriétés.";
                
                Log::warning('Suppression définitive impossible - propriétés liées', [
                    'demandeur_id' => $id_demandeur,
                    'proprietes_count' => $proprietesToutes->count(),
                    'dossiers_count' => count($parDossier),
                    'par_dossier' => $parDossier
                ]);

                DB::rollBack();
                return back()->with('error', $message);
            }
            
            // Compter les relations contenir
            $contenir_count = Contenir::where('id_demandeur', (int)$id_demandeur)->count();
            Log::info('Relations contenir trouvées', ['count' => $contenir_count]);
            
            // Supprimer toutes les relations dans la table contenir
            $deleted_contenir = Contenir::where('id_demandeur', (int)$id_demandeur)->delete();
            Log::info('Relations contenir supprimées', ['count' => $deleted_contenir]);
            
            // Supprimer le demandeur
            $deleted_demandeur = $demandeur->delete();
            Log::info('Demandeur supprimé', ['result' => $deleted_demandeur]);
            
            DB::commit();
            
            return back()->with('success', 'Demandeur supprimé définitivement avec succès.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la suppression définitive', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Erreur lors de la suppression : ' . $e->getMessage());
        }
    }

}