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
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DemandeurProprieteController extends Controller
{
    /**
     * 1. NOUVEAU LOT : Afficher le formulaire
     */
    public function create($id)
    {
        $dossier = Dossier::findOrFail($id);
        
        return Inertia::render('DemandeursProprietes/NouveauLot', [
            'dossier' => $dossier,
        ]);
    }

    /**
     * 1. NOUVEAU LOT : Enregistrer
     */
    public function store(Request $request)
    {
        $demandeurs = json_decode($request->demandeurs_json, true);
        
        if (!$demandeurs || !is_array($demandeurs) || count($demandeurs) === 0) {
            return back()->withErrors(['demandeurs' => 'Au moins un demandeur est requis']);
        }

        Log::info('Nouveau lot - données reçues', [
            'propriete' => $request->except('demandeurs_json'),
            'demandeurs_count' => count($demandeurs),
        ]);
        
        $request->validate([
            'lot' => 'required|string|max:15',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
        ]);
        
        foreach ($demandeurs as $index => $demandeur) {
            $num = $index + 1;
            $demandeur = array_map(fn($v) => $v === '' ? null : $v, $demandeur);
            
            if (empty($demandeur['titre_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le titre est obligatoire"]);
            }
            if (empty($demandeur['nom_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le nom est obligatoire"]);
            }
            if (empty($demandeur['prenom_demandeur'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le prénom est obligatoire"]);
            }
            if (empty($demandeur['date_naissance'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: La date de naissance est obligatoire"]);
            }
            if (empty($demandeur['cin'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le CIN est obligatoire"]);
            }
            if (!preg_match('/^\d{12}$/', $demandeur['cin'])) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Le CIN doit contenir 12 chiffres"]);
            }
            
            $cinDuplicates = array_filter($demandeurs, fn($d, $idx) => 
                $idx !== $index && ($d['cin'] ?? '') === $demandeur['cin']
            , ARRAY_FILTER_USE_BOTH);
            
            if (count($cinDuplicates) > 0) {
                return back()->withErrors(['demandeurs' => "Demandeur $num: Ce CIN est utilisé plusieurs fois dans le formulaire"]);
            }
            
            $demandeurs[$index] = $demandeur;
        }

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            
            $proprieteData = [
                'lot' => $request->lot,
                'propriete_mere' => $request->propriete_mere ?: null,
                'titre_mere' => $request->titre_mere ?: null,
                'titre' => $request->titre ?: null,
                'proprietaire' => $request->proprietaire ?: null,
                'contenance' => $request->contenance ?: null,
                'charge' => $request->charge ?: null,
                'situation' => $request->situation ?: null,
                'nature' => $request->nature,
                'vocation' => $request->vocation,
                'numero_FN' => $request->numero_FN ?: null,
                'numero_requisition' => $request->numero_requisition ?: null,
                'date_requisition' => $request->date_requisition ?: null,
                'date_inscription' => $request->date_inscription ?: null,
                'dep_vol' => $request->dep_vol ?: null,
                'numero_dep_vol' => $request->numero_dep_vol ?: null,
                'type_operation' => $request->type_operation,
                'id_dossier' => $request->id_dossier,
                'id_user' => $id_user,
            ];

            Log::info('Création propriété', $proprieteData);
            $propriete = Propriete::create($proprieteData);

            $demandeursTraites = [];
            
            foreach ($demandeurs as $index => $demandeurData) {
                $num = $index + 1;
                Log::info("👤 Traitement demandeur $num", [
                    'cin' => $demandeurData['cin'],
                    'nom' => $demandeurData['nom_demandeur'],
                ]);

                $cleanData = array_map(fn($v) => ($v === '' || $v === null) ? null : $v, $demandeurData);

                $demandeurExistant = Demandeur::where('cin', $cleanData['cin'])->first();
                
                if ($demandeurExistant) {
                    Log::info("Demandeur existant trouvé, mise à jour", [
                        'id' => $demandeurExistant->id,
                        'cin' => $demandeurExistant->cin
                    ]);
                    
                    $demandeurExistant->update([
                        'titre_demandeur' => $cleanData['titre_demandeur'],
                        'nom_demandeur' => $cleanData['nom_demandeur'],
                        'prenom_demandeur' => $cleanData['prenom_demandeur'],
                        'date_naissance' => $cleanData['date_naissance'],
                        'lieu_naissance' => $cleanData['lieu_naissance'] ?? $demandeurExistant->lieu_naissance,
                        'sexe' => $cleanData['sexe'] ?? $demandeurExistant->sexe,
                        'occupation' => $cleanData['occupation'] ?? $demandeurExistant->occupation,
                        'nom_pere' => $cleanData['nom_pere'] ?? $demandeurExistant->nom_pere,
                        'nom_mere' => $cleanData['nom_mere'] ?? $demandeurExistant->nom_mere,
                        'date_delivrance' => $cleanData['date_delivrance'] ?? $demandeurExistant->date_delivrance,
                        'lieu_delivrance' => $cleanData['lieu_delivrance'] ?? $demandeurExistant->lieu_delivrance,
                        'date_delivrance_duplicata' => $cleanData['date_delivrance_duplicata'] ?? $demandeurExistant->date_delivrance_duplicata,
                        'lieu_delivrance_duplicata' => $cleanData['lieu_delivrance_duplicata'] ?? $demandeurExistant->lieu_delivrance_duplicata,
                        'domiciliation' => $cleanData['domiciliation'] ?? $demandeurExistant->domiciliation,
                        'nationalite' => $cleanData['nationalite'] ?? $demandeurExistant->nationalite,
                        'situation_familiale' => $cleanData['situation_familiale'] ?? $demandeurExistant->situation_familiale,
                        'regime_matrimoniale' => $cleanData['regime_matrimoniale'] ?? $demandeurExistant->regime_matrimoniale,
                        'date_mariage' => $cleanData['date_mariage'] ?? $demandeurExistant->date_mariage,
                        'lieu_mariage' => $cleanData['lieu_mariage'] ?? $demandeurExistant->lieu_mariage,
                        'marie_a' => $cleanData['marie_a'] ?? $demandeurExistant->marie_a,
                        'telephone' => $cleanData['telephone'] ?? $demandeurExistant->telephone,
                    ]);
                    
                    $demandeur = $demandeurExistant;
                    
                } else {
                    Log::info("Création nouveau demandeur", [
                        'cin' => $cleanData['cin'],
                        'nom' => $cleanData['nom_demandeur']
                    ]);
                    
                    $demandeur = Demandeur::create([
                        'titre_demandeur' => $cleanData['titre_demandeur'],
                        'nom_demandeur' => $cleanData['nom_demandeur'],
                        'prenom_demandeur' => $cleanData['prenom_demandeur'],
                        'date_naissance' => $cleanData['date_naissance'],
                        'cin' => $cleanData['cin'],
                        'lieu_naissance' => $cleanData['lieu_naissance'],
                        'sexe' => $cleanData['sexe'],
                        'occupation' => $cleanData['occupation'],
                        'nom_pere' => $cleanData['nom_pere'],
                        'nom_mere' => $cleanData['nom_mere'],
                        'date_delivrance' => $cleanData['date_delivrance'],
                        'lieu_delivrance' => $cleanData['lieu_delivrance'],
                        'date_delivrance_duplicata' => $cleanData['date_delivrance_duplicata'],
                        'lieu_delivrance_duplicata' => $cleanData['lieu_delivrance_duplicata'],
                        'domiciliation' => $cleanData['domiciliation'],
                        'nationalite' => $cleanData['nationalite'] ?? 'Malagasy',
                        'situation_familiale' => $cleanData['situation_familiale'] ?? 'Non spécifiée',
                        'regime_matrimoniale' => $cleanData['regime_matrimoniale'] ?? 'Non spécifié',
                        'date_mariage' => $cleanData['date_mariage'],
                        'lieu_mariage' => $cleanData['lieu_mariage'],
                        'marie_a' => $cleanData['marie_a'],
                        'telephone' => $cleanData['telephone'],
                        'id_user' => $id_user,
                    ]);
                }

                Log::info("Demandeur traité", [
                    'id' => $demandeur->id,
                    'action' => $demandeurExistant ? 'mis à jour' : 'créé'
                ]);

                Contenir::firstOrCreate([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $request->id_dossier,
                ]);

                $liaisonExistante = Demander::where('id_demandeur', $demandeur->id)
                    ->where('id_propriete', $propriete->id)
                    ->exists();
                
                if (!$liaisonExistante) {
                    Demander::create([
                        'id_demandeur' => $demandeur->id,
                        'id_propriete' => $propriete->id,
                        'id_user' => $id_user,
                        'status' => 'active',
                        'status_consort' => count($demandeurs) > 1,
                        'total_prix' => 0, // ✅ L'Observer calculera automatiquement
                    ]);
                }
                
                $demandeursTraites[] = $demandeur->nom_demandeur;
            }

            DB::commit();
            
            Log::info('🎉 Création complète réussie', [
                'propriete_id' => $propriete->id,
                'demandeurs_count' => count($demandeursTraites),
                'demandeurs' => $demandeursTraites
            ]);
            
            $message = count($demandeurs) > 1 
                ? count($demandeurs) . ' demandeurs liés à la propriété avec succès'
                : 'Demandeur et propriété créés avec succès';
            
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('success', $message);
                
        } catch (\Exception $e) {
            DB::rollBack();
        
            Log::error('Erreur création', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ CORRECTION : Vérifier via demandes
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

    private function getBlockedActionMessage(Propriete $propriete, string $action): string
    {
        return "Impossible d'effectuer l'action '{$action}' : la propriété Lot {$propriete->lot} est archivée (acquise).";
    }

    /**
     * LIER EXISTANT : Afficher le formulaire
     */
    public function linkExisting($id, $id_demandeur = null, $id_propriete = null)
    {
        $dossier = Dossier::with(['proprietes', 'demandeurs'])->findOrFail($id);
        
        if ($id_propriete) {
            $propriete = Propriete::findOrFail($id_propriete);
            if ($this->isPropertyArchived($propriete)) {
                return Redirect::route('dossiers.show', $dossier->id)
                    ->with('error', $this->getBlockedActionMessage($propriete, 'liaison'));
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
     * LIER EXISTANT : Rechercher
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
        
        if ($demandeur) {
            $existeInDossier = Contenir::where('id_demandeur', $demandeur->id)
                ->where('id_dossier', $dossier->id)
                ->exists();
                
            if (!$existeInDossier) {
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $dossier->id,
                ]);
            }
        }
        
        return Inertia::render('DemandeursProprietes/LierExistant', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'demandeur' => $demandeur,
            'cin_search' => $request->cin,
        ]);
    }

    /**
     * LIER EXISTANT : Enregistrer
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
            $propriete = Propriete::findOrFail($request->id_propriete);
            
            if ($this->isPropertyArchived($propriete)) {
                DB::rollBack();
                return back()->with('error', $this->getBlockedActionMessage($propriete, 'liaison'));
            }
            
            if ($request->mode === 'nouveau') {
                $request->validate([
                    'titre_demandeur' => 'required|string|max:15',
                    'nom_demandeur' => 'required|string|max:40',
                    'prenom_demandeur' => 'required|string|max:50',
                    'date_naissance' => 'required|date|before:-18 years',
                    'cin' => 'required|string|size:12|unique:demandeurs,cin',
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
                'total_prix' => 0, // ✅ Observer calculera
            ]);

            // ✅ SUPPRIMÉ : Propriete::update(['status' => true])

            DB::commit();

            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('success', 'Demandeur lié à la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * AJOUTER DEMANDEUR : Afficher
     */
    public function addToProperty($id, $id_propriete = null)
    {
        $dossier = Dossier::with('proprietes')->findOrFail($id);
        
        if ($id_propriete) {
            $propriete = Propriete::findOrFail($id_propriete);
            if ($this->isPropertyArchived($propriete)) {
                return Redirect::route('dossiers.show', $dossier->id)
                    ->with('error', $this->getBlockedActionMessage($propriete, 'ajout'));
            }
        }
        
        return Inertia::render('DemandeursProprietes/AjouterDemandeur', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'id_propriete' => $id_propriete,
        ]);
    }

    /**
     * AJOUTER DEMANDEUR : Enregistrer
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
            
            if ($this->isPropertyArchived($propriete)) {
                DB::rollBack();
                return back()->withErrors(['error' => $this->getBlockedActionMessage($propriete, 'ajout')]);
            }

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
                    'titre_demandeur' => 'required|string|max:15',
                    'nom_demandeur' => 'required|string|max:40',
                    'prenom_demandeur' => 'required|string|max:50',
                    'date_naissance' => 'required|date|before:-18 years',
                    'cin' => 'required|string|size:12|unique:demandeurs,cin',
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
                'total_prix' => 0, // ✅ Observer calculera
            ]);

            // ✅ SUPPRIMÉ : Propriete::update(['status' => true])

            DB::commit();
            
            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('success', 'Demandeur ajouté à la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * DISSOCIER
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
            
            if ($this->isPropertyArchived($propriete)) {
                DB::rollBack();
                return back()->with('error', $this->getBlockedActionMessage($propriete, 'dissociation'));
            }
            
            $deleted = Demander::where('id_demandeur', $request->id_demandeur)
                ->where('id_propriete', $request->id_propriete)
                ->delete();

            if (!$deleted) {
                return back()->withErrors(['error' => 'Liaison introuvable']);
            }

            // ✅ SUPPRIMÉ : Plus de gestion de propriete.status

            DB::commit();
            
            return back()->with('success', 'Demandeur dissocié avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }
}