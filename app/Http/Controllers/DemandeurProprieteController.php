<?php

namespace App\Http\Controllers;

use App\Models\Contenir;
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
        
        // Validation de la propriété - CORRIGÉ: Edilitaire
        $request->validate([
            'lot' => 'required|string|max:15',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietaire' => 'required|string|max:50',
            'situation' => 'required|string',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
        ], [
            'lot.required' => 'Le numéro de lot est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
            'proprietaire.required' => 'Le nom de la propriété est obligatoire',
            'situation.required' => 'La situation est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
        ]);
        
        // Validation manuelle des demandeurs
        foreach ($demandeurs as $index => $demandeur) {
            $num = $index + 1;
            
            if (empty($demandeur['titre_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le titre est obligatoire"]);
            }
            if (empty($demandeur['nom_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le nom est obligatoire"]);
            }
            if (empty($demandeur['cin'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le CIN est obligatoire"]);
            }
            if (!preg_match('/^\d{12}$/', $demandeur['cin'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le CIN doit contenir exactement 12 chiffres"]);
            }
            if (empty($demandeur['date_naissance'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: La date de naissance est obligatoire"]);
            }
            if (empty($demandeur['lieu_naissance'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le lieu de naissance est obligatoire"]);
            }
            if (empty($demandeur['occupation'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: L'occupation est obligatoire"]);
            }
            if (empty($demandeur['nom_mere'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le nom de la mère est obligatoire"]);
            }
            if (empty($demandeur['date_delivrance'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: La date de délivrance du CIN est obligatoire"]);
            }
            if (empty($demandeur['lieu_delivrance'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le lieu de délivrance du CIN est obligatoire"]);
            }
            if (empty($demandeur['domiciliation'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: La domiciliation est obligatoire"]);
            }
            
            // Vérifier l'unicité du CIN
            if (Demandeur::where('cin', $demandeur['cin'])->exists()) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Ce CIN existe déjà"]);
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
                'type_operation' => $request->type_operation,
                'id_dossier' => $request->id_dossier,
                'id_user' => $id_user,
                'status' => true, // Propriété avec demandeurs
            ]);

            // 2. Créer chaque demandeur et le lier à la propriété
            foreach ($demandeurs as $demandeurData) {
                // Créer le demandeur
                $demandeur = Demandeur::create([
                    'titre_demandeur' => $demandeurData['titre_demandeur'],
                    'nom_demandeur' => $demandeurData['nom_demandeur'],
                    'prenom_demandeur' => $demandeurData['prenom_demandeur'] ?? null,
                    'date_naissance' => $demandeurData['date_naissance'],
                    'lieu_naissance' => $demandeurData['lieu_naissance'],
                    'sexe' => $demandeurData['sexe'],
                    'occupation' => $demandeurData['occupation'],
                    'nom_pere' => $demandeurData['nom_pere'] ?: null,
                    'nom_mere' => $demandeurData['nom_mere'],
                    'cin' => $demandeurData['cin'],
                    'date_delivrance' => $demandeurData['date_delivrance'],
                    'lieu_delivrance' => $demandeurData['lieu_delivrance'],
                    'date_delivrance_duplicata' => $demandeurData['date_delivrance_duplicata'] ?: null,
                    'lieu_delivrance_duplicata' => $demandeurData['lieu_delivrance_duplicata'] ?: null,
                    'domiciliation' => $demandeurData['domiciliation'],
                    'nationalite' => $demandeurData['nationalite'] ?: 'Malagasy',
                    'situation_familiale' => $demandeurData['situation_familiale'] ?: 'Non spécifiée',
                    'regime_matrimoniale' => $demandeurData['regime_matrimoniale'] ?: 'Non spécifié',
                    'date_mariage' => $demandeurData['date_mariage'] ?: null,
                    'lieu_mariage' => $demandeurData['lieu_mariage'] ?: null,
                    'marie_a' => $demandeurData['marie_a'] ?: null,
                    'telephone' => $demandeurData['telephone'] ?: null,
                    'id_user' => $id_user,
                ]);

                // Ajouter le demandeur au dossier (table contenir)
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $request->id_dossier,
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
    public function addToProperty($id, $id_propriete = null)
    {
        $dossier = Dossier::with('proprietes')->findOrFail($id);
        
        return Inertia::render('DemandeursProprietes/AjouterDemandeur', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'id_propriete' => $id_propriete,
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
            $propriete = Propriete::findOrFail($request->id_propriete);
            
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
                
                // Ajouter au dossier s'il n'y est pas encore
                $existeInDossier = Contenir::where('id_demandeur', $demandeur->id)
                    ->where('id_dossier', $propriete->id_dossier)
                    ->exists();
                    
                if (!$existeInDossier) {
                    Contenir::create([
                        'id_demandeur' => $demandeur->id,
                        'id_dossier' => $propriete->id_dossier,
                    ]);
                }
                
            } else {
                // Créer nouveau demandeur
                $request->validate([
                    'titre_demandeur' => 'required|string|max:12',
                    'nom_demandeur' => 'required|string|max:40',
                    'cin' => 'required|string|size:12|unique:demandeurs,cin',
                    'date_naissance' => 'required|date|before:-18 years',
                    'lieu_naissance' => 'required|string|max:100',
                    'occupation' => 'required|string|max:30',
                    'nom_mere' => 'required|string',
                    'date_delivrance' => 'required|date|before:today',
                    'lieu_delivrance' => 'required|string|max:40',
                    'domiciliation' => 'required|string|max:60',
                    'situation_familiale' => 'required|string|max:40',
                    'nationalite' => 'required|string|max:40',
                ], [
                    'cin.size' => 'Le CIN doit contenir exactement 12 chiffres',
                    'date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans',
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
                    'nationalite' => $request->nationalite,
                    'situation_familiale' => $request->situation_familiale,
                    'regime_matrimoniale' => $request->regime_matrimoniale,
                    'date_mariage' => $request->date_mariage,
                    'lieu_mariage' => $request->lieu_mariage,
                    'marie_a' => $request->marie_a,
                    'telephone' => $request->telephone,
                    'id_user' => $id_user,
                ]);
                
                // Ajouter au dossier
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $propriete->id_dossier,
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
                'status_consort' => $demandeursCount > 0,
                'total_prix' => 0,
            ]);

            // Mettre à jour le status de la propriété
            Propriete::where('id', $request->id_propriete)->update(['status' => true]);

            DB::commit();
            
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
    public function linkExisting($id, $id_demandeur = null, $id_propriete = null)
    {
        $dossier = Dossier::with(['proprietes', 'demandeurs'])->findOrFail($id);
        
        $demandeur = null;
        if ($id_demandeur) {
            $demandeur = Demandeur::find($id_demandeur);
        }
        
        return Inertia::render('DemandeursProprietes/LierExistant', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'demandeur' => $demandeur,
            'id_propriete' => $id_propriete,
        ]);
    }

    /**
     * 3. LIER EXISTANT : Rechercher le demandeur par CIN ou Nom
     */
    public function searchToLink(Request $request)
    {
        $request->validate([
            'cin' => 'required|string',
            'id_dossier' => 'required|exists:dossiers,id'
        ]);
        
        $demandeur = null;
        
        if (preg_match('/^\d{12}$/', $request->cin)) {
            $demandeur = Demandeur::where('cin', $request->cin)->first();
        } else {
            $demandeur = Demandeur::where('nom_demandeur', 'ilike', '%' . $request->cin . '%')
                ->orWhere('prenom_demandeur', 'ilike', '%' . $request->cin . '%')
                ->first();
        }
        
        $dossier = Dossier::with(['proprietes', 'demandeurs'])->findOrFail($request->id_dossier);
        
        if (!$demandeur) {
            return Inertia::render('DemandeursProprietes/LierExistant', [
                'dossier' => $dossier,
                'proprietes' => $dossier->proprietes,
                'demandeur' => null,
                'cin_search' => $request->cin,
            ]);
        }
        
        $existeInDossier = Contenir::where('id_demandeur', $demandeur->id)
            ->where('id_dossier', $dossier->id)
            ->exists();
            
        if (!$existeInDossier) {
            Contenir::create([
                'id_demandeur' => $demandeur->id,
                'id_dossier' => $dossier->id,
            ]);
        }
        
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
            'id_propriete' => 'required|exists:proprietes,id',
            'mode' => 'required|in:existant,nouveau',
        ]);

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            
            if ($request->mode === 'nouveau') {
                $request->validate([
                    'titre_demandeur' => 'required|string|max:12',
                    'nom_demandeur' => 'required|string|max:40',
                    'cin' => 'required|string|size:12|unique:demandeurs,cin',
                    'date_naissance' => 'required|date|before:-18 years',
                    'lieu_naissance' => 'required|string|max:100',
                    'occupation' => 'required|string|max:30',
                    'nom_mere' => 'required|string',
                    'date_delivrance' => 'required|date|before:today',
                    'lieu_delivrance' => 'required|string|max:40',
                    'domiciliation' => 'required|string|max:60',
                    'situation_familiale' => 'required|string|max:40',
                    'nationalite' => 'required|string|max:40',
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
                    'nationalite' => $request->nationalite,
                    'situation_familiale' => $request->situation_familiale,
                    'regime_matrimoniale' => $request->regime_matrimoniale,
                    'date_mariage' => $request->date_mariage,
                    'lieu_mariage' => $request->lieu_mariage,
                    'marie_a' => $request->marie_a,
                    'telephone' => $request->telephone,
                    'id_user' => $id_user,
                ]);
                
                $propriete = Propriete::findOrFail($request->id_propriete);
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $request->id_dossier,
                ]);
                
                $id_demandeur = $demandeur->id;
            } else {
                $request->validate(['id_demandeur' => 'required|exists:demandeurs,id']);
                $id_demandeur = $request->id_demandeur;
            }

            $existingLink = Demander::where('id_demandeur', $id_demandeur)
                ->where('id_propriete', $request->id_propriete)
                ->exists();
                
            if ($existingLink) {
                return back()->withErrors(['error' => 'Ce demandeur est déjà lié à cette propriété']);
            }

            $demandeursCount = Demander::where('id_propriete', $request->id_propriete)->count();
            
            Demander::create([
                'id_demandeur' => $id_demandeur,
                'id_propriete' => $request->id_propriete,
                'id_user' => $id_user,
                'status' => 'active',
                'status_consort' => $demandeursCount > 0,
                'total_prix' => 0,
            ]);

            Propriete::where('id', $request->id_propriete)->update(['status' => true]);

            DB::commit();

            $propriete = Propriete::find($request->id_propriete);
            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('message', 'Demandeur lié à la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }
}