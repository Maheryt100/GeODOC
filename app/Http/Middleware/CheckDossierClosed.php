<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demandeur;
use Carbon\Carbon; // ✅ AJOUTÉ

/**
 * Middleware pour empêcher les modifications sur un dossier fermé
 */
class CheckDossierClosed
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $action = 'modify'): Response
    {
        $user = $request->user();
        
        // Super admin et admin district peuvent toujours tout faire
        if ($user->isSuperAdmin() || $user->isAdminDistrict()) {
            return $next($request);
        }

        $dossierId = $this->extractDossierId($request);

        if (!$dossierId) {
            // Si on ne trouve pas d'ID de dossier, on laisse passer
            // (la vérification d'accès se fera ailleurs)
            return $next($request);
        }

        $dossier = Dossier::find($dossierId);

        if (!$dossier) {
            abort(404, 'Dossier introuvable');
        }

        // Vérifier si le dossier est fermé
        if ($dossier->is_closed) {
            // Actions en lecture seule autorisées
            if (in_array($action, ['view', 'read', 'show'])) {
                return $next($request);
            }

            // Toutes les autres actions sont bloquées
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Ce dossier est fermé. Aucune modification n\'est autorisée.',
                    'dossier' => [
                        'id' => $dossier->id,
                        'nom' => $dossier->nom_dossier,
                        'date_fermeture' => $dossier->date_fermeture ? Carbon::parse($dossier->date_fermeture)->format('d/m/Y') : null, // ✅ CORRIGÉ
                        'closed_by' => $dossier->closedBy?->name,
                        'motif' => $dossier->motif_fermeture,
                    ]
                ], 403);
            }

            // ✅ CORRIGÉ : Utiliser Carbon::parse au lieu de date::format
            $dateFermetureFormatted = $dossier->date_fermeture 
                ? Carbon::parse($dossier->date_fermeture)->format('d/m/Y')
                : 'date inconnue';

            return back()->withErrors([
                'error' => "Ce dossier est fermé depuis le {$dateFermetureFormatted}. Aucune modification n'est autorisée."
            ]);
        }

        return $next($request);
    }

    /**
     * Extraire l'ID du dossier depuis la requête
     */
    private function extractDossierId(Request $request): ?int
    {
        // 1. Vérifier dans les paramètres de route
        if ($request->route('id')) {
            $id = $request->route('id');
            return $this->resolveDossierId($id, $request);
        }

        if ($request->route('id_dossier')) {
            return (int) $request->route('id_dossier');
        }

        if ($request->route('dossierId')) {
            return (int) $request->route('dossierId');
        }

        // 2. Vérifier dans les données POST/PUT
        if ($request->has('id_dossier')) {
            return (int) $request->input('id_dossier');
        }

        // 3. Vérifier si c'est une propriété ou un demandeur
        if ($request->route('id_propriete')) {
            $propriete = Propriete::find($request->route('id_propriete'));
            return $propriete?->id_dossier;
        }

        if ($request->has('id_propriete')) {
            $propriete = Propriete::find($request->input('id_propriete'));
            return $propriete?->id_dossier;
        }

        // 4. Pour les demandeurs, vérifier via la table contenir
        if ($request->route('id_demandeur')) {
            $demandeur = Demandeur::with('dossiers')->find($request->route('id_demandeur'));
            return $demandeur?->dossiers->first()?->id;
        }

        return null;
    }

    /**
     * Résoudre l'ID du dossier selon le contexte
     */
    private function resolveDossierId($id, Request $request): ?int
    {
        $routeName = $request->route()->getName();

        // Si c'est une route de dossier directement
        if (str_contains($routeName, 'dossiers.')) {
            return (int) $id;
        }

        // Si c'est une route de propriété
        if (str_contains($routeName, 'proprietes.')) {
            $propriete = Propriete::find($id);
            return $propriete?->id_dossier;
        }

        // Si c'est une route de demandeur
        if (str_contains($routeName, 'demandeurs.')) {
            $demandeur = Demandeur::with('dossiers')->find($id);
            return $demandeur?->dossiers->first()?->id;
        }

        return (int) $id;
    }
}