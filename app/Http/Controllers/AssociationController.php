<?php

namespace App\Http\Controllers;

use App\Models\Contenir;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AssociationController extends Controller
{
    /**
     * ✅ NOUVELLE ROUTE UNIFIÉE : Lier un demandeur à une propriété
     * Remplace les anciennes routes complexes
     */
    public function link(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        DB::beginTransaction();
        
        try {
            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            $propriete = Propriete::findOrFail($validated['id_propriete']);
            
            // Vérifier que la propriété appartient au dossier
            if ($propriete->id_dossier != $validated['id_dossier']) {
                DB::rollBack();
                return back()->withErrors(['error' => 'La propriété n\'appartient pas à ce dossier']);
            }
            
            // Vérifier que la propriété n'est pas archivée
            $isArchived = Demander::where('id_propriete', $propriete->id)
                ->where('status', 'archive')
                ->exists();
                
            if ($isArchived) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Cette propriété est archivée (acquise)']);
            }
            
            // Vérifier que l'association n'existe pas déjà
            $existingLink = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->exists();
                
            if ($existingLink) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Ce demandeur est déjà lié à cette propriété']);
            }
            
            // Vérifier que le demandeur est dans le dossier
            $demandeInDossier = Contenir::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_dossier', $validated['id_dossier'])
                ->exists();
                
            if (!$demandeInDossier) {
                // Ajouter le demandeur au dossier s'il n'y est pas
                Contenir::create([
                    'id_demandeur' => $validated['id_demandeur'],
                    'id_dossier' => $validated['id_dossier'],
                ]);
            }
            
            // Compter les demandeurs existants pour définir status_consort
            $demandeursCount = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', 'active')
                ->count();
            
            // Créer l'association
            Demander::create([
                'id_demandeur' => $validated['id_demandeur'],
                'id_propriete' => $validated['id_propriete'],
                'id_user' => Auth::id(),
                'status' => 'active',
                'status_consort' => $demandeursCount > 0,
                'total_prix' => 0,
            ]);
            
            // Mettre à jour le statut de la propriété
            $propriete->update(['status' => true]);
            
            DB::commit();
            
            Log::info('Association créée', [
                'demandeur_id' => $validated['id_demandeur'],
                'propriete_id' => $validated['id_propriete'],
                'user_id' => Auth::id()
            ]);
            
            return back()->with('success', 'Association créée avec succès');
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur création association', [
                'data' => $validated,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de la création : ' . $e->getMessage()]);
        }
    }

    /**
     * Obtenir les propriétés associées à un demandeur
     */
    public function getDemandeurProprietes($id_demandeur)
    {
        try {
            $demandeur = Demandeur::findOrFail($id_demandeur);
            
            $proprietes = $demandeur->proprietes()
                ->with('dossier')
                ->get()
                ->map(function ($propriete) {
                    return [
                        'id' => $propriete->id,
                        'lot' => $propriete->lot,
                        'titre' => $propriete->titre,
                        'contenance' => $propriete->contenance,
                        'nature' => $propriete->nature,
                        'vocation' => $propriete->vocation,
                        'situation' => $propriete->situation,
                        'status' => $propriete->status,
                        'dossier_nom' => $propriete->dossier->nom_dossier ?? 'N/A',
                        'pivot_id' => $propriete->pivot->id,
                        'pivot_status' => $propriete->pivot->status,
                        'is_archived' => $propriete->pivot->status === 'archive',
                    ];
                });

            return response()->json([
                'success' => true,
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => trim("{$demandeur->titre_demandeur} {$demandeur->nom_demandeur} {$demandeur->prenom_demandeur}"),
                    'cin' => $demandeur->cin,
                ],
                'proprietes' => $proprietes,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getDemandeurProprietes', [
                'id_demandeur' => $id_demandeur,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des propriétés'
            ], 500);
        }
    }

    /**
     * Obtenir les demandeurs associés à une propriété
     */
    public function getProprieteDemandeurs($id_propriete)
    {
        try {
            $propriete = Propriete::findOrFail($id_propriete);
            
            $demandeurs = $propriete->demandeurs()
                ->get()
                ->map(function ($demandeur) {
                    return [
                        'id' => $demandeur->id,
                        'titre' => $demandeur->titre_demandeur,
                        'nom' => $demandeur->nom_demandeur,
                        'prenom' => $demandeur->prenom_demandeur,
                        'cin' => $demandeur->cin,
                        'occupation' => $demandeur->occupation,
                        'telephone' => $demandeur->telephone,
                        'pivot_id' => $demandeur->pivot->id,
                        'pivot_status' => $demandeur->pivot->status,
                        'is_archived' => $demandeur->pivot->status === 'archive',
                    ];
                });

            return response()->json([
                'success' => true,
                'propriete' => [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                    'status' => $propriete->status,
                ],
                'demandeurs' => $demandeurs,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getProprieteDemandeurs', [
                'id_propriete' => $id_propriete,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandeurs'
            ], 500);
        }
    }

    /**
     * Dissocier un demandeur d'une propriété
     */
    public function dissociate(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            DB::beginTransaction();

            // Trouver l'association
            $demander = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->where('status', 'active')
                ->first();

            if (!$demander) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Association introuvable ou déjà archivée']);
            }

            // Vérifier si la propriété est archivée (acquise)
            if ($demander->status === 'archive') {
                DB::rollBack();
                return back()->withErrors(['error' => 'Impossible de dissocier : cette propriété a été acquise par ce demandeur']);
            }

            // Supprimer l'association
            $demander->delete();

            // Mettre à jour le statut de la propriété si elle n'a plus de demandeurs actifs
            $propriete = Propriete::find($validated['id_propriete']);
            $hasActiveDemandeurs = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', 'active')
                ->exists();

            if (!$hasActiveDemandeurs) {
                $propriete->update(['status' => false]);
            }

            DB::commit();

            Log::info('Association dissociée', [
                'id_demandeur' => $validated['id_demandeur'],
                'id_propriete' => $validated['id_propriete']
            ]);

            return back()->with('success', 'Association supprimée avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur dissociation', [
                'request' => $validated,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['error' => 'Erreur lors de la dissociation']);
        }
    }
}