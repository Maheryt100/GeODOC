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
            'proprietaire' => 'required|string|max:50',
            'situation' => 'required|string',
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
        ],[
            'lot.required' => 'Le lot est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'nature.in' => 'La nature doit être: Urbaine, Suburbaine ou Rurale',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
            'proprietaire.required' => 'Le nom de la propriété est obligatoire',
            'situation.required' => 'La situation est obligatoire',
            'id_dossier.exists' => 'Le dossier n\'existe pas',
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
        
        // Vérifier si la propriété est archivée
        $isArchived = $this->isPropertyArchived($propriete);
        
        if ($isArchived) {
            return Redirect::route('dossiers.show', $dossier->id)
                ->with('error', 'Impossible de modifier une propriété archivée (acquise). Veuillez la désarchiver d\'abord.');
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
        
        // Vérifier si la propriété est archivée
        $isArchived = $this->isPropertyArchived($existPropriete);
        
        if ($isArchived) {
            return back()->withErrors(['error' => 'Impossible de modifier une propriété archivée (acquise). Veuillez la désarchiver d\'abord.']);
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
            'proprietaire' => 'required|string|max:50',
            'situation' => 'required|string',
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
            'id_dossier' => 'required|numeric|exists:dossiers,id',
        ], [
            'lot.required' => 'Le lot est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
            'proprietaire.required' => 'Le nom de la propriété est obligatoire',
            'situation.required' => 'La situation est obligatoire',
        ]);
        
        try {
            $existPropriete->update($validate);
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('message', 'Propriété modifiée avec succès');
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }
    
    public function downloadRequisition($id_dossier, $id)
    {
        $propriete = Propriete::findOrFail($id);
        $dossier = Dossier::findOrFail($id_dossier);

        if ($propriete->type_operation == 'morcellement') {
            $requisition_model = new TemplateProcessor(
                storage_path('app/public/modele_odoc/requisition_MO.docx')
            );
        } else {
            $requisition_model = new TemplateProcessor(
                storage_path('app/public/modele_odoc/requisition_IM.docx')
            );
        }

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $requisition_model->setValues([
            'Province' => $place->nom_province,
            'Region' => $place->nom_region,
            'District' => $place->nom_district,
            'DISTRICT' => Str::upper($place->nom_district),
            'Situation' => $propriete->situation,
            'Nom_propriete' => Str::upper($propriete->proprietaire),
            'Titre' => $propriete->titre,
            'Commune' => $dossier->commune,
            'Fokotany' => $dossier->fokontany,
            'Numero_fn' => $propriete->numero_FN,
            'Propriete_mere' => Str::upper($propriete->propriete_mere),
            'Titre_mere' => $propriete->titre_mere,
        ]);

        $fileName = 'Requisition_' . $propriete->titre . '_' . $propriete->lot . '_' . $propriete->type_operation . '.docx';
        $requisition_model->saveAs(storage_path('app/public/modele_odoc/document_requisition/' . $fileName));
        
        UserRequisition::create([
            'id_user' => Auth::id(),
            'id_propriete' => $propriete->id,
        ]);
        
        return response()->download(storage_path('app/public/modele_odoc/document_requisition/' . $fileName));
    }

    public function destroy(string $id)
    {
        $propriete = Propriete::find($id);
        
        if (!$propriete) {
            return back()->with('message', 'Propriété introuvable');
        }
        
        // Vérifier si la propriété est archivée
        $isArchived = $this->isPropertyArchived($propriete);
        
        if ($isArchived) {
            return back()->withErrors(['error' => 'Impossible de supprimer une propriété archivée (acquise). Veuillez la désarchiver d\'abord.']);
        }
        
        $id_dossier = $propriete->id_dossier;
        $propriete->delete();
        
        return Redirect::route('dossiers.show', $id_dossier)
            ->with('success', 'Propriété supprimée avec succès');
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
            
        // Une propriété est archivée si elle a au moins une demande archivée ET aucune demande active
        return $demandesArchivees > 0 && $demandesActives === 0;
    }

    /**
     * NOUVELLE MÉTHODE : Archiver une propriété (propriété acquise)
     */
    public function archive(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::findOrFail($request->id);
            
            // Vérifier s'il y a des demandes actives
            $demandesActives = Demander::where('id_propriete', $propriete->id)
                ->where('status', 'active')
                ->count();
            
            if ($demandesActives === 0) {
                return back()->withErrors(['error' => 'Impossible d\'archiver : cette propriété n\'a aucun demandeur actif.']);
            }
            
            // Archiver toutes les demandes actives liées à cette propriété
            Demander::where('id_propriete', $propriete->id)
                ->where('status', 'active')
                ->update(['status' => 'archive']);
            
            DB::commit();
            
            Log::info('Propriété archivée', [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'demandes_archivees' => $demandesActives
            ]);
            
            return back()->with('success', 'Propriété archivée avec succès (acquise)');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur archivage propriété', [
                'propriete_id' => $request->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de l\'archivage : ' . $e->getMessage()]);
        }
    }

    /**
     * NOUVELLE MÉTHODE : Désarchiver une propriété
     */
    public function unarchive(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::findOrFail($request->id);
            
            // Vérifier s'il y a des demandes archivées
            $demandesArchivees = Demander::where('id_propriete', $propriete->id)
                ->where('status', 'archive')
                ->count();
            
            if ($demandesArchivees === 0) {
                return back()->withErrors(['error' => 'Cette propriété n\'a aucune demande archivée.']);
            }
            
            // Réactiver toutes les demandes archivées liées à cette propriété
            Demander::where('id_propriete', $propriete->id)
                ->where('status', 'archive')
                ->update(['status' => 'active']);
            
            DB::commit();
            
            Log::info('Propriété désarchivée', [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'demandes_reactivees' => $demandesArchivees
            ]);
            
            return back()->with('success', 'Propriété désarchivée avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur désarchivage propriété', [
                'propriete_id' => $request->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de la désarchivation : ' . $e->getMessage()]);
        }
    }
}