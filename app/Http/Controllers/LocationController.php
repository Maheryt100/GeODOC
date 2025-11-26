<?php

namespace App\Http\Controllers;

use App\Models\District;
use App\Models\Province;
use App\Models\Region;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    /**
     * Afficher la hiérarchie complète des localisations
     */
    public function index()
    {
        // Charger toute la hiérarchie Province > Région > District
        $provinces = Province::with([
            'regions' => function ($query) {
                $query->orderBy('nom_region');
            },
            'regions.districts' => function ($query) {
                $query->orderBy('nom_district');
            }
        ])
        ->orderBy('nom_province')
        ->get();

        // Statistiques globales
        $totalDistricts = District::count();
        $districtsWithPrices = District::where('edilitaire', '>', 0)
            ->where('agricole', '>', 0)
            ->where('forestiere', '>', 0)
            ->where('touristique', '>', 0)
            ->count();

        return Inertia::render('location/index', [
            'provinces' => $provinces,
            'stats' => [
                'total_districts' => $totalDistricts,
                'districts_with_prices' => $districtsWithPrices,
                'districts_without_prices' => $totalDistricts - $districtsWithPrices,
                'completion_percentage' => $totalDistricts > 0 
                    ? round(($districtsWithPrices / $totalDistricts) * 100, 2) 
                    : 0
            ]
        ]);
    }

    /**
     * Mettre à jour les prix d'un district
     */
    public function updateDistrictPrices(Request $request)
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
     * Obtenir les détails d'un district
     */
    public function showDistrict($id)
    {
        $district = District::with('region.province')->findOrFail($id);
        
        return response()->json([
            'district' => $district,
            'hierarchy' => [
                'province' => $district->region->province->nom_province,
                'region' => $district->region->nom_region,
                'district' => $district->nom_district,
            ],
            'prices' => [
                'edilitaire' => $district->edilitaire,
                'agricole' => $district->agricole,
                'forestiere' => $district->forestiere,
                'touristique' => $district->touristique,
            ],
            'stats' => $district->getStats(),
        ]);
    }

    /**
     * Obtenir les statistiques d'une région
     */
    public function getRegionStats($id)
    {
        $region = Region::with('districts')->findOrFail($id);
        
        $totalDistricts = $region->districts->count();
        $districtsWithPrices = $region->districts->filter(function ($district) {
            return $district->hasPricesSet();
        })->count();

        return response()->json([
            'region' => $region->nom_region,
            'total_districts' => $totalDistricts,
            'districts_with_prices' => $districtsWithPrices,
            'districts_without_prices' => $totalDistricts - $districtsWithPrices,
            'completion_percentage' => $totalDistricts > 0 
                ? round(($districtsWithPrices / $totalDistricts) * 100, 2) 
                : 0,
        ]);
    }

    /**
     * Obtenir les statistiques d'une province
     */
    public function getProvinceStats($id)
    {
        $province = Province::with('regions.districts')->findOrFail($id);
        
        $totalDistricts = 0;
        $districtsWithPrices = 0;

        foreach ($province->regions as $region) {
            foreach ($region->districts as $district) {
                $totalDistricts++;
                if ($district->hasPricesSet()) {
                    $districtsWithPrices++;
                }
            }
        }

        return response()->json([
            'province' => $province->nom_province,
            'total_regions' => $province->regions->count(),
            'total_districts' => $totalDistricts,
            'districts_with_prices' => $districtsWithPrices,
            'districts_without_prices' => $totalDistricts - $districtsWithPrices,
            'completion_percentage' => $totalDistricts > 0 
                ? round(($districtsWithPrices / $totalDistricts) * 100, 2) 
                : 0,
        ]);
    }

    /**
     * Mettre à jour les prix de plusieurs districts en masse
     */
    public function bulkUpdatePrices(Request $request)
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
    public function resetDistrictPrices(Request $request)
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

    /**
     * Exporter les données de localisation au format CSV
     */
    public function exportLocations()
    {
        $provinces = Province::with('regions.districts')->get();
        
        $filename = 'localisations_' . date('Y-m-d_His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($provinces) {
            $file = fopen('php://output', 'w');
            
            // UTF-8 BOM pour Excel
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // En-têtes
            fputcsv($file, [
                'Province',
                'Région',
                'District',
                'Prix Édilitaire (Ar/m²)',
                'Prix Agricole (Ar/m²)',
                'Prix Forestière (Ar/m²)',
                'Prix Touristique (Ar/m²)',
                'Prix Complets'
            ], ';');
            
            // Données
            foreach ($provinces as $province) {
                foreach ($province->regions as $region) {
                    foreach ($region->districts as $district) {
                        fputcsv($file, [
                            $province->nom_province,
                            $region->nom_region,
                            $district->nom_district,
                            $district->edilitaire ?? 0,
                            $district->agricole ?? 0,
                            $district->forestiere ?? 0,
                            $district->touristique ?? 0,
                            $district->hasPricesSet() ? 'Oui' : 'Non'
                        ], ';');
                    }
                }
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}