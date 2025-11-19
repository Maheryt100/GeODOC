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
            'numero_dep_vol' => 'nullable|string', // ✅ NOUVEAU
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

    /**
     * ✅ NOUVEAU : Créer plusieurs propriétés à la fois
     */
    public function storeMultiple(Request $request)
    {
        // ✅ Décoder le JSON si nécessaire
        $proprietes = is_string($request->proprietes) 
            ? json_decode($request->proprietes, true) 
            : $request->proprietes;

        $validated = $request->validate([
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        // Valider chaque propriété
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
                // ✅ Nettoyer les chaînes vides en null
                foreach ($proprieteData as $key => $value) {
                    if ($value === '') {
                        $proprieteData[$key] = null;
                    }
                }
                
                $proprieteData['id_user'] = Auth::id();
                $proprieteData['id_dossier'] = $validated['id_dossier'];
                $proprieteData['status'] = false; // Pas de demandeur associé par défaut
                
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
        $propriete = Propriete::findOrFail($id);
        return Inertia::render('proprietes/read', [
            'propriete' => $propriete,
        ]);
    }

    public function edit(string $id)
    {
        $propriete = Propriete::findOrFail($id);
        $dossier = Dossier::findOrFail($propriete->id_dossier);
        
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
            'numero_dep_vol' => 'nullable|string', // ✅ NOUVEAU
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

    public function destroy(string $id)
    {
        $propriete = Propriete::find($id);
        
        if (!$propriete) {
            return back()->with('message', 'Propriété introuvable');
        }
        
        if ($this->isPropertyArchived($propriete)) {
            return back()->with('error', $this->getBlockedActionMessage($propriete, 'suppression'));
        }
        
        $id_dossier = $propriete->id_dossier;
        $propriete->delete();
        
        return Redirect::route('dossiers.show', $id_dossier)
            ->with('success', 'Propriété supprimée avec succès');
    }

    public function archive(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::findOrFail($request->id);
            
            $demandesActives = Demander::where('id_propriete', $propriete->id)
                ->where('status', 'active')
                ->count();
            
            if ($demandesActives === 0) {
                return back()->withErrors(['error' => 'Impossible d\'archiver : cette propriété n\'a aucun demandeur actif.']);
            }
            
            Demander::where('id_propriete', $propriete->id)
                ->where('status', 'active')
                ->update(['status' => 'archive']);
            
            DB::commit();
            
            Log::info('Propriété archivée', [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'demandes_archivees' => $demandesActives
            ]);
            
            return back()->with('success', "Propriété Lot {$propriete->lot} archivée (acquise)");
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur archivage propriété', [
                'propriete_id' => $request->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de l\'archivage : ' . $e->getMessage()]);
        }
    }

    public function unarchive(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::findOrFail($request->id);
            
            $demandesArchivees = Demander::where('id_propriete', $propriete->id)
                ->where('status', 'archive')
                ->count();
            
            if ($demandesArchivees === 0) {
                return back()->withErrors(['error' => 'Cette propriété n\'a aucune demande archivée.']);
            }
            
            Demander::where('id_propriete', $propriete->id)
                ->where('status', 'archive')
                ->update(['status' => 'active']);
            
            DB::commit();
            
            Log::info('Propriété désarchivée', [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'demandes_reactivees' => $demandesArchivees
            ]);
            
            return back()->with('success', "Propriété Lot {$propriete->lot} désarchivée");
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur désarchivage propriété', [
                'propriete_id' => $request->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de la désarchivation : ' . $e->getMessage()]);
        }
    }

    /**
     * Vérifier si une propriété est archivée
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
     * Message bloqué pour propriété archivée
     */
    private function getBlockedActionMessage(Propriete $propriete, string $action = 'action'): string
    {
        $demandes = Demander::where('id_propriete', $propriete->id)
            ->where('status', 'archive')
            ->with('demandeur')
            ->get();
        
        $demandeurs = $demandes->pluck('demandeur.nom_demandeur')->filter()->toArray();
        $demandeursStr = !empty($demandeurs) ? implode(', ', $demandeurs) : 'demandeur(s) inconnu(s)';
        
        return "🔒 PROPRIÉTÉ ARCHIVÉE (ACQUISE) - La propriété Lot {$propriete->lot} est archivée par : {$demandeursStr}. " .
               "❌ Aucune {$action} possible tant qu'elle reste archivée.";
    }
}