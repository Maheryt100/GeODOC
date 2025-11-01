<?php

namespace App\Http\Controllers;

use App\Models\Contenir;
use App\Models\Demandeur;
use App\Models\Dossier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

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
            'prenom_demandeur' => 'string|max:50|nullable',
            'date_naissance' => 'required|date|before:-18 years',
            'lieu_naissance' => 'required|string|max:100',
            'sexe' => 'required',
            'occupation' => 'required|string|max:30',
            'nom_pere' => 'string|nullable',
            'nom_mere' => 'required|string',
            'cin' => 'required|string|max:15|unique:' . Demandeur::class,
            'date_delivrance' => 'required|date|before:today',
            'lieu_delivrance' => 'required|string|max:40',
            'date_delivrance_duplicata' => 'nullable|date|before:today',
            'lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'domiciliation' => 'required|string|max:60',
            'situation_familiale' => 'required|string|max:40',
            'regime_matrimoniale' => 'nullable|string|max:40',
            'telephone' => 'nullable|string|max:10',
            'date_mariage' => 'nullable|date|before:today',
            'lieu_mariage' => 'nullable|string|max:40',
            'marie_a' => 'nullable|string|max:40',
            'nationalite' => 'required|string|max:40',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            'pieces.*' => 'nullable|file',
        ], [
            'titre_demandeur.required' => 'Le titre est obligatoire.',
            'nom_demandeur.required' => 'Le nom est obligatoire.',
            'prenom_demandeur.max' => 'Le prénom ne doit pas dépasser 50 caractères.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans.',
            'lieu_naissance.required' => 'Le lieu de naissance est obligatoire.',
            'sexe.required' => 'Le sexe est obligatoire.',
            'occupation.required' => 'La profession est obligatoire.',
            'nom_mere.required' => 'Le nom de la mère est obligatoire.',
            'cin.numeric' => 'Le numéro CIN est obligatoire et doit être numerique.',
            'date_delivrance.required' => 'La date de délivrance du CIN est obligatoire.',
            'date_delivrance.before' => 'La date de délivrance du CIN doit être antérieure à aujourd’hui.',
            'lieu_delivrance.required' => 'Le lieu de délivrance du CIN est obligatoire.',
            'domiciliation.required' => 'La domiciliation est obligatoire.',
            'situation_familiale.required' => 'La situation familiale est obligatoire.',
            'regime_matrimoniale.required' => 'Le régime matrimonial est obligatoire.',
            'telephone.max' => 'Le numéro de téléphone ne doit pas dépasser 10 chiffres.',
            'date_mariage.before' => 'La date de mariage doit être antérieure à aujourd’hui.',
            'id_dossier.required' => 'Le dossier est obligatoire.',
            'id_dossier.exists' => 'Le dossier sélectionné est invalide.',
            'pieces.*.file' => 'Chaque pièce jointe doit être un fichier valide.',
            'cin.unique' => 'Le numéro CIN est déjà pris.',
        ]);

        $piecesPaths = [];

        if ($request->hasFile('pieces')) {
            foreach ($request->file('pieces') as $index => $file) {
                if ($file && $file->isValid()) {
                    $path = $file->store('pieces_jointes', 'public');
                }
            }
        }

        try {
            $request->merge(['id_user' => Auth::user()->getAuthIdentifier()]);
            $demandeur = Demandeur::create(
                $request->except(['_token', 'id_dossier']),
            );
            $contenir = Contenir::create([
                'id_demandeur' => $demandeur->id,
                'id_dossier' => request()->id_dossier,
            ]);
//
//            if (!$demandeur || !$contenir) {
//                return back()->with('error', 'Erreur lors de la création du demandeur.');
//            }

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
        //
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
        //
        $existDemandeur = Demandeur::find($id);
        if (!$existDemandeur) {
            return Redirect::route('demandeurs.index')->with('error', 'Demandeur introuvable.');
        }

        $validateData = $request->validate([
            'titre_demandeur' => 'required|string|max:12',
            'nom_demandeur' => 'required|string|max:40',
            'prenom_demandeur' => 'string|max:50|nullable',
            'date_naissance' => 'required|date|before:-18 years',
            'lieu_naissance' => 'required|string|max:100',
            'sexe' => 'required',
            'occupation' => 'required|string|max:30',
            'nom_pere' => 'string|nullable',
            'nom_mere' => 'required|string',
            'cin' => ['required','numeric', Rule::unique(Demandeur::class)->ignore($id)],
            'date_delivrance' => 'required|date|before:today',
            'lieu_delivrance' => 'required|string|max:40',
            'date_delivrance_duplicata' => 'nullable|date|before:today',
            'lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'domiciliation' => 'required|string|max:60',
            'situation_familiale' => 'required|string|max:40',
            'regime_matrimoniale' => 'nullable|string|max:40',
            'telephone' => 'nullable|string|max:10',
            'date_mariage' => 'nullable|date|before:today',
            'lieu_mariage' => 'nullable|string|max:40',
            'marie_a' => 'nullable|string|max:40',
            'nationalite' => 'required|string|max:40',
            'pieces.*' => 'nullable|file',
            'id_dossier' => 'required|exists:dossiers,id',
        ], [
            'titre_demandeur.required' => 'Le titre est obligatoire.',
            'nom_demandeur.required' => 'Le nom est obligatoire.',
            'prenom_demandeur.max' => 'Le prénom ne doit pas dépasser 50 caractères.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans.',
            'lieu_naissance.required' => 'Le lieu de naissance est obligatoire.',
            'sexe.required' => 'Le sexe est obligatoire.',
            'occupation.required' => 'La profession est obligatoire.',
            'nom_mere.required' => 'Le nom de la mère est obligatoire.',
            'cin.numeric' => 'Le numéro CIN est obligatoire et doit être numerique.',
            'date_delivrance.required' => 'La date de délivrance du CIN est obligatoire.',
            'date_delivrance.before' => 'La date de délivrance du CIN doit être antérieure à aujourd’hui.',
            'lieu_delivrance.required' => 'Le lieu de délivrance du CIN est obligatoire.',
            'domiciliation.required' => 'La domiciliation est obligatoire.',
            'situation_familiale.required' => 'La situation familiale est obligatoire.',
            'regime_matrimoniale.required' => 'Le régime matrimonial est obligatoire.',
            'telephone.max' => 'Le numéro de téléphone ne doit pas dépasser 10 chiffres.',
            'date_mariage.before' => 'La date de mariage doit être antérieure à aujourd’hui.',
            'pieces.*.file' => 'Chaque pièce jointe doit être un fichier valide.',
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
     * Remove the specified resource from storage.
     */
    public function destroy($id_dossier, $id_demandeur)
    {
        $contenir = Contenir::where('id_dossier', $id_dossier)
            ->where('id_demandeur', $id_demandeur)
            ->first();
        if(!$contenir){
            return redirect()->route('dossiers.demandeurs', $id_dossier)->with('message', 'Demandeur introuvable.');
        }
        $contenir->delete();
        return redirect()->route('demandeurs')->with('message', 'Demandeur Supprimé avec succès.');
    }
}
