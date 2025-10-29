<?php

namespace App\Http\Controllers;

use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\Dossier;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class DemandeurProprieteController extends Controller
{
    /**
     * 1. NOUVEAU LOT : Afficher le formulaire pour créer Propriété + Demandeurs
     */
    public function create($id)
    {
        $dossier = Dossier::findOrFail($id);
        
        return Inertia::render('DemandeursProprietes/NouveauLot', [
            'dossier' => $dossier,
        ]);
    }

    /**
     * 1. NOUVEAU LOT : Enregistrer le nouveau lot (propriété + demandeurs)
     */
    public function store(Request $request)
    {
        // Décoder le JSON des demandeurs
        $demandeurs = json_decode($request->demandeurs_json, true);
        
        if (!$demandeurs || !is_array($demandeurs) || count($demandeurs) === 0) {
            return back()->withErrors(['demandeurs' => 'Au moins un demandeur est requis']);
        }
        
        // Validation de la propriété
        $request->validate([
            'lot' => 'required|string|max:15',
            'nature' => 'nullable|string|max:40',
            'vocation' => 'nullable|in:Editaire,Agricole,Forestière,Touristique',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
        ], [
            'lot.required' => 'Le numéro de lot est obligatoire',
        ]);
        
        // Validation manuelle des demandeurs
        foreach ($demandeurs as $index => $demandeur) {
            if (empty($demandeur['nom_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur " . ($index + 1) . ": Le nom est obligatoire"]);
            }
            if (empty($demandeur['cin'])) {
                return back()->withErrors(['demandeurs' => "Demandeur " . ($index + 1) . ": Le CIN est obligatoire"]);
            }
            if (empty($demandeur['titre_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur " . ($index + 1) . ": Le titre de civilité est obligatoire"]);
            }
            // Vérifier l'unicité du CIN
            if (Demandeur::where('cin', $demandeur['cin'])->exists()) {
                return back()->withErrors(['demandeurs' => "Demandeur " . ($index + 1) . ": Ce CIN existe déjà"]);
            }
        }

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            
            // 1. Créer la propriété
            $propriete = Propriete::create([
                'lot' => $request->lot,
                'propriete_mere' => $request->propriete_mere,
                'titre_mere' => $request->titre_mere,
                'titre' => $request->titre,
                'proprietaire' => $request->proprietaire,
                'contenance' => $request->contenance,
                'charge' => $request->charge,
                'situation' => $request->situation,
                'nature' => $request->nature,
                'vocation' => $request->vocation,
                'numero_FN' => $request->numero_FN,
                'numero_requisition' => $request->numero_requisition,
                'date_requisition' => $request->date_requisition,
                'date_inscription' => $request->date_inscription,
                'dep_vol' => $request->dep_vol,
                'id_dossier' => $request->id_dossier,
                'id_user' => $id_user,
            ]);

            // 2. Créer chaque demandeur et le lier à la propriété
            foreach ($demandeurs as $demandeurData) {
                // Créer le demandeur
                $demandeur = Demandeur::create([
                    'titre_demandeur' => $demandeurData['titre_demandeur'],
                    'nom_demandeur' => $demandeurData['nom_demandeur'],
                    'prenom_demandeur' => $demandeurData['prenom_demandeur'] ?? null,
                    'date_naissance' => $demandeurData['date_naissance'] ?: null,
                    'lieu_naissance' => $demandeurData['lieu_naissance'] ?: null,
                    'sexe' => $demandeurData['sexe'],
                    'occupation' => $demandeurData['occupation'] ?: null,
                    'nom_pere' => $demandeurData['nom_pere'] ?: null,
                    'nom_mere' => $demandeurData['nom_mere'] ?: null,
                    'cin' => $demandeurData['cin'],
                    'date_delivrance' => $demandeurData['date_delivrance'] ?: null,
                    'lieu_delivrance' => $demandeurData['lieu_delivrance'] ?: null,
                    'date_delivrance_duplicata' => $demandeurData['date_delivrance_duplicata'] ?: null,
                    'lieu_delivrance_duplicata' => $demandeurData['lieu_delivrance_duplicata'] ?: null,
                    'domiciliation' => $demandeurData['domiciliation'] ?: null,
                    'nationalite' => $demandeurData['nationalite'] ?: 'Malagasy',
                    'situation_familiale' => $demandeurData['situation_familiale'] ?: 'Non spécifiée',
                    'regime_matrimoniale' => $demandeurData['regime_matrimoniale'] ?: null,
                    'date_mariage' => $demandeurData['date_mariage'] ?: null,
                    'lieu_mariage' => $demandeurData['lieu_mariage'] ?: null,
                    'marie_a' => $demandeurData['marie_a'] ?: null,
                    'telephone' => $demandeurData['telephone'] ?: null,
                    'id_user' => $id_user,
                ]);

                // Lier le demandeur à la propriété dans la table 'demander'
                Demander::create([
                    'id_demandeur' => $demandeur->id,
                    'id_propriete' => $propriete->id,
                    'id_user' => $id_user,
                    'status' => 'active',
                    'status_consort' => count($demandeurs) > 1,
                    'total_prix' => 0, // À calculer ultérieurement
                ]);
            }

            DB::commit();
            
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('message', count($demandeurs) . ' demandeur(s) et propriété créés avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur lors de la création : ' . $e->getMessage()]);
        }
    }

    /**
     * 2. AJOUTER DEMANDEUR : Afficher la liste des propriétés pour ajouter un demandeur
     */
    public function addToProperty($id)
    {
        $dossier = Dossier::with('proprietes')->findOrFail($id);
        
        return Inertia::render('DemandeursProprietes/AjouterDemandeur', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
        ]);
    }

    /**
     * 2. AJOUTER DEMANDEUR : Enregistrer le nouveau demandeur pour une propriété existante
     */
    public function storeToProperty(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'mode' => 'required|in:nouveau,existant',
        ]);

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            
            if ($request->mode === 'existant') {
                // Rechercher le demandeur par CIN
                $request->validate(['cin' => 'required|exists:demandeurs,cin']);
                $demandeur = Demandeur::where('cin', $request->cin)->firstOrFail();
                
                // Vérifier s'il n'est pas déjà lié à cette propriété
                $existingLink = Demander::where('id_demandeur', $demandeur->id)
                    ->where('id_propriete', $request->id_propriete)
                    ->exists();
                    
                if ($existingLink) {
                    return back()->withErrors(['cin' => 'Ce demandeur est déjà lié à cette propriété']);
                }
            } else {
                // Créer nouveau demandeur
                $request->validate([
                    'titre_demandeur' => 'required|string|max:20',
                    'nom_demandeur' => 'required|string|max:100',
                    'cin' => 'required|string|max:15|unique:demandeurs,cin',
                ]);
                
                $demandeur = Demandeur::create([
                    'titre_demandeur' => $request->titre_demandeur,
                    'nom_demandeur' => $request->nom_demandeur,
                    'prenom_demandeur' => $request->prenom_demandeur,
                    'date_naissance' => $request->date_naissance,
                    'lieu_naissance' => $request->lieu_naissance,
                    'sexe' => $request->sexe,
                    'occupation' => $request->occupation,
                    'nom_pere' => $request->nom_pere,
                    'nom_mere' => $request->nom_mere,
                    'cin' => $request->cin,
                    'date_delivrance' => $request->date_delivrance,
                    'lieu_delivrance' => $request->lieu_delivrance,
                    'date_delivrance_duplicata' => $request->date_delivrance_duplicata,
                    'lieu_delivrance_duplicata' => $request->lieu_delivrance_duplicata,
                    'domiciliation' => $request->domiciliation,
                    'nationalite' => $request->nationalite ?? 'Malagasy',
                    'situation_familiale' => $request->situation_familiale ?? 'Non spécifiée',
                    'regime_matrimoniale' => $request->regime_matrimoniale,
                    'date_mariage' => $request->date_mariage,
                    'lieu_mariage' => $request->lieu_mariage,
                    'marie_a' => $request->marie_a,
                    'telephone' => $request->telephone,
                    'id_user' => $id_user,
                ]);
            }

            // Compter les demandeurs existants pour cette propriété
            $demandeursCount = Demander::where('id_propriete', $request->id_propriete)->count();
            
            // Lier le demandeur à la propriété
            Demander::create([
                'id_demandeur' => $demandeur->id,
                'id_propriete' => $request->id_propriete,
                'id_user' => $id_user,
                'status' => 'active',
                'status_consort' => $demandeursCount > 0, // C'est un consort s'il y a déjà des demandeurs
                'total_prix' => 0,
            ]);

            DB::commit();
            
            $propriete = Propriete::find($request->id_propriete);
            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('message', 'Demandeur ajouté à la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * 3. LIER EXISTANT : Afficher le formulaire pour lier un demandeur existant
     */
    public function linkExisting($id)
    {
        $dossier = Dossier::with('proprietes')->findOrFail($id);
        
        return Inertia::render('DemandeursProprietes/LierExistant', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
        ]);
    }

    /**
     * 3. LIER EXISTANT : Rechercher le demandeur par CIN
     */
    public function searchToLink(Request $request)
    {
        $request->validate(['cin' => 'required|string|max:15']);
        
        $demandeur = Demandeur::where('cin', $request->cin)->first();
        
        if (!$demandeur) {
            return back()->withErrors(['cin' => 'Aucun demandeur trouvé avec ce CIN']);
        }
        
        $dossier = Dossier::with('proprietes')->findOrFail($request->id_dossier);
        
        return Inertia::render('DemandeursProprietes/LierExistant', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'demandeur' => $demandeur,
            'cin_search' => $request->cin,
        ]);
    }

    /**
     * 3. LIER EXISTANT : Enregistrer le lien entre demandeur et propriété existants
     */
    public function storeLink(Request $request)
    {
        $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        // Vérifier si le lien n'existe pas déjà
        $existingLink = Demander::where('id_demandeur', $request->id_demandeur)
            ->where('id_propriete', $request->id_propriete)
            ->exists();
            
        if ($existingLink) {
            return back()->withErrors(['error' => 'Ce demandeur est déjà lié à cette propriété']);
        }

        try {
            // Compter les demandeurs existants pour cette propriété
            $demandeursCount = Demander::where('id_propriete', $request->id_propriete)->count();
            
            Demander::create([
                'id_demandeur' => $request->id_demandeur,
                'id_propriete' => $request->id_propriete,
                'id_user' => Auth::id(),
                'status' => 'active',
                'status_consort' => $demandeursCount > 0,
                'total_prix' => 0,
            ]);

            $propriete = Propriete::find($request->id_propriete);
            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('message', 'Demandeur lié à la propriété avec succès');
                
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }
}