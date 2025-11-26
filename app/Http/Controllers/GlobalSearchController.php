<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GlobalSearchController extends Controller
{
    /**
     * Recherche globale intelligente
     * Cherche dans : dossiers, propriétés, demandeurs, communes
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        
        // Validation
        if (strlen($query) < 2) {
            return response()->json([
                'dossiers' => [],
                'proprietes' => [],
                'demandeurs' => [],
                'communes' => [],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();
        $searchTerm = '%' . $query . '%';
        
        try {
            // DOSSIERS
            $dossiersQuery = Dossier::withCount(['demandeurs', 'proprietes'])
                ->where(function($q) use ($searchTerm) {
                    $q->where('nom_dossier', 'ilike', $searchTerm)
                      ->orWhere('numero_ouverture', 'ilike', $searchTerm)
                      ->orWhere('commune', 'ilike', $searchTerm)
                      ->orWhere('fokontany', 'ilike', $searchTerm);
                });

            // Filtrer par district si nécessaire
            if (!$user->canAccessAllDistricts()) {
                $dossiersQuery->where('id_district', $user->id_district);
            }

            $dossiers = $dossiersQuery->orderBy('date_ouverture', 'desc')
                ->limit(5)
                ->get()
                ->map(function($d) {
                    return [
                        'id' => $d->id,
                        'nom_dossier' => $d->nom_dossier,
                        'numero_ouverture' => $d->numero_ouverture,
                        'type_commune' => $d->type_commune,
                        'commune' => $d->commune,
                        'fokontany' => $d->fokontany,
                        'circonscription' => $d->circonscription,
                        'demandeurs_count' => $d->demandeurs_count,
                        'proprietes_count' => $d->proprietes_count,
                        'is_closed' => $d->is_closed,
                    ];
                });

            // PROPRIÉTÉS
            $proprietesQuery = Propriete::with('dossier:id,nom_dossier,id_district')
                ->where(function($q) use ($searchTerm, $query) {
                    $q->where('lot', 'ilike', $searchTerm)
                      ->orWhere('titre', 'ilike', $searchTerm)
                      ->orWhere('proprietaire', 'ilike', $searchTerm)
                      ->orWhere('dep_vol', 'ilike', $searchTerm)
                      ->orWhere('numero_dep_vol', 'ilike', $searchTerm);
                    
                    // Recherche exacte pour dep_vol complet (ex: "299:041")
                    if (preg_match('/^\d+:\d+$/', $query)) {
                        $parts = explode(':', $query);
                        $q->orWhere(function($q2) use ($parts) {
                            $q2->where('dep_vol', $parts[0])
                               ->where('numero_dep_vol', $parts[1]);
                        });
                    }
                });

            // Filtrer par district
            if (!$user->canAccessAllDistricts()) {
                $proprietesQuery->whereHas('dossier', function($q) use ($user) {
                    $q->where('id_district', $user->id_district);
                });
            }

            $proprietes = $proprietesQuery->limit(5)
                ->get()
                ->map(function($p) {
                    return [
                        'id' => $p->id,
                        'lot' => $p->lot,
                        'titre' => $p->titre,
                        'dep_vol_complet' => $p->dep_vol_complet,
                        'contenance' => $p->contenance,
                        'nature' => $p->nature,
                        'vocation' => $p->vocation,
                        'proprietaire' => $p->proprietaire,
                        'is_archived' => $p->is_archived,
                        'id_dossier' => $p->id_dossier,
                        'dossier' => $p->dossier ? [
                            'nom_dossier' => $p->dossier->nom_dossier
                        ] : null,
                    ];
                });

            // DEMANDEURS
            $demandeursQuery = Demandeur::with(['dossiers:id,nom_dossier'])
                ->withCount('proprietes')
                ->where(function($q) use ($searchTerm, $query) {
                    $q->where('nom_demandeur', 'ilike', $searchTerm)
                      ->orWhere('prenom_demandeur', 'ilike', $searchTerm)
                      ->orWhere('occupation', 'ilike', $searchTerm)
                      ->orWhere('telephone', 'like', $searchTerm);
                    
                    // Recherche exacte par CIN (12 chiffres)
                    if (preg_match('/^\d{12}$/', $query)) {
                        $q->orWhere('cin', $query);
                    } else {
                        $q->orWhere('cin', 'like', $searchTerm);
                    }
                });

            // Filtrer par district
            if (!$user->canAccessAllDistricts()) {
                $demandeursQuery->whereHas('dossiers', function($q) use ($user) {
                    $q->where('id_district', $user->id_district);
                });
            }

            $demandeurs = $demandeursQuery->limit(5)
                ->get()
                ->map(function($d) {
                    return [
                        'id' => $d->id,
                        'titre_demandeur' => $d->titre_demandeur,
                        'nom_demandeur' => $d->nom_demandeur,
                        'prenom_demandeur' => $d->prenom_demandeur,
                        'cin' => $d->cin,
                        'occupation' => $d->occupation,
                        'telephone' => $d->telephone,
                        'proprietes_count' => $d->proprietes_count,
                        'dossiers_count' => $d->dossiers->count(),
                        'dossiers' => $d->dossiers->map(fn($dos) => [
                            'id' => $dos->id,
                            'nom_dossier' => $dos->nom_dossier
                        ]),
                    ];
                });

            // COMMUNES (groupées par dossier)
            $communesQuery = Dossier::select('commune', 'type_commune', 'fokontany', 'circonscription', 'id_district')
                ->selectRaw('COUNT(*) as dossiers_count')
                ->selectRaw('MAX(id) as id')
                ->where(function($q) use ($searchTerm) {
                    $q->where('commune', 'ilike', $searchTerm)
                      ->orWhere('fokontany', 'ilike', $searchTerm)
                      ->orWhere('circonscription', 'ilike', $searchTerm);
                })
                ->groupBy('commune', 'type_commune', 'fokontany', 'circonscription', 'id_district');

            if (!$user->canAccessAllDistricts()) {
                $communesQuery->where('id_district', $user->id_district);
            }

            $communes = $communesQuery->limit(5)
                ->get()
                ->map(function($c) {
                    return [
                        'id' => $c->id,
                        'commune' => $c->commune,
                        'type_commune' => $c->type_commune,
                        'fokontany' => $c->fokontany,
                        'circonscription' => $c->circonscription,
                        'dossiers_count' => $c->dossiers_count,
                    ];
                });

            // Log de la recherche pour analytics
            Log::info('Global search', [
                'user_id' => $user->id,
                'query' => $query,
                'results_count' => $dossiers->count() + $proprietes->count() + $demandeurs->count() + $communes->count()
            ]);

            return response()->json([
                'dossiers' => $dossiers,
                'proprietes' => $proprietes,
                'demandeurs' => $demandeurs,
                'communes' => $communes,
            ]);

        } catch (\Exception $e) {
            Log::error('Global search error', [
                'query' => $query,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'dossiers' => [],
                'proprietes' => [],
                'demandeurs' => [],
                'communes' => [],
                'error' => 'Erreur de recherche'
            ], 500);
        }
    }

    /**
     * Suggestions de recherche basées sur l'historique
     */
    public function suggestions(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        try {
            // Récupérer les dernières recherches populaires
            $recentDossiers = Dossier::select('nom_dossier', 'id')
                ->where('id_district', $user->canAccessAllDistricts() ? '>' : '=', $user->canAccessAllDistricts() ? 0 : $user->id_district)
                ->orderBy('updated_at', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($d) => [
                    'type' => 'dossier',
                    'label' => $d->nom_dossier,
                    'value' => $d->nom_dossier,
                    'id' => $d->id
                ]);

            $recentCommunes = Dossier::select('commune')
                ->where('id_district', $user->canAccessAllDistricts() ? '>' : '=', $user->canAccessAllDistricts() ? 0 : $user->id_district)
                ->groupBy('commune')
                ->orderByRaw('COUNT(*) DESC')
                ->limit(5)
                ->pluck('commune')
                ->map(fn($c) => [
                    'type' => 'commune',
                    'label' => $c,
                    'value' => $c
                ]);

            return response()->json([
                'suggestions' => $recentDossiers->concat($recentCommunes)
            ]);

        } catch (\Exception $e) {
            Log::error('Search suggestions error', ['error' => $e->getMessage()]);
            return response()->json(['suggestions' => []]);
        }
    }
}