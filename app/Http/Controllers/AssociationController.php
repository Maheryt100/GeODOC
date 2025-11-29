<?php

namespace App\Http\Controllers;

use App\Events\AssociationCreated;
use App\Events\AssociationDissociated;
use App\Models\Contenir;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AssociationController extends Controller
{
    /**
     * ✅ LIER : Associer un demandeur à une propriété
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
            $propriete = Propriete::with('dossier')->findOrFail($validated['id_propriete']);
            
            // ✅ Vérifications de sécurité
            $this->validateLinkage($propriete, $demandeur, $validated['id_dossier']);
            
            // ✅ Ajouter au dossier si nécessaire
            $this->ensureDemandeurInDossier($validated['id_demandeur'], $validated['id_dossier']);
            
            // ✅ Compter les demandeurs existants pour status_consort
            $demandeursCount = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', 'active')
                ->count();
            
            // ✅ Créer l'association (le prix est calculé par l'Observer)
            $demande = Demander::create([
                'id_demandeur' => $validated['id_demandeur'],
                'id_propriete' => $validated['id_propriete'],
                'id_user' => Auth::id(),
                'status' => 'active',
                'status_consort' => $demandeursCount > 0,
            ]);
            
            // ✅ Activer la propriété
            $propriete->update(['status' => true]);
            
            // ✅ Déclencher l'événement d'audit
            event(new AssociationCreated($demande, Auth::user()));
            
            DB::commit();
            
            Log::info('✅ Association créée', [
                'demandeur_id' => $validated['id_demandeur'],
                'propriete_id' => $validated['id_propriete'],
                'user_id' => Auth::id(),
                'prix_calcule' => $demande->total_prix
            ]);
            
            return back()->with('success', 'Association créée avec succès');
            
        } catch (ValidationException $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Erreur création association', [
                'data' => $validated,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de la création : ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ DISSOCIER : Retirer un demandeur d'une propriété
     */
    public function dissociate(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
            'reason' => 'nullable|string|max:500', // ✅ NOUVEAU : raison optionnelle
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::with('dossier')->findOrFail($validated['id_propriete']);
            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            
            // ✅ Vérifications de sécurité
            $this->validateDissociation($propriete);
            
            // ✅ Trouver l'association
            $demande = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->where('status', 'active')
                ->first();

            if (!$demande) {
                throw ValidationException::withMessages([
                    'error' => 'Association introuvable ou déjà supprimée'
                ]);
            }

            // ✅ Vérifier si la propriété est archivée via cette demande
            if ($demande->status === 'archive') {
                throw ValidationException::withMessages([
                    'error' => 'Impossible de dissocier : cette propriété a été acquise par ce demandeur'
                ]);
            }

            // ✅ Supprimer l'association
            $demande->delete();

            // ✅ Mettre à jour le statut de la propriété si plus de demandeurs actifs
            $hasActiveDemandeurs = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', 'active')
                ->exists();

            if (!$hasActiveDemandeurs) {
                $propriete->update(['status' => false]);
            }

            // ✅ Déclencher l'événement d'audit
            event(new AssociationDissociated(
                $demandeur,
                $propriete,
                Auth::user(),
                $validated['reason'] ?? null
            ));

            DB::commit();

            Log::info('✅ Association dissociée', [
                'demandeur_id' => $validated['id_demandeur'],
                'demandeur_nom' => $demandeur->nom_complet,
                'propriete_id' => $validated['id_propriete'],
                'propriete_lot' => $propriete->lot,
                'user_id' => Auth::id(),
                'reason' => $validated['reason'] ?? 'Non spécifiée'
            ]);

            return back()->with('success', 'Association supprimée avec succès');

        } catch (ValidationException $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Erreur dissociation', [
                'request' => $validated,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['error' => 'Erreur lors de la dissociation : ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ HELPER : Valider la liaison
     */
    private function validateLinkage(Propriete $propriete, Demandeur $demandeur, int $dossierId): void
    {
        // Vérifier que la propriété appartient au dossier
        if ($propriete->id_dossier != $dossierId) {
            throw ValidationException::withMessages([
                'error' => 'La propriété n\'appartient pas à ce dossier'
            ]);
        }
        
        // Vérifier que le dossier n'est pas fermé
        if ($propriete->dossier && $propriete->dossier->is_closed) {
            throw ValidationException::withMessages([
                'error' => 'Impossible de lier : le dossier est fermé'
            ]);
        }
        
        // Vérifier que la propriété n'est pas archivée
        $isArchived = Demander::where('id_propriete', $propriete->id)
            ->where('status', 'archive')
            ->exists();
            
        if ($isArchived || $propriete->is_archived) {
            throw ValidationException::withMessages([
                'error' => 'Cette propriété est archivée (acquise)'
            ]);
        }
        
        // Vérifier que l'association n'existe pas déjà
        $existingLink = Demander::where('id_demandeur', $demandeur->id)
            ->where('id_propriete', $propriete->id)
            ->exists();
            
        if ($existingLink) {
            throw ValidationException::withMessages([
                'error' => 'Ce demandeur est déjà lié à cette propriété'
            ]);
        }
    }

    /**
     * ✅ HELPER : Valider la dissociation
     */
    private function validateDissociation(Propriete $propriete): void
    {
        // Vérifier que le dossier n'est pas fermé
        if ($propriete->dossier && $propriete->dossier->is_closed) {
            throw ValidationException::withMessages([
                'error' => 'Impossible de dissocier : le dossier est fermé'
            ]);
        }
        
        // Vérifier que la propriété n'est pas archivée
        if ($propriete->is_archived) {
            throw ValidationException::withMessages([
                'error' => 'Impossible de dissocier : la propriété est archivée (acquise)'
            ]);
        }
    }

    /**
     * ✅ HELPER : S'assurer que le demandeur est dans le dossier
     */
    private function ensureDemandeurInDossier(int $demandeurId, int $dossierId): void
    {
        $exists = Contenir::where('id_demandeur', $demandeurId)
            ->where('id_dossier', $dossierId)
            ->exists();
            
        if (!$exists) {
            Contenir::create([
                'id_demandeur' => $demandeurId,
                'id_dossier' => $dossierId,
            ]);
            
            Log::info('➕ Demandeur ajouté au dossier', [
                'demandeur_id' => $demandeurId,
                'dossier_id' => $dossierId
            ]);
        }
    }

    /**
     * ✅ API : Obtenir les propriétés d'un demandeur avec statistiques
     */
    public function getDemandeurProprietes($id_demandeur)
    {
        try {
            $demandeur = Demandeur::with([
                'demandes.propriete.dossier'
            ])->findOrFail($id_demandeur);
            
            $proprietes = $demandeur->demandes->map(function ($demande) {
                $propriete = $demande->propriete;
                
                return [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                    'nature' => $propriete->nature,
                    'vocation' => $propriete->vocation,
                    'situation' => $propriete->situation,
                    'status' => $propriete->status,
                    'is_archived' => $propriete->is_archived,
                    'dossier_nom' => $propriete->dossier->nom_dossier ?? 'N/A',
                    'dossier_closed' => $propriete->dossier->is_closed ?? false,
                    'demande_id' => $demande->id,
                    'demande_status' => $demande->status,
                    'total_prix' => $demande->total_prix,
                    'can_dissociate' => $demande->canBeDissociated(),
                    'autres_demandeurs_count' => $propriete->demandes()
                        ->where('id', '!=', $demande->id)
                        ->where('status', 'active')
                        ->count(),
                ];
            });

            return response()->json([
                'success' => true,
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                    'stats' => $demandeur->getStats(),
                ],
                'proprietes' => $proprietes,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Erreur getDemandeurProprietes', [
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
     * ✅ API : Obtenir les demandeurs d'une propriété avec statistiques
     */
    public function getProprieteDemandeurs($id_propriete)
    {
        try {
            $propriete = Propriete::with([
                'dossier',
                'demandes.demandeur'
            ])->findOrFail($id_propriete);
            
            $demandeurs = $propriete->demandes->map(function ($demande) use ($propriete) {
                $demandeur = $demande->demandeur;
                
                return [
                    'id' => $demandeur->id,
                    'titre' => $demandeur->titre_demandeur,
                    'nom' => $demandeur->nom_demandeur,
                    'prenom' => $demandeur->prenom_demandeur,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                    'occupation' => $demandeur->occupation,
                    'telephone' => $demandeur->telephone,
                    'demande_id' => $demande->id,
                    'demande_status' => $demande->status,
                    'total_prix' => $demande->total_prix,
                    'is_archived' => $demande->status === 'archive',
                    'can_dissociate' => $demande->canBeDissociated(),
                    'stats' => $demandeur->getStats(),
                ];
            });

            $stats = $propriete->getStats();

            return response()->json([
                'success' => true,
                'propriete' => [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                    'status' => $propriete->status,
                    'is_archived' => $propriete->is_archived,
                    'dossier_closed' => $propriete->dossier->is_closed ?? false,
                    'stats' => $stats,
                ],
                'demandeurs' => $demandeurs,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Erreur getProprieteDemandeurs', [
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
     * ✅ NOUVEAU : Obtenir l'historique des associations d'un dossier
     */
    public function getAssociationHistory($id_dossier)
    {
        try {
            // Lire depuis le fichier de log audit
            $logPath = storage_path('logs/audit.log');
            
            if (!file_exists($logPath)) {
                return response()->json([
                    'success' => true,
                    'history' => []
                ]);
            }

            // Parser les logs (simplifié - à améliorer avec une vraie DB)
            $logs = file($logPath);
            $history = [];

            foreach (array_reverse($logs) as $line) {
                if (strpos($line, 'Association') !== false) {
                    $history[] = json_decode(substr($line, strpos($line, '{')), true);
                }
                
                if (count($history) >= 50) break; // Limiter à 50 entrées
            }

            return response()->json([
                'success' => true,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique'
            ], 500);
        }
    }
}