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
use Illuminate\Support\Facades\Validator;
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
        'titre_demandeur' => 'required|string|max:15', 
        'nom_demandeur' => 'required|string|max:40',
        'prenom_demandeur' => 'required|string|max:50',
        'date_naissance' => 'required|date|before:-18 years',
        'lieu_naissance' => 'nullable|string|max:100',
        'sexe' => 'nullable|string|max:10',
        'occupation' => 'nullable|string|max:30',
        'nom_pere' => 'nullable|string',
        'nom_mere' => 'nullable|string',
        'cin' => 'required|string|size:12|unique:' . Demandeur::class, 
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
        'titre_demandeur.required' => 'Le titre de civilité est obligatoire.',
        'titre_demandeur.max' => 'Le titre de civilité est trop long.',
        'nom_demandeur.required' => 'Le nom est obligatoire.',
        'prenom_demandeur.required' => 'Le prénom est obligatoire.',
        'date_naissance.required' => 'La date de naissance est obligatoire.',
        'date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans.',
        'cin.required' => 'Le numéro CIN est obligatoire.',
        'cin.size' => 'Le CIN doit contenir exactement 12 chiffres.',
        'cin.unique' => 'Le numéro CIN est déjà utilisé.',
        'id_dossier.required' => 'Le dossier est obligatoire.',
    ]);

    try {
        $request->merge(['id_user' => Auth::id()]);
        $demandeur = Demandeur::create(
            $request->except(['_token', 'id_dossier']),
        );
        
        Contenir::create([
            'id_demandeur' => $demandeur->id,
            'id_dossier' => $request->id_dossier,
        ]);

        return Redirect::route('dossiers.show', $request->id_dossier)
            ->with('success', 'Demandeur ajouté avec succès');
    } catch (\Exception $e) {
       Log::error('Erreur création demandeur', [
            'error' => $e->getMessage(),
            'data' => $request->all()
        ]);
        return back()->with('error', 'Une erreur est survenue : ' . $e->getMessage());
    }
}

    /**
     * NOUVEAU : Créer plusieurs demandeurs à la fois
     */
    public function storeMultiple(Request $request)
    {
        $demandeurs = is_string($request->demandeurs) 
            ? json_decode($request->demandeurs, true) 
            : $request->demandeurs;

        $validated = $request->validate([
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        // Validation de base
        $validator = Validator::make(['demandeurs' => $demandeurs], [
            'demandeurs' => 'required|array|min:1',
            'demandeurs.*.titre_demandeur' => 'required|string|max:15',
            'demandeurs.*.nom_demandeur' => 'required|string|max:40',
            'demandeurs.*.prenom_demandeur' => 'required|string|max:50',
            'demandeurs.*.date_naissance' => 'required|date|before:-18 years',
            'demandeurs.*.cin' => 'required|string|size:12',
            
            // Champs optionnels
            'demandeurs.*.lieu_naissance' => 'nullable|string|max:100',
            'demandeurs.*.sexe' => 'nullable|string|max:10',
            'demandeurs.*.occupation' => 'nullable|string|max:30',
            'demandeurs.*.nom_pere' => 'nullable|string',
            'demandeurs.*.nom_mere' => 'nullable|string',
            'demandeurs.*.date_delivrance' => 'nullable|date|before:today',
            'demandeurs.*.lieu_delivrance' => 'nullable|string|max:40',
            'demandeurs.*.date_delivrance_duplicata' => 'nullable|date|before:today',
            'demandeurs.*.lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'demandeurs.*.domiciliation' => 'nullable|string|max:60',
            'demandeurs.*.nationalite' => 'nullable|string|max:40',
            'demandeurs.*.situation_familiale' => 'nullable|string|max:40',
            'demandeurs.*.regime_matrimoniale' => 'nullable|string|max:40',
            'demandeurs.*.date_mariage' => 'nullable|date|before:today',
            'demandeurs.*.lieu_mariage' => 'nullable|string|max:40',
            'demandeurs.*.marie_a' => 'nullable|string|max:40',
            'demandeurs.*.telephone' => 'nullable|string|max:10',
        ], [
            // Messages d'erreur personnalisés
            'demandeurs.*.titre_demandeur.required' => 'Le titre de civilité est obligatoire (demandeur :position).',
            'demandeurs.*.titre_demandeur.max' => 'Le titre de civilité est trop long (demandeur :position).',
            'demandeurs.*.nom_demandeur.required' => 'Le nom est obligatoire (demandeur :position).',
            'demandeurs.*.nom_demandeur.max' => 'Le nom est trop long (demandeur :position).',
            'demandeurs.*.prenom_demandeur.required' => 'Le prénom est obligatoire (demandeur :position).',
            'demandeurs.*.prenom_demandeur.max' => 'Le prénom est trop long (demandeur :position).',
            'demandeurs.*.date_naissance.required' => 'La date de naissance est obligatoire (demandeur :position).',
            'demandeurs.*.date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans (demandeur :position).',
            'demandeurs.*.cin.required' => 'Le CIN est obligatoire (demandeur :position).',
            'demandeurs.*.cin.size' => 'Le CIN doit contenir exactement 12 chiffres (demandeur :position).',
            'demandeurs.*.date_delivrance.before' => 'La date de délivrance doit être antérieure à aujourd\'hui.',
            'demandeurs.*.date_delivrance_duplicata.before' => 'La date de délivrance du duplicata doit être antérieure à aujourd\'hui.',
            'demandeurs.*.date_mariage.before' => 'La date de mariage doit être antérieure à aujourd\'hui.',
            'demandeurs.*.telephone.max' => 'Le numéro de téléphone ne peut pas dépasser 10 caractères.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        // Vérifier les doublons de CIN dans la requête
        $cins = array_column($demandeurs, 'cin');
        if (count($cins) !== count(array_unique($cins))) {
            return back()->withErrors(['error' => 'Certains CIN sont dupliqués dans le formulaire']);
        }

        DB::beginTransaction();

        try {
            $created = 0;
            $updated = 0;
            
            foreach ($demandeurs as $demandeurData) {
                // Nettoyer les données
                foreach ($demandeurData as $key => $value) {
                    if ($value === '') {
                        $demandeurData[$key] = null;
                    }
                }
                
                $demandeurData['id_user'] = Auth::id();
                
                // Vérifier si le demandeur existe
                $existant = Demandeur::where('cin', $demandeurData['cin'])->first();
                
                if ($existant) {
                    // Mettre à jour
                    $existant->update($demandeurData);
                    $demandeur = $existant;
                    $updated++;
                    
                    Log::info('Demandeur mis à jour', [
                        'id' => $existant->id,
                        'cin' => $existant->cin
                    ]);
                } else {
                    // ✨ Créer
                    $demandeur = Demandeur::create($demandeurData);
                    $created++;
                    
                    Log::info('Demandeur créé', [
                        'id' => $demandeur->id,
                        'cin' => $demandeur->cin
                    ]);
                }
                
                // Ajouter au dossier
                Contenir::firstOrCreate([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $validated['id_dossier'],
                ]);
            }

            DB::commit();

            $message = [];
            if ($created > 0) $message[] = "$created créé(s)";
            if ($updated > 0) $message[] = "$updated mis à jour";
            
            $finalMessage = count($message) > 0 
                ? "Demandeurs traités : " . implode(', ', $message)
                : "Aucune modification";

            return Redirect::route('dossiers.show', $validated['id_dossier'])
                ->with('success', $finalMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur storeMultiple', [
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
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
     *Rechercher un demandeur par CIN
     * Retourne les informations du demandeur si trouvé
     */
    public function searchByCin(Request $request, $cin)
    {
        try {
            // Nettoyer le CIN (enlever espaces, tirets)
            $cleanCin = preg_replace('/[^0-9]/', '', $cin);
            
            // Vérifier que le CIN a exactement 12 chiffres
            if (strlen($cleanCin) !== 12) {
                return response()->json([
                    'found' => false,
                    'message' => 'Le CIN doit contenir exactement 12 chiffres'
                ], 200);
            }
            
            // Rechercher le demandeur
            $demandeur = Demandeur::where('cin', $cleanCin)->first();
            
            if (!$demandeur) {
                return response()->json([
                    'found' => false,
                    'message' => 'Aucun demandeur trouvé avec ce CIN'
                ], 200);
            }
            
            // Retourner les données du demandeur
            return response()->json([
                'found' => true,
                'message' => 'Demandeur trouvé ! Vérifiez et mettez à jour les informations si nécessaire.',
                'demandeur' => [
                    'titre_demandeur' => $demandeur->titre_demandeur,
                    'nom_demandeur' => $demandeur->nom_demandeur,
                    'prenom_demandeur' => $demandeur->prenom_demandeur,
                    'date_naissance' => $demandeur->date_naissance,
                    'lieu_naissance' => $demandeur->lieu_naissance,
                    'sexe' => $demandeur->sexe,
                    'occupation' => $demandeur->occupation,
                    'nom_pere' => $demandeur->nom_pere,
                    'nom_mere' => $demandeur->nom_mere,
                    'date_delivrance' => $demandeur->date_delivrance,
                    'lieu_delivrance' => $demandeur->lieu_delivrance,
                    'date_delivrance_duplicata' => $demandeur->date_delivrance_duplicata,
                    'lieu_delivrance_duplicata' => $demandeur->lieu_delivrance_duplicata,
                    'domiciliation' => $demandeur->domiciliation,
                    'nationalite' => $demandeur->nationalite ?? 'Malagasy',
                    'situation_familiale' => $demandeur->situation_familiale ?? 'Non spécifiée',
                    'regime_matrimoniale' => $demandeur->regime_matrimoniale ?? 'Non spécifié',
                    'date_mariage' => $demandeur->date_mariage,
                    'lieu_mariage' => $demandeur->lieu_mariage,
                    'marie_a' => $demandeur->marie_a,
                    'telephone' => $demandeur->telephone,
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Erreur recherche CIN', [
                'cin' => $cin,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'found' => false,
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
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
        $existDemandeur->load(['piecesJointes' => function($q) {
            $q->orderBy('created_at', 'desc');
        }]);
        if (!$existDemandeur) {
            return Redirect::route('demandeurs.index')->with('error', 'Demandeur introuvable.');
        }

        $validateData = $request->validate([
            'titre_demandeur' => 'required|string|max:15',
            'nom_demandeur' => 'required|string|max:40',
            'prenom_demandeur' => 'required|string|max:50', 
            'date_naissance' => 'required|date|before:-18 years',
            'lieu_naissance' => 'nullable|string|max:100',
            'sexe' => 'nullable|string|max:10',
            'occupation' => 'nullable|string|max:30',
            'nom_pere' => 'nullable|string',
            'nom_mere' => 'nullable|string',
            'cin' => ['required','string', 'size:12', Rule::unique(Demandeur::class)->ignore($id)], 
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
            'prenom_demandeur.required' => 'Le prénom est obligatoire.',
            'nom_demandeur.required' => 'Le nom est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans.',
            'cin.required' => 'Le numéro CIN est obligatoire.',
            'cin.size' => 'Le CIN doit contenir exactement 12 chiffres.',
            'cin.unique' => 'Le numéro CIN est déjà pris.',
        ]);

        try {
            $existDemandeur->update(
                collect($validateData)->except(['id_dossier'])->toArray()
            );
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('success', 'Demandeur modifié avec succès');
        } catch (\Exception $e) {
            Log::error('Erreur modification demandeur', [
                'demandeur_id' => $id,
                'error' => $e->getMessage()
            ]);
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
            return to_route('dossiers.demandeurs', $dossier->id)
                ->with('message', 'Le demandeur existe déjà dans le dossier');
        } else {
            return Inertia::render('demandeurs/createExist', [
                'demandeur' => $demandeur,
                'dossier' => $dossier,
            ]);
        }
    }
    
    public function storeExist(Request $request)
    {
        Contenir::create(
            $request->only(['id_dossier', 'id_demandeur'])
        );

        return to_route('dossiers.demandeurs', $request->id_dossier)
            ->with('message', 'Demandeur existant bien ajouté!');
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

            // Vérifier si le demandeur a des propriétés DANS CE DOSSIER
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
                
                $message = "Impossible de retirer ce demandeur. Il est associé à {$proprietesDansDossier->count()} propriété(s) : Lot(s) {$lotsStr}.";
                
                if ($actives > 0) {
                    $message .= " ({$actives} active(s))";
                }
                if ($archivees > 0) {
                    $message .= " ({$archivees} archivée(s))";
                }
                
                $message .= ". Veuillez d'abord dissocier le demandeur.";
                
                Log::warning('Impossible de retirer - propriétés liées', [
                    'demandeur_id' => $id_demandeur,
                    'proprietes_count' => $proprietesDansDossier->count(),
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
            
            $contenir->delete();

            DB::commit();
            
            return redirect()->route('dossiers.show', $id_dossier)
                ->with('success', 'Demandeur retiré du dossier avec succès.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la suppression', [
                'message' => $e->getMessage(),
            ]);
            
            return redirect()->route('dossiers.show', $id_dossier)
                ->with('error', 'Erreur : ' . $e->getMessage());
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
            ]);

            DB::beginTransaction();
            
            $demandeur = Demandeur::find((int)$id_demandeur);
            
            if (!$demandeur) {
                DB::rollBack();
                Log::warning('Demandeur introuvable');
                return back()->with('error', 'Demandeur introuvable.');
            }
            
            // Vérifier TOUTES les propriétés liées
            $proprietesToutes = Demander::where('id_demandeur', (int)$id_demandeur)
                ->with(['propriete', 'propriete.dossier'])
                ->get();
            
            if ($proprietesToutes->count() > 0) {
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
                
                $message = "Impossible de supprimer. Associé à des propriétés dans " . count($parDossier) . " dossier(s). Dissociez d'abord.";
                
                DB::rollBack();
                return back()->with('error', $message);
            }
            
            // Supprimer les relations contenir
            Contenir::where('id_demandeur', (int)$id_demandeur)->delete();
            
            // Supprimer le demandeur
            $demandeur->delete();
            
            DB::commit();
            
            return back()->with('success', 'Demandeur supprimé définitivement.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression définitive', [
                'message' => $e->getMessage(),
            ]);
            return back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }
}