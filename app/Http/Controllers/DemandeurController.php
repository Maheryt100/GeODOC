<?php

namespace App\Http\Controllers;

use App\Models\Demandeur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

//use Illuminate\Support\Facades\Validator;

class DemandeurController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        return Inertia::render('demandeurs/index', [
            'demandeur' => Demandeur::orderBy('id', 'desc')->paginate(10),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
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
            'cin' => 'required|string|max:15',
            'date_delivrance' => 'required|date|before:today',
            'lieu_delivrance' => 'required|string|max:40',
            'date_delivrance_duplicata' => 'nullable|date|before:today',
            'lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'domiciliation' => 'required|string|max:60',
            'situation_familiale' => 'required|string|max:40',
            'regime_matrimoniale' => 'required|string|max:40',
            'telephone' => 'nullable|string|max:10',
            'date_mariage' => 'nullable|date|before:today',
            'lieu_mariage' => 'nullable|string|max:40',
            'marie_a' => 'nullable|string|max:40',
            'nationalite' => 'required|string|max:40',
            'id_district' => 'required|numeric|exists:districts,id',
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
            'id_district.required' => 'Le district est obligatoire.',
            'id_district.exists' => 'Le district sélectionné est invalide.',
            'pieces.*.file' => 'Chaque pièce jointe doit être un fichier valide.',
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
            $demandeur = Demandeur::create($request->all());

            if (!$demandeur) {
                return back()->with('error', 'Erreur lors de la création du demandeur.');
            }

            return Redirect::route('demandeurs')->with('success', 'Demandeur ajouté avec succès');
        } catch (\Exception $e) {
            return back()->with('error', 'Une erreur est survenue : ' . $e->getMessage());
        }
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //

    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        //
        return Inertia::render('demandeurs/update', [
            'demandeur' => Demandeur::find($id),
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
            'cin' => 'required|numeric',
            'date_delivrance' => 'required|date|before:today',
            'lieu_delivrance' => 'required|string|max:40',
            'date_delivrance_duplicata' => 'nullable|date|before:today',
            'lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'domiciliation' => 'required|string|max:60',
            'situation_familiale' => 'required|string|max:40',
            'regime_matrimoniale' => 'required|string|max:40',
            'telephone' => 'nullable|string|max:10',
            'date_mariage' => 'nullable|date|before:today',
            'lieu_mariage' => 'nullable|string|max:40',
            'marie_a' => 'nullable|string|max:40',
            'nationalite' => 'required|string|max:40',
            'id_district' => 'required|numeric|exists:districts,id',
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
            'id_district.required' => 'Le district est obligatoire.',
            'id_district.exists' => 'Le district sélectionné est invalide.',
            'pieces.*.file' => 'Chaque pièce jointe doit être un fichier valide.',
        ]);

        try {
            $existDemandeur->update($validateData);
            return \redirect()->route('demandeurs')->with('message', 'Demandeur modifié avec succes.');
        }catch (\Exception $e){
            return back()->withErrors('Error', $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        //
        $demandeur = Demandeur::find($id);
        if(!$demandeur){
            return redirect()->route('demandeurs')->with('message', 'Demandeur introuvable.');
        }
        $demandeur->delete();
        return redirect()->route('demandeurs')->with('message', 'Demandeur Supprimé avec succes.');
    }
}
