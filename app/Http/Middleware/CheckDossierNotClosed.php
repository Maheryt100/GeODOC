<?php

namespace App\Http\Middleware;

use App\Models\Dossier;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDossierNotClosed
{
    /**
     * Vérifier que le dossier n'est pas fermé avant d'autoriser les modifications
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Récupérer l'ID du dossier depuis la route ou la requête
        $dossierId = $request->route('id_dossier') 
                    ?? $request->route('dossierId')
                    ?? $request->input('id_dossier');

        if (!$dossierId) {
            // Si pas de dossier_id, chercher via propriete ou demandeur
            $proprieteId = $request->route('id_propriete') ?? $request->input('id_propriete');
            $demandeurId = $request->route('id_demandeur') ?? $request->input('id_demandeur');

            if ($proprieteId) {
                $propriete = \App\Models\Propriete::find($proprieteId);
                $dossierId = $propriete?->id_dossier;
            } elseif ($demandeurId) {
                // Trouver le dossier via la relation
                $demandeur = \App\Models\Demandeur::with('dossiers')->find($demandeurId);
                $dossierId = $demandeur?->dossiers->first()?->id;
            }
        }

        if ($dossierId) {
            $dossier = Dossier::find($dossierId);
            
            if ($dossier && $dossier->is_closed) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Action interdite : le dossier est fermé'
                    ], 403);
                }

                return back()->withErrors([
                    'error' => 'Action interdite : le dossier est fermé'
                ])->with('error', 'Ce dossier est fermé et ne peut plus être modifié.');
            }
        }

        return $next($request);
    }
}