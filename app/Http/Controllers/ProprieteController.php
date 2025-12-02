<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demander;
use App\Models\UserRequisition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Validator;
use App\Services\PrixCalculatorService;

class ProprieteController extends Controller
{
    public function index(Request $request, $id_dossier)
    {
        $dossier = Dossier::findOrFail($id_dossier);
        $query = Propriete::where('id_dossier', $dossier->id);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('lot', 'ilike', "%{$search}%")
                    ->orWhere('titre', 'ilike', "%{$search}%")
                    ->orWhere('nature', 'ilike', "%{$search}%")
                    ->orWhere('proprietaire', 'ilike', "%{$search}%");
            });
        }

        $proprietes = $query->paginate(20);

        return Inertia::render('proprietes/index', [
            'dossier' => $dossier,
            'proprietes' => $proprietes,
        ]);
    }

    public function create($id)
    {
        $dossier = Dossier::findOrFail($id);
        return Inertia::render('proprietes/create', [
           'dossier' => $dossier,
        ]);
    }

    public function store(Request $request)
    {
        if (is_array($request->charge)) {
            $request->merge([
                'charge' => implode(', ', $request->charge),
            ]);
        }

        $validate = $request->validate([
            'lot' => 'required|string|max:15',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietaire' => 'nullable|string|max:50',
            'situation' => 'nullable|string',
            'propriete_mere' => 'nullable|string|max:20',
            'titre_mere' => 'nullable|string|max:20',
            'titre' => 'nullable|string|max:20',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:255',
            'numero_FN' => 'nullable|string|max:10',
            'numero_requisition' => 'nullable|string|max:30',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string',
            'numero_dep_vol' => 'nullable|string',
        ],[
            'lot.required' => 'Le lot est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'nature.in' => 'La nature doit être: Urbaine, Suburbaine ou Rurale',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
            'contenance.min' => 'La contenance est invalide'
        ]);
        
        try {
            $request->merge(['id_user' => Auth::id()]);
            Propriete::create($request->all());
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('message', 'Propriété ajoutée avec succès');
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function storeMultiple(Request $request)
    {
        $proprietes = is_string($request->proprietes) 
            ? json_decode($request->proprietes, true) 
            : $request->proprietes;

        $validated = $request->validate([
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        $validator = Validator::make(['proprietes' => $proprietes], [
            'proprietes' => 'required|array|min:1',
            'proprietes.*.lot' => 'required|string|max:15',
            'proprietes.*.titre' => 'nullable|string|max:30',
            'proprietes.*.contenance' => 'nullable|numeric',
            'proprietes.*.proprietaire' => 'nullable|string|max:100',
            'proprietes.*.propriete_mere' => 'nullable|string|max:15',
            'proprietes.*.titre_mere' => 'nullable|string|max:30',
            'proprietes.*.charge' => 'nullable|string',
            'proprietes.*.situation' => 'nullable|string',
            'proprietes.*.nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'proprietes.*.vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietes.*.numero_FN' => 'nullable|string|max:30',
            'proprietes.*.numero_requisition' => 'nullable|string|max:30',
            'proprietes.*.date_requisition' => 'nullable|date',
            'proprietes.*.date_inscription' => 'nullable|date',
            'proprietes.*.dep_vol' => 'nullable|string|max:30',
            'proprietes.*.numero_dep_vol' => 'nullable|string|max:30',
            'proprietes.*.type_operation' => 'required|in:morcellement,immatriculation',
        ], [
            'proprietes.*.lot.required' => 'Le numéro de lot est obligatoire (propriété :position).',
            'proprietes.*.nature.required' => 'La nature est obligatoire (propriété :position).',
            'proprietes.*.vocation.required' => 'La vocation est obligatoire (propriété :position).',
            'proprietes.*.type_operation.required' => 'Le type d\'opération est obligatoire (propriété :position).',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation échouée pour propriétés multiples', [
                'errors' => $validator->errors()->toArray(),
                'data' => $proprietes
            ]);
            return back()->withErrors($validator->errors());
        }

        DB::beginTransaction();

        try {
            $createdCount = 0;
            
            foreach ($proprietes as $proprieteData) {
                foreach ($proprieteData as $key => $value) {
                    if ($value === '') {
                        $proprieteData[$key] = null;
                    }
                }
                
                $proprieteData['id_user'] = Auth::id();
                $proprieteData['id_dossier'] = $validated['id_dossier'];
                
                Propriete::create($proprieteData);
                
                $createdCount++;
            }

            DB::commit();

            Log::info('Propriétés multiples créées', [
                'count' => $createdCount,
                'dossier_id' => $validated['id_dossier'],
                'user_id' => Auth::id()
            ]);

            return Redirect::route('dossiers.show', $validated['id_dossier'])
                ->with('success', "{$createdCount} propriété(s) créée(s) avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur création multiple propriétés', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $proprietes
            ]);

            return back()->withErrors(['error' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $propriete = Propriete::with(['piecesJointes' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->findOrFail($id);
        return Inertia::render('proprietes/read', [
            'propriete' => $propriete,
        ]);
    }

    public function edit(string $id)
    {
        $propriete = Propriete::findOrFail($id);
        $dossier = Dossier::findOrFail($propriete->id_dossier);
        
        // ✅ CORRECTION : Vérifier via demandes, pas is_archived
        if ($this->isPropertyArchived($propriete)) {
            return Redirect::route('dossiers.show', $dossier->id)
                ->with('error', $this->getBlockedActionMessage($propriete, 'modification'));
        }
        
        return Inertia::render('proprietes/update', [
            'propriete' => $propriete,
            'dossier' => $dossier,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $existPropriete = Propriete::find($id);

        if (!$existPropriete) {
            return back()->with('message', 'Propriété introuvable');
        }
        
        if ($this->isPropertyArchived($existPropriete)) {
            return back()->with('error', $this->getBlockedActionMessage($existPropriete, 'modification'));
        }
        
        if (is_array($request->charge)) {
            $request->merge([
                'charge' => implode(', ', $request->charge),
            ]);
        }

        $validate = $request->validate([
            'lot' => 'required|string|max:15',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'nature' => 'required|string|max:40',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietaire' => 'nullable|string|max:50',
            'situation' => 'nullable|string',
            'propriete_mere' => 'nullable|string|max:20',
            'titre_mere' => 'nullable|string|max:20',
            'titre' => 'nullable|string|max:20',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:255',
            'numero_FN' => 'nullable|string|max:10',
            'numero_requisition' => 'nullable|string|max:30',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string',
            'numero_dep_vol' => 'nullable|string',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
        ], [
            'lot.required' => 'Le lot est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
        ]);
        
        DB::beginTransaction();
        
        try {
            $contenanceChanged = $existPropriete->contenance != $validate['contenance'];
            $vocationChanged = $existPropriete->vocation != $validate['vocation'];
            
            $existPropriete->update($validate);
            
            if ($contenanceChanged || $vocationChanged) {
                $demandes = Demander::where('id_propriete', $existPropriete->id)
                    ->where('status', 'active')
                    ->get();
                
                if ($demandes->count() > 0) {
                    $nouveauPrix = PrixCalculatorService::calculerPrixTotal($existPropriete);
                    
                    foreach ($demandes as $demande) {
                        $ancienPrix = $demande->total_prix;
                        $demande->update(['total_prix' => $nouveauPrix]);
                        
                        Log::info('Prix recalculé après modification propriété', [
                            'propriete_id' => $existPropriete->id,
                            'lot' => $existPropriete->lot,
                            'demande_id' => $demande->id,
                            'ancien_prix' => $ancienPrix,
                            'nouveau_prix' => $nouveauPrix,
                        ]);
                    }
                    
                    DB::commit();
                    
                    return Redirect::route('dossiers.show', $request->id_dossier)
                        ->with('success', "Propriété modifiée et {$demandes->count()} prix recalculé(s)");
                }
            }
            
            DB::commit();
            
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('message', 'Propriété modifiée avec succès');
                
        } catch (\Exception $exception) {
            DB::rollBack();
            
            Log::error('Erreur modification propriété', [
                'propriete_id' => $id,
                'error' => $exception->getMessage()
            ]);
            
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    /**
     * ✅ CORRECTION MAJEURE : Suppression avec validation stricte
     */
    public function destroy(string $id)
    {
        try {
            $propriete = Propriete::with(['demandes.demandeur', 'dossier'])->findOrFail($id);
            
            Log::info('🔍 Tentative de suppression propriété', [
                'propriete_id' => $id,
                'lot' => $propriete->lot
            ]);

            // ✅ VÉRIFICATION 1 : Propriété archivée (acquise)
            if ($propriete->is_archived) {
                $message = "❌ Impossible de supprimer la propriété Lot {$propriete->lot}.";
                $message .= "\n\n🔒 Cette propriété est archivée (acquise).";
                $message .= "\n\n💡 Les données historiques doivent être conservées pour des raisons légales et d'audit.";
                
                Log::warning('⚠️ Tentative suppression propriété archivée', [
                    'propriete_id' => $id,
                    'lot' => $propriete->lot
                ]);
                
                return back()->with('error', $message);
            }

            // ✅ VÉRIFICATION 2 : Demandeurs actifs
            $demandesActives = $propriete->demandesActives()->with('demandeur')->get();
            
            if ($demandesActives->count() > 0) {
                $demandeurs = $demandesActives->map(function($demande) {
                    $d = $demande->demandeur;
                    return $d->titre_demandeur . ' ' . $d->nom_demandeur . ' ' . ($d->prenom_demandeur ?? '');
                })->toArray();
                
                $message = "❌ Impossible de supprimer la propriété Lot {$propriete->lot}.";
                $message .= "\n\n👥 {$demandesActives->count()} demandeur(s) actif(s) associé(s) :";
                foreach ($demandeurs as $nomDemandeur) {
                    $message .= "\n  • {$nomDemandeur}";
                }
                
                $message .= "\n\n💡 Actions possibles :";
                $message .= "\n1. Dissociez d'abord tous les demandeurs";
                $message .= "\n2. Ou archivez la propriété si elle est acquise";
                
                Log::warning('⚠️ Tentative suppression propriété avec demandeurs actifs', [
                    'propriete_id' => $id,
                    'lot' => $propriete->lot,
                    'demandeurs_count' => $demandesActives->count(),
                    'demandeurs' => $demandeurs
                ]);
                
                return back()->with('error', $message);
            }

            // ✅ VÉRIFICATION 3 : Demandes archivées (acquises dans le passé)
            $demandesArchivees = $propriete->demandesArchivees()->count();
            
            if ($demandesArchivees > 0) {
                $message = "❌ Impossible de supprimer la propriété Lot {$propriete->lot}.";
                $message .= "\n\n📦 Cette propriété contient {$demandesArchivees} demande(s) archivée(s) (historique d'acquisitions).";
                $message .= "\n\n💡 Les données historiques doivent être conservées.";
                
                Log::warning('⚠️ Tentative suppression propriété avec historique', [
                    'propriete_id' => $id,
                    'lot' => $propriete->lot,
                    'demandes_archivees' => $demandesArchivees
                ]);
                
                return back()->with('error', $message);
            }

            // ✅ Suppression autorisée
            $id_dossier = $propriete->id_dossier;
            $lot = $propriete->lot;
            
            $propriete->delete();
            
            Log::info('✅ Propriété supprimée', [
                'propriete_id' => $id,
                'lot' => $lot,
                'dossier_id' => $id_dossier
            ]);
            
            return Redirect::route('dossiers.show', $id_dossier)
                ->with('success', "Propriété Lot {$lot} supprimée avec succès.");
                
        } catch (\Exception $e) {
            Log::error('❌ Erreur suppression propriété', [
                'propriete_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'Erreur lors de la suppression : ' . $e->getMessage());
        }
    }

    /**
     * ✅ ARCHIVER : Archiver TOUTES les demandes actives d'une propriété
     */
    public function archive(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::with('demandesActives.demandeur')->findOrFail($request->id);
            
            // ✅ Vérifier qu'il y a des demandes actives
            $demandesActives = $propriete->demandesActives;
            
            if ($demandesActives->isEmpty()) {
                return back()->withErrors([
                    'error' => 'Impossible d\'archiver : cette propriété n\'a aucune demande active.'
                ]);
            }
            
            // ✅ Archiver TOUTES les demandes actives ENSEMBLE
            $count = 0;
            $demandeurs = [];
            foreach ($demandesActives as $demande) {
                $demande->update(['status' => Demander::STATUS_ARCHIVE]);
                $count++;
                $demandeurs[] = $demande->demandeur->nom_demandeur;
            }
            
            DB::commit();
            
            Log::info('✅ Propriété archivée : TOUTES les demandes archivées ensemble', [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'demandes_archivees' => $count,
                'demandeurs' => $demandeurs
            ]);
            
            return back()->with('success', "Propriété Lot {$propriete->lot} acquise : {$count} demandeur(s) archivé(s)");
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Erreur archivage propriété', [
                'propriete_id' => $request->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de l\'archivage : ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ DÉSARCHIVER : Réactiver TOUTES les demandes archivées d'une propriété
     */
    public function unarchive(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::with('demandesArchivees')->findOrFail($request->id);
            
            $demandesArchivees = $propriete->demandesArchivees;
            
            if ($demandesArchivees->isEmpty()) {
                return back()->withErrors(['error' => 'Cette propriété n\'a aucune demande archivée.']);
            }
            
            // ✅ Réactiver TOUTES les demandes archivées ENSEMBLE
            $count = 0;
            foreach ($demandesArchivees as $demande) {
                $demande->update(['status' => Demander::STATUS_ACTIVE]);
                $count++;
            }
            
            DB::commit();
            
            Log::info('✅ Propriété désarchivée : TOUTES les demandes réactivées ensemble', [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'demandes_reactivees' => $count
            ]);
            
            return back()->with('success', "Propriété Lot {$propriete->lot} désarchivée : {$count} demandeur(s) réactivé(s)");
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Erreur désarchivage propriété', [
                'propriete_id' => $request->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de la désarchivation : ' . $e->getMessage()]);
        }
    }


    /**
     * ✅ HELPER : Vérifier si propriété est archivée
     */
    private function isPropertyArchived(Propriete $propriete): bool
    {
        // ✅ Utiliser l'accessor calculé dynamiquement
        return $propriete->is_archived;
    }

    private function getBlockedActionMessage(Propriete $propriete, string $action): string
    {
        return "Impossible d'effectuer l'action '{$action}' : la propriété Lot {$propriete->lot} est archivée (acquise par tous les demandeurs).";
    }
}