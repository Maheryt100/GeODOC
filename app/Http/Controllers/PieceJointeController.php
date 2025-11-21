<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PieceJointe;
use App\Models\Dossier;
use App\Models\Demandeur;
use App\Models\Propriete;
use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PieceJointeController extends Controller
{
    /**
     * Upload de pièces jointes
     */
    public function upload(Request $request)
    {
        $request->validate([
            'files' => 'required|array|min:1|max:10',
            'files.*' => 'required|file|max:10240', // 10 MB max
            'attachable_type' => 'required|in:Dossier,Demandeur,Propriete',
            'attachable_id' => 'required|integer',
            'type_document' => 'nullable|string|max:50',
            'descriptions' => 'nullable|array',
            'descriptions.*' => 'nullable|string|max:500',
        ]);

        try {
            // Récupérer l'entité
            $modelClass = "App\\Models\\" . $request->attachable_type;
            $entity = $modelClass::findOrFail($request->attachable_id);

            // Vérifier les permissions
            if (!$this->canManagePiecesJointes($entity)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            $uploaded = [];
            $errors = [];
            
            DB::beginTransaction();

            foreach ($request->file('files') as $index => $file) {
                // Valider le fichier
                $validation = UploadService::validateFile($file);
                
                if (!$validation['valid']) {
                    $errors[] = [
                        'file' => $file->getClientOriginalName(),
                        'errors' => $validation['errors']
                    ];
                    continue;
                }

                // Description optionnelle
                $description = $request->descriptions[$index] ?? null;

                // Uploader
                $piece = $entity->ajouterPieceJointe(
                    $file,
                    $request->type_document,
                    $description,
                    Auth::id(),
                    $entity->id_district ?? Auth::user()->id_district
                );

                // Optimiser si c'est une image
                if ($piece->isImage()) {
                    UploadService::optimizeImage($file, $piece->chemin);
                }

                $uploaded[] = $piece;

                Log::info('Pièce jointe uploadée', [
                    'piece_id' => $piece->id,
                    'entity' => $request->attachable_type,
                    'entity_id' => $request->attachable_id,
                    'user_id' => Auth::id()
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($uploaded) . ' fichier(s) uploadé(s) avec succès',
                'uploaded' => $uploaded,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur upload pièces jointes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lister les pièces jointes d'une entité
     */
    public function index(Request $request)
    {
        $request->validate([
            'attachable_type' => 'required|in:Dossier,Demandeur,Propriete',
            'attachable_id' => 'required|integer',
        ]);

        try {
            $modelClass = "App\\Models\\" . $request->attachable_type;
            $entity = $modelClass::findOrFail($request->attachable_id);

            $pieces = $entity->piecesJointes()
                ->with(['user:id,name', 'verifiedBy:id,name'])
                ->get();

            return response()->json([
                'success' => true,
                'pieces_jointes' => $pieces
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Télécharger une pièce jointe
     */
    public function download($id)
    {
        try {
            $piece = PieceJointe::findOrFail($id);

            // Vérifier les permissions
            if (!$this->canAccessPieceJointe($piece)) {
                abort(403, 'Accès non autorisé');
            }

            if (!$piece->exists()) {
                abort(404, 'Fichier introuvable');
            }

            // Logger le téléchargement
            Log::info('Téléchargement pièce jointe', [
                'piece_id' => $piece->id,
                'user_id' => Auth::id(),
                'file' => $piece->nom_original
            ]);

            return Storage::disk('public')->download(
                $piece->chemin,
                $piece->nom_original
            );

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement', [
                'piece_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            abort(500, 'Erreur lors du téléchargement');
        }
    }

    /**
     * Visualiser une pièce jointe (inline)
     */
    public function view($id)
    {
        try {
            $piece = PieceJointe::findOrFail($id);

            if (!$this->canAccessPieceJointe($piece)) {
                abort(403, 'Accès non autorisé');
            }

            if (!$piece->exists()) {
                abort(404, 'Fichier introuvable');
            }

            $file = Storage::disk('public')->get($piece->chemin);
            
            return response($file, 200)
                ->header('Content-Type', $piece->type_mime)
                ->header('Content-Disposition', 'inline; filename="' . $piece->nom_original . '"');

        } catch (\Exception $e) {
            abort(500, 'Erreur lors de la visualisation');
        }
    }

    /**
     * Supprimer une pièce jointe
     */
    public function destroy($id)
    {
        try {
            $piece = PieceJointe::findOrFail($id);

            if (!$this->canManagePiecesJointes($piece->attachable)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            $piece->deleteFile();

            Log::info('Pièce jointe supprimée', [
                'piece_id' => $piece->id,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fichier supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression', [
                'piece_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier une pièce jointe (admin seulement)
     */
    public function verify($id)
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$user->isAdminDistrict()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        try {
            $piece = PieceJointe::findOrFail($id);
            $piece->verify($user->id);

            return response()->json([
                'success' => true,
                'message' => 'Document vérifié',
                'piece_jointe' => $piece->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============ MÉTHODES PRIVÉES ============

    private function canAccessPieceJointe(PieceJointe $piece): bool
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->isSuperAdmin()) {
            return true;
        }

        // Vérifier si l'utilisateur appartient au même district
        if ($piece->id_district && $user->id_district === $piece->id_district) {
            return true;
        }

        // Vérifier si c'est l'uploader
        if ($piece->id_user === $user->id) {
            return true;
        }

        return false;
    }

    private function canManagePiecesJointes($entity): bool
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->isSuperAdmin()) {
            return true;
        }

        // Vérifier le district
        $entityDistrict = match(class_basename($entity)) {
            'Dossier' => $entity->id_district,
            'Demandeur' => $entity->dossiers()->first()?->id_district,
            'Propriete' => $entity->dossier?->id_district,
            default => null,
        };

        if ($entityDistrict && $user->id_district === $entityDistrict) {
            // Vérifier si le dossier est fermé
            if (method_exists($entity, 'is_closed') && $entity->is_closed) {
                return false;
            }
            
            return $user->canCreate();
        }

        return false;
    }
}