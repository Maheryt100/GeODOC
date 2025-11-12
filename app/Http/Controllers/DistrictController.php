<?php

namespace App\Http\Controllers;

use App\Models\District;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DistrictController extends Controller
{
    /**
     * Afficher la liste des districts avec leurs prix
     */
    public function index()
    {
        $districts = District::with('region')
            ->orderBy('nom_district')
            ->get();
        
        return Inertia::render('circonscription/index', [
            'districts' => $districts,
            'natures' => ['Urbaine', 'Suburbaine', 'Rurale'],
            'vocations' => ['Edilitaire', 'Agricole', 'Forestière', 'Touristique'],
        ]);
    }

    /**
     * Mettre à jour les prix d'un district
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:districts,id',
            'edilitaire' => 'required|numeric|min:0',
            'agricole' => 'required|numeric|min:0',
            'forestiere' => 'required|numeric|min:0',
            'touristique' => 'required|numeric|min:0',
        ], [
            'id.required' => 'L\'identifiant du district est requis',
            'id.exists' => 'Le district sélectionné n\'existe pas',
            'edilitaire.required' => 'Le prix édilitaire est requis',
            'edilitaire.numeric' => 'Le prix édilitaire doit être un nombre',
            'edilitaire.min' => 'Le prix édilitaire ne peut pas être négatif',
            'agricole.required' => 'Le prix agricole est requis',
            'agricole.numeric' => 'Le prix agricole doit être un nombre',
            'agricole.min' => 'Le prix agricole ne peut pas être négatif',
            'forestiere.required' => 'Le prix forestier est requis',
            'forestiere.numeric' => 'Le prix forestier doit être un nombre',
            'forestiere.min' => 'Le prix forestier ne peut pas être négatif',
            'touristique.required' => 'Le prix touristique est requis',
            'touristique.numeric' => 'Le prix touristique doit être un nombre',
            'touristique.min' => 'Le prix touristique ne peut pas être négatif',
        ]);

        try {
            $district = District::findOrFail($validated['id']);
            
            $district->update([
                'edilitaire' => $validated['edilitaire'],
                'agricole' => $validated['agricole'],
                'forestiere' => $validated['forestiere'],
                'touristique' => $validated['touristique'],
            ]);
            
            return back()->with('message', 
                'Prix mis à jour avec succès pour le district ' . $district->nom_district
            );
            
        } catch (\Exception $e) {
            return back()->with('error', 
                'Une erreur est survenue lors de la mise à jour : ' . $e->getMessage()
            );
        }
    }

    /**
     * Mettre à jour les prix de plusieurs districts en masse
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'districts' => 'required|array',
            'districts.*.id' => 'required|exists:districts,id',
            'districts.*.edilitaire' => 'required|numeric|min:0',
            'districts.*.agricole' => 'required|numeric|min:0',
            'districts.*.forestiere' => 'required|numeric|min:0',
            'districts.*.touristique' => 'required|numeric|min:0',
        ]);

        try {
            $updated = 0;
            
            foreach ($validated['districts'] as $districtData) {
                District::where('id', $districtData['id'])
                    ->update([
                        'edilitaire' => $districtData['edilitaire'],
                        'agricole' => $districtData['agricole'],
                        'forestiere' => $districtData['forestiere'],
                        'touristique' => $districtData['touristique'],
                    ]);
                $updated++;
            }
            
            return back()->with('message', 
                $updated . ' district(s) mis à jour avec succès'
            );
            
        } catch (\Exception $e) {
            return back()->with('error', 
                'Une erreur est survenue lors de la mise à jour en masse : ' . $e->getMessage()
            );
        }
    }

    /**
     * Réinitialiser les prix d'un district
     */
    public function resetPrices(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:districts,id',
        ]);

        try {
            $district = District::findOrFail($validated['id']);
            
            $district->update([
                'edilitaire' => 0,
                'agricole' => 0,
                'forestiere' => 0,
                'touristique' => 0,
            ]);
            
            return back()->with('message', 
                'Prix réinitialisés pour le district ' . $district->nom_district
            );
            
        } catch (\Exception $e) {
            return back()->with('error', 
                'Une erreur est survenue lors de la réinitialisation : ' . $e->getMessage()
            );
        }
    }
}