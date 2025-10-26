<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\UserRequisition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PhpOffice\PhpWord\TemplateProcessor;

class ProprieteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
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

    /**
     * Show the form for creating a new resource.
     */
    public function create($id)
    {
        $dossier = Dossier::find($id);
        return Inertia::render('proprietes/create', [
           'dossier' => $dossier,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validate = $request->validate([
            'lot' => 'required|string|max:15',
            'propriete_mere' => 'nullable|string|max:20',
            'titre_mere' => 'nullable|string|max:20',
            'titre' => 'nullable|string|max:20',
            'proprietaire' => 'nullable|string|max:50',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:40',
            'situation' => 'nullable|string',
            'nature' => 'required|string|max:40',
            'numero_FN' => 'nullable|string|max:10',
            'numero_requisition' => 'nullable|string|max:30',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string',
        ],[
            'lot.required' => 'Le Lot is obligatoire',
            'id_dossier.exists' => 'Le dossier n\'existe pas',
            'contenance.min' => 'La contenance invalide'
        ]);
        try {
            $request->merge(['id_user' => Auth::user()->getAuthIdentifier()]);
            $propriete = Propriete::create($request->all());
            return Redirect::route('dossiers.proprietes', $request->id_dossier)->with('message', 'Propriété ajouté avec succès');
        }catch (\Exception $exception){
            return $exception->getMessage();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        //
        $propriete = Propriete::find($id);
        return Inertia::render('proprietes/read', [
            'propriete' => $propriete,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $propriete = Propriete::find($id);
        $dossier = Dossier::find($propriete->id_dossier);
        return Inertia::render('proprietes/update', [
            'propriete' => $propriete,
            'dossier' => $dossier,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
        $existPropriete = Propriete::find($id);

        if (!$existPropriete) {
            return redirect()->route('proprietes.index')->with('Propriété introuvable ou n\'existe pas');
        }

        $validate = $request->validate([
            'lot' => 'required|string|max:15',
            'propriete_mere' => 'nullable|string|max:20',
            'titre_mere' => 'nullable|string|max:20',
            'titre' => 'nullable|string|max:20',
            'proprietaire' => 'nullable|string|max:50',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:40',
            'situation' => 'nullable|string',
            'nature' => 'required|string|max:40',
            'numero_FN' => 'nullable|string|max:10',
            'numero_requisition' => 'nullable|string|max:30',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
        ],[
            'lot.required' => 'Le Lot is obligatoire',
            'id_dossier.exists' => 'Le dossier n\'existe pas',
            'contenance.min' => 'La contenance invalide'
        ]);
        try {
            $existPropriete->update($validate);
            return Redirect::route('dossiers.proprietes', $request->id_dossier)->with('message','Propriété modifié avec succès');
        }catch (\Exception $exception){
            return redirect()->back()->with('message', $exception->getMessage());
        }
    }

    public function downloadRequisition($id_dossier, $id)
    {
        $propriete = Propriete::find($id);
        $dossier = Dossier::find($id_dossier);

        if (!$propriete) {
            return redirect()->route('proprietes.index')->with('message', 'Propriété introuvable');
        }
        if ($dossier->type == 'morcellement') {
            $requision_model = new TemplateProcessor(storage_path('app/public/modele_odoc/requisition_MO.docx'));
        }elseif ($dossier->type == 'immatriculation') {
            $requision_model = new TemplateProcessor(storage_path('app/public/modele_odoc/requisition_IM.docx'));
        }

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $requision_model->setValues([
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

        $fileName = 'Requisition_' . $propriete->titre . '_' . $propriete->lot . '_' . $propriete->type . '_' .'.docx';

        $requision_model->saveAs(storage_path('app/public/modele_odoc/document_requisition/' .$fileName));
        $userRequisition = UserRequisition::create([
            'id_user' => Auth::user()->getAuthIdentifier(),
            'id_propriete' => $propriete->id,
        ]);
        return response()->download(storage_path('app/public/modele_odoc/document_requisition/' .$fileName));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $propriete = Propriete::find($id);
        $id_dossier = $propriete->id_dossier;
        if (!$propriete) {
            return \redirect()->back()->with('message', 'propriete introuvable');
        }
        $propriete->delete();
        return Redirect::route('dossiers.proprietes', $id_dossier)->with('message', 'Propriété supprimer avec succes');
    }
}
