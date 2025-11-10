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
        $demandeurs = json_decode($request->demandeurs_json, true);
        
        if (!$demandeurs || !is_array($demandeurs) || count($demandeurs) === 0) {
            return back()->withErrors(['demandeurs' => 'Au moins un demandeur est requis']);
        }
        
        // ✅ Validation minimale de la propriété
        $request->validate([
            'lot' => 'required|string|max:15',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            'proprietaire' => 'nullable|string|max:50',
            'situation' => 'nullable|string',
        ], [
            'lot.required' => 'Le numéro de lot est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'vocation.required' => 'La vocation est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
        ]);
        
        // ✅ Validation minimale des demandeurs
        foreach ($demandeurs as $index => $demandeur) {
            $num = $index + 1;
            
            if (empty($demandeur['titre_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le titre est obligatoire"]);
            }
            if (empty($demandeur['nom_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le nom est obligatoire"]);
            }
            if (empty($demandeur['date_naissance'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: La date de naissance est obligatoire"]);
            }
            if (empty($demandeur['cin'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le CIN est obligatoire"]);
            }
            if (!preg_match('/^\d{12}$/', $demandeur['cin'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le CIN doit contenir exactement 12 chiffres"]);
            }
            
            // Vérifier l'unicité du CIN
            if (Demandeur::where('cin', $demandeur['cin'])->exists()) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Ce CIN existe déjà"]);
            }
        }

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            
            // ✅ Création de la propriété
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
                'status' => true,
            ]);

            // ✅ Création des demandeurs
            foreach ($demandeurs as $demandeurData) {

                // 🧹 Étape importante : nettoyer les champs vides avant l’insertion
                foreach ($demandeurData as $key => $value) {
                    if ($value === '') {
                        $demandeurData[$key] = null;
                    }
                }

                // 🔹 Création du demandeur proprement
                $demandeur = Demandeur::create([
                    'titre_demandeur' => $demandeurData['titre_demandeur'],
                    'nom_demandeur' => $demandeurData['nom_demandeur'],
                    'prenom_demandeur' => $demandeurData['prenom_demandeur'] ?? null,
                    'date_naissance' => $demandeurData['date_naissance'],
                    'lieu_naissance' => $demandeurData['lieu_naissance'] ?? null,
                    'sexe' => $demandeurData['sexe'] ?? null,
                    'occupation' => $demandeurData['occupation'] ?? null,
                    'nom_pere' => $demandeurData['nom_pere'] ?? null,
                    'nom_mere' => $demandeurData['nom_mere'] ?? null,
                    'cin' => $demandeurData['cin'],
                    'date_delivrance' => $demandeurData['date_delivrance'] ?? null,
                    'lieu_delivrance' => $demandeurData['lieu_delivrance'] ?? null,
                    'date_delivrance_duplicata' => $demandeurData['date_delivrance_duplicata'] ?? null,
                    'lieu_delivrance_duplicata' => $demandeurData['lieu_delivrance_duplicata'] ?? null,
                    'domiciliation' => $demandeurData['domiciliation'] ?? null,
                    'nationalite' => $demandeurData['nationalite'] ?? 'Malagasy',
                    'situation_familiale' => $demandeurData['situation_familiale'] ?? 'Non spécifiée',
                    'regime_matrimoniale' => $demandeurData['regime_matrimoniale'] ?? 'Non spécifié',
                    'date_mariage' => $demandeurData['date_mariage'] ?? null,
                    'lieu_mariage' => $demandeurData['lieu_mariage'] ?? null,
                    'marie_a' => $demandeurData['marie_a'] ?? null,
                    'telephone' => $demandeurData['telephone'] ?? null,
                    'id_user' => $id_user,
                ]);

                // 🔹 Liaisons intermédiaires
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $request->id_dossier,
                ]);

                Demander::create([
                    'id_demandeur' => $demandeur->id,
                    'id_propriete' => $propriete->id,
                    'id_user' => $id_user,
                    'status' => 'active',
                    'status_consort' => count($demandeurs) > 1,
                    'total_prix' => 0,
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


    private function getBlockedActionMessage(Propriete $propriete, string $action): string
    {
        return "Impossible d'effectuer l'action \"{$action}\" sur la propriété \"{$propriete->nom}\" car elle est archivée.";
    }


    

    /**
     * ✅ MODIFIÉ : Lier existant avec vérification
     */
    public function linkExisting($id, $id_demandeur = null, $id_propriete = null)
    {
        $dossier = Dossier::with(['proprietes', 'demandeurs'])->findOrFail($id);
        
        // ✅ Si une propriété est pré-sélectionnée, vérifier si elle est archivée
        if ($id_propriete) {
            $propriete = Propriete::findOrFail($id_propriete);
            if ($this->isPropertyArchived($propriete)) {
                return Redirect::route('dossiers.show', $dossier->id)
                    ->with('error', $this->getBlockedActionMessage($propriete, 'liaison de demandeur'));
            }
        }
        
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

    public function storeLink(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'mode' => 'required|in:existant,nouveau',
        ]);

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            $propriete = Propriete::findOrFail($request->id_propriete);
            
            // ✅ Bloquer si archivée
            if ($this->isPropertyArchived($propriete)) {
                DB::rollBack();
                return back()->with('error', $this->getBlockedActionMessage($propriete, 'liaison de demandeur'));
            }
            
            // ... reste du code (identique à storeToProperty) ...
            
            if ($request->mode === 'nouveau') {
                $request->validate([
                    'titre_demandeur' => 'required|string|max:12',
                    'nom_demandeur' => 'required|string|max:40',
                    'date_naissance' => 'required|date|before:-18 years',
                    'cin' => 'nullable|string|size:12|unique:demandeurs,cin',
                    'prenom_demandeur' => 'nullable|string|max:50',
                    'lieu_naissance' => 'nullable|string|max:100',
                    'occupation' => 'nullable|string|max:30',
                    'nom_mere' => 'nullable|string',
                    'nom_pere' => 'nullable|string',
                    'date_delivrance' => 'nullable|date|before:today',
                    'lieu_delivrance' => 'nullable|string|max:40',
                    'domiciliation' => 'nullable|string|max:60',
                    'situation_familiale' => 'nullable|string|max:40',
                    'nationalite' => 'nullable|string|max:40',
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
                    'regime_matrimoniale' => $request->regime_matrimoniale ?? 'Non spécifié',
                    'date_mariage' => $request->date_mariage,
                    'lieu_mariage' => $request->lieu_mariage,
                    'marie_a' => $request->marie_a,
                    'telephone' => $request->telephone,
                    'id_user' => $id_user,
                ]);
                
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

            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('message', 'Demandeur lié à la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }


    /**
     *  Vérifier si une propriété est archivée
     */
    private function isPropertyArchived(Propriete $propriete): bool
    {
        $demandesActives = Demander::where('id_propriete', $propriete->id)
            ->where('status', 'active')
            ->count();
            
        $demandesArchivees = Demander::where('id_propriete', $propriete->id)
            ->where('status', 'archive')
            ->count();
            
        return $demandesArchivees > 0 && $demandesActives === 0;
    }

    /**
     * ✅ Message d'erreur standardisé pour propriété archivée
     */
    private function getArchivedErrorMessage(Propriete $propriete): string
    {
        $demandes = Demander::where('id_propriete', $propriete->id)
            ->where('status', 'archive')
            ->with('demandeur')
            ->get();
        
        $demandeurs = $demandes->pluck('demandeur.nom_demandeur')->toArray();
        $demandeursStr = implode(', ', $demandeurs);
        
        return "⚠️ Cette propriété (Lot {$propriete->lot}) est archivée (acquise) par : {$demandeursStr}. Aucune action n'est possible. Veuillez la désarchiver d'abord.";
    }

    /**
     * ✅ MODIFIÉ : Ajouter demandeur avec vérification archivage
     */
    public function addToProperty($id, $id_propriete = null)
    {
        $dossier = Dossier::with('proprietes')->findOrFail($id);
        
        // ✅ Si une propriété est pré-sélectionnée, vérifier si elle est archivée
        if ($id_propriete) {
            $propriete = Propriete::findOrFail($id_propriete);
            if ($this->isPropertyArchived($propriete)) {
                return Redirect::route('dossiers.show', $dossier->id)
                    ->with('error', $this->getArchivedErrorMessage($propriete));
            }
        }
        
        return Inertia::render('DemandeursProprietes/AjouterDemandeur', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'id_propriete' => $id_propriete,
        ]);
    }

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
            
            // ✅ Vérifier si propriété archivée
            if ($this->isPropertyArchived($propriete)) {
                DB::rollBack();
                return back()->withErrors(['error' => $this->getArchivedErrorMessage($propriete)]);
            }

            // ... reste du code inchangé ...
            
            if ($request->mode === 'existant') {
                $request->validate(['cin' => 'required|exists:demandeurs,cin']);
                $demandeur = Demandeur::where('cin', $request->cin)->firstOrFail();
                
                $existingLink = Demander::where('id_demandeur', $demandeur->id)
                    ->where('id_propriete', $request->id_propriete)
                    ->exists();
                    
                if ($existingLink) {
                    return back()->withErrors(['cin' => 'Ce demandeur est déjà lié à cette propriété']);
                }
                
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
                $request->validate([
                    'titre_demandeur' => 'required|string|max:12',
                    'nom_demandeur' => 'required|string|max:40',
                    'date_naissance' => 'required|date|before:-18 years',
                    'cin' => 'nullable|string|size:12|unique:demandeurs,cin',
                    'prenom_demandeur' => 'nullable|string|max:50',
                    'lieu_naissance' => 'nullable|string|max:100',
                    'occupation' => 'nullable|string|max:30',
                    'nom_mere' => 'nullable|string',
                    'nom_pere' => 'nullable|string',
                    'date_delivrance' => 'nullable|date|before:today',
                    'lieu_delivrance' => 'nullable|string|max:40',
                    'domiciliation' => 'nullable|string|max:60',
                    'situation_familiale' => 'nullable|string|max:40',
                    'nationalite' => 'nullable|string|max:40',
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
                    'regime_matrimoniale' => $request->regime_matrimoniale ?? 'Non spécifié',
                    'date_mariage' => $request->date_mariage,
                    'lieu_mariage' => $request->lieu_mariage,
                    'marie_a' => $request->marie_a,
                    'telephone' => $request->telephone,
                    'id_user' => $id_user,
                ]);
                
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $propriete->id_dossier,
                ]);
            }

            $demandeursCount = Demander::where('id_propriete', $request->id_propriete)->count();
            
            Demander::create([
                'id_demandeur' => $demandeur->id,
                'id_propriete' => $request->id_propriete,
                'id_user' => $id_user,
                'status' => 'active',
                'status_consort' => $demandeursCount > 0,
                'total_prix' => 0,
            ]);

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
     * ✅ MODIFIÉ : Dissocier avec vérification archivage
     */
    public function dissociate(Request $request)
    {
        $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::findOrFail($request->id_propriete);
            
            // ✅ Bloquer si archivée
            if ($this->isPropertyArchived($propriete)) {
                DB::rollBack();
                return back()->with('error', $this->getBlockedActionMessage($propriete, 'dissociation'));
            }
            
            // Supprimer la liaison dans la table demander
            $deleted = Demander::where('id_demandeur', $request->id_demandeur)
                ->where('id_propriete', $request->id_propriete)
                ->delete();

            if (!$deleted) {
                return back()->withErrors(['error' => 'Liaison introuvable']);
            }

            // Vérifier s'il reste des demandeurs pour cette propriété
            $remainingDemandeurs = Demander::where('id_propriete', $request->id_propriete)
                ->where('status', 'active')
                ->count();

            // Si plus aucun demandeur, mettre status à false
            if ($remainingDemandeurs === 0) {
                Propriete::where('id', $request->id_propriete)->update(['status' => false]);
            }

            DB::commit();
            
            return back()->with('success', 'Demandeur dissocié de la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

}