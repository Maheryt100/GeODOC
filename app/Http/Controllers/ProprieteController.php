<?php

namespace App\Http\Controllers;

use App\Models\Propriete;
use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ProprieteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        return Inertia::render('proprietes/index', [
            'propriete' => Propriete::orderBy('id', 'desc')->paginate(10),
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
        //
        $validate = $request->validate([
            'commune' => 'nullable|string|max:70',
            'quartier' => 'nullable|string|max:70',
            'lot' => 'required|string|max:15',
            'propriete_mere' => 'nullable|string|max:20',
            'titre' => 'required|string|max:20',
            'proprietaire' => 'nullable|string|max:50',
            'contenance' => 'nullable|numeric',
            'charge' => 'nullable|string|max:40',
            'situation' => 'nullable|string',
            'circonscription' => 'required|string|max:50',
            'type' => 'required|string|max:30',
            'nature' => 'required|string|max:40',
            'id_district' => 'required|numeric|exists:districts,id',
        ],[
            'commune.required' => 'La commune est obligatoire',
            'lot.required' => 'La lot est obligatoire',
            'titre.required' => 'La titre est obligatoire',
        ]);
        try {
            $propriete = Propriete::create($request->all());
            return Redirect::route('proprietes')->with('message', 'Propriété ajouté avec succès');
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
        //
        return Inertia::render('proprietes/update', [
            'propriete' => Propriete::find($id),
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
            'commune' => 'nullable|string|max:70',
            'quartier' => 'nullable|string|max:70',
            'lot' => 'required|string|max:15',
            'propriete_mere' => 'nullable|string|max:20',
            'titre' => 'required|string|max:20',
            'proprietaire' => 'nullable|string|max:50',
            'contenance' => 'nullable|numeric',
            'charge' => 'nullable|string|max:40',
            'situation' => 'nullable|string',
            'circonscription' => 'required|string|max:50',
            'type' => 'required|string|max:30',
            'nature' => 'required|string|max:40',
            'id_district' => 'required|numeric|exists:districts,id',
        ],[
            'commune.required' => 'La commune est obligatoire',
            'lot.required' => 'La lot est obligatoire',
            'titre.required' => 'La titre est obligatoire',
        ]);
        try {
            $existPropriete->update($validate);
            return \redirect('proprietes')->with('messages','Propriété modifié avec succès');
        }catch (\Exception $exception){
            return redirect()->back()->with('message', $exception->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        $propriete = Propriete::find($id);
        if (!$propriete) {
            return \redirect()->back()->with('message', 'propriete introuvable');
        }
        $propriete->delete();
        return redirect()->route('proprietes')->with('message', 'Propriété supprimer avec succes');
    }
}
