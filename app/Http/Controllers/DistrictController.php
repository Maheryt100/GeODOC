<?php

namespace App\Http\Controllers;

use App\Models\District;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DistrictController extends Controller
{
    public function index()
    {
        $districts = District::all();
        
        return Inertia::render('circonscription/index', [
            'districts' => $districts,
            'natures' => ['Urbaine', 'Suburbaine', 'Rurale'],
            'vocations' => ['Edilitaire', 'Agricole', 'Forestière', 'Touristique'],
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:districts,id',
            'edilitaire' => 'required|numeric|min:0',
            'agricole' => 'required|numeric|min:0',
            'forestiere' => 'required|numeric|min:0',
            'touristique' => 'required|numeric|min:0',
        ]);

        try {
            $district = District::findOrFail($request->id);
            
            $district->update([
                'edilitaire' => $request->edilitaire,
                'agricole' => $request->agricole,
                'forestiere' => $request->forestiere,
                'touristique' => $request->touristique,
            ]);
            
            return back()->with('message', 'Prix mis à jour avec succès pour ' . $district->nom_district);
            
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}