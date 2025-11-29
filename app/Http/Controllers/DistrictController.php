<?php

namespace App\Http\Controllers;

use App\Models\District;
use App\Models\Province;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Auth};
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\{JsonResponse, RedirectResponse};
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DistrictController extends Controller
{
    /**
     * Afficher la hiérarchie complète des localisations
     * ✅ CORRIGÉ : Utilise 'location/index' au lieu de 'circonscription/index'
     */
    public function index(): Response
    {
        try {
            // Charger toute la hiérarchie Province > Région > District
            $provinces = Province::with([
                'regions' => function ($query) {
                    $query->orderBy('nom_region');
                },
                'regions.districts' => function ($query) {
                    $query->orderBy('nom_district')
                        ->select([
                            'id',
                            'nom_district',
                            'id_region',
                            'edilitaire',
                            'agricole',
                            'forestiere',
                            'touristique'
                        ]);
                }
            ])
            ->orderBy('nom_province')
            ->get();

            // ✅ Statistiques globales optimisées avec une seule requête
            $stats = District::selectRaw('
                COUNT(*) as total_districts,
                SUM(CASE 
                    WHEN edilitaire > 0 
                    AND agricole > 0 
                    AND forestiere > 0 
                    AND touristique > 0 
                    THEN 1 
                    ELSE 0 
                END) as districts_with_prices
            ')->first();

            // ✅ CORRECTION PRINCIPALE : Utiliser 'location/index' au lieu de 'circonscription/index'
            return Inertia::render('location/index', [
                'provinces' => $provinces,
                'stats' => [
                    'total_districts' => $stats->total_districts ?? 0,
                    'districts_with_prices' => $stats->districts_with_prices ?? 0,
                    'districts_without_prices' => ($stats->total_districts ?? 0) - ($stats->districts_with_prices ?? 0),
                    'completion_percentage' => ($stats->total_districts ?? 0) > 0 
                        ? round((($stats->districts_with_prices ?? 0) / $stats->total_districts) * 100, 2) 
                        : 0
                ]
            ]);

        } catch (\Exception $e) {
            return Inertia::render('location/index', [
                'provinces' => [],
                'stats' => [
                    'total_districts' => 0,
                    'districts_with_prices' => 0,
                    'districts_without_prices' => 0,
                    'completion_percentage' => 0
                ]
            ])->with('error', 'Erreur lors du chargement des localisations : ' . $e->getMessage());
        }
    }

    /**
     * ✅ Mettre à jour les prix d'un district avec validation améliorée
     */
    public function update(Request $request): RedirectResponse
    {
        // ✅ Validation améliorée avec messages personnalisés
        $validated = $request->validate([
            'id' => 'required|integer|exists:districts,id',
            'edilitaire' => 'required|numeric|min:0|max:999999999',
            'agricole' => 'required|numeric|min:0|max:999999999',
            'forestiere' => 'required|numeric|min:0|max:999999999',
            'touristique' => 'required|numeric|min:0|max:999999999',
        ], [
            'id.required' => 'L\'identifiant du district est requis',
            'id.exists' => 'Le district sélectionné n\'existe pas',
            '*.required' => 'Le prix :attribute est requis',
            '*.numeric' => 'Le prix :attribute doit être un nombre',
            '*.min' => 'Le prix :attribute ne peut pas être négatif',
            '*.max' => 'Le prix :attribute est trop élevé',
        ]);

        DB::beginTransaction();
        try {
            $district = District::findOrFail($validated['id']);
            
            // ✅ Log des anciennes valeurs pour audit
            $oldPrices = [
                'edilitaire' => $district->edilitaire,
                'agricole' => $district->agricole,
                'forestiere' => $district->forestiere,
                'touristique' => $district->touristique,
            ];

            // ✅ Mise à jour avec arrondi à 2 décimales
            $district->update([
                'edilitaire' => round($validated['edilitaire'], 2),
                'agricole' => round($validated['agricole'], 2),
                'forestiere' => round($validated['forestiere'], 2),
                'touristique' => round($validated['touristique'], 2),
            ]);

            // ✅ Log d'activité si disponible
            $this->logDistrictActivity($district, 'update_prices', [
                'old' => $oldPrices, 
                'new' => $validated
            ]);

            DB::commit();

            return back()->with('success', 
                "Prix mis à jour avec succès pour le district {$district->nom_district}"
            );
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 
                'Une erreur est survenue lors de la mise à jour : ' . $e->getMessage()
            );
        }
    }

    /**
     * ✅ Mettre à jour les prix de plusieurs districts en masse (optimisé)
     */
    public function bulkUpdate(Request $request): RedirectResponse
    {
        // ✅ Validation améliorée
        $validated = $request->validate([
            'districts' => 'required|array|min:1|max:100',
            'districts.*.id' => 'required|integer|exists:districts,id',
            'districts.*.edilitaire' => 'required|numeric|min:0|max:999999999',
            'districts.*.agricole' => 'required|numeric|min:0|max:999999999',
            'districts.*.forestiere' => 'required|numeric|min:0|max:999999999',
            'districts.*.touristique' => 'required|numeric|min:0|max:999999999',
        ], [
            'districts.required' => 'Aucun district sélectionné',
            'districts.max' => 'Vous ne pouvez pas mettre à jour plus de 100 districts à la fois',
            'districts.*.id.exists' => 'Un des districts sélectionnés n\'existe pas',
        ]);

        DB::beginTransaction();
        try {
            $updated = 0;
            
            // ✅ Vérification des permissions si nécessaire
            if (!$this->canUpdateDistricts()) {
                throw ValidationException::withMessages([
                    'permission' => 'Vous n\'avez pas la permission de modifier ces districts'
                ]);
            }

            // ✅ Update en batch pour optimiser les performances
            foreach ($validated['districts'] as $districtData) {
                District::where('id', $districtData['id'])
                    ->update([
                        'edilitaire' => round($districtData['edilitaire'], 2),
                        'agricole' => round($districtData['agricole'], 2),
                        'forestiere' => round($districtData['forestiere'], 2),
                        'touristique' => round($districtData['touristique'], 2),
                        'updated_at' => now(),
                    ]);
                $updated++;
            }

            DB::commit();

            return back()->with('success', 
                "$updated district(s) mis à jour avec succès"
            );
            
        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 
                'Une erreur est survenue lors de la mise à jour en masse : ' . $e->getMessage()
            );
        }
    }

    /**
     * ✅ Réinitialiser les prix d'un district avec confirmation
     */
    public function resetPrices(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => 'required|integer|exists:districts,id',
            'confirm' => 'sometimes|boolean|accepted',
        ], [
            'confirm.accepted' => 'Vous devez confirmer la réinitialisation',
        ]);

        DB::beginTransaction();
        try {
            $district = District::findOrFail($validated['id']);
            
            // ✅ Log avant réinitialisation
            $oldPrices = [
                'edilitaire' => $district->edilitaire,
                'agricole' => $district->agricole,
                'forestiere' => $district->forestiere,
                'touristique' => $district->touristique,
            ];

            $district->update([
                'edilitaire' => 0,
                'agricole' => 0,
                'forestiere' => 0,
                'touristique' => 0,
            ]);

            // ✅ Log d'activité
            $this->logDistrictActivity($district, 'reset_prices', ['old' => $oldPrices]);

            DB::commit();

            return back()->with('success', 
                "Prix réinitialisés pour le district {$district->nom_district}"
            );
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 
                'Une erreur est survenue lors de la réinitialisation : ' . $e->getMessage()
            );
        }
    }

    /**
     * ✅ NOUVEAU : Obtenir les détails d'un district (API)
     */
    public function show(int $id): JsonResponse
    {
        try {
            $district = District::with([
                'region:id,nom_region,id_province',
                'region.province:id,nom_province'
            ])
            ->select([
                'id',
                'nom_district',
                'id_region',
                'edilitaire',
                'agricole',
                'forestiere',
                'touristique',
                'updated_at'
            ])
            ->findOrFail($id);

            return response()->json([
                'district' => $district,
                'hierarchy' => [
                    'province' => $district->region->province->nom_province ?? 'N/A',
                    'region' => $district->region->nom_region ?? 'N/A',
                    'district' => $district->nom_district,
                ],
                'prices_complete' => $district->hasPricesSet(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'District non trouvé'
            ], 404);
        }
    }

    /**
     * ✅ NOUVEAU : Exporter les prix au format CSV
     */
    public function export(): StreamedResponse|RedirectResponse
    {
        try {
            $provinces = Province::with([
                'regions.districts' => function ($query) {
                    $query->orderBy('nom_district');
                }
            ])
            ->orderBy('nom_province')
            ->get();

            $filename = 'prix_districts_' . date('Y-m-d_His') . '.csv';
            
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
                    'Statut',
                    'Dernière Mise à Jour'
                ], ';');
                
                // Données
                foreach ($provinces as $province) {
                    foreach ($province->regions as $region) {
                        foreach ($region->districts as $district) {
                            fputcsv($file, [
                                $province->nom_province,
                                $region->nom_region,
                                $district->nom_district,
                                number_format($district->edilitaire ?? 0, 2, ',', ' '),
                                number_format($district->agricole ?? 0, 2, ',', ' '),
                                number_format($district->forestiere ?? 0, 2, ',', ' '),
                                number_format($district->touristique ?? 0, 2, ',', ' '),
                                $district->hasPricesSet() ? 'Complet' : 'Incomplet',
                                $district->updated_at ? $district->updated_at->format('d/m/Y H:i') : 'N/A'
                            ], ';');
                        }
                    }
                }
                
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return back()->with('error', 
                'Erreur lors de l\'export : ' . $e->getMessage()
            );
        }
    }

    /**
     * ✅ NOUVEAU : Rechercher des districts par nom
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:100',
        ]);

        try {
            $districts = District::with([
                'region:id,nom_region,id_province',
                'region.province:id,nom_province'
            ])
            ->where('nom_district', 'LIKE', '%' . $validated['query'] . '%')
            ->orderBy('nom_district')
            ->limit(20)
            ->get()
            ->map(function ($district) {
                return [
                    'id' => $district->id,
                    'nom_district' => $district->nom_district,
                    'region' => $district->region->nom_region ?? 'N/A',
                    'province' => $district->region->province->nom_province ?? 'N/A',
                    'prices_complete' => $district->hasPricesSet(),
                ];
            });

            return response()->json([
                'results' => $districts,
                'count' => $districts->count(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la recherche'
            ], 500);
        }
    }

    // ============================================================================
    // MÉTHODES PRIVÉES HELPER
    // ============================================================================

    /**
     * Obtenir l'utilisateur actuellement connecté
     */
    private function getCurrentUser(): ?User
    {
        /** @var User|null */
        return Auth::user();
    }

    /**
     * Vérifier si l'utilisateur peut mettre à jour les districts
     */
    private function canUpdateDistricts(): bool
    {
        $user = $this->getCurrentUser();
        return $user !== null && $user->canUpdate();
    }

    /**
     * Logger une activité sur un district
     */
    private function logDistrictActivity(District $district, string $action, array $details = []): void
    {
        $user = $this->getCurrentUser();
        
        if ($user && method_exists($district, 'logActivity')) {
            $district->logActivity($action, $user->id, $details);
        }
    }
}