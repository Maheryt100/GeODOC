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
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PieceJointeController extends Controller
{
    /**
     * Upload de pièces jointes avec catégorie
     */
    public function upload(Request $request)
    {
        $request->validate([
            'files' => 'required|array|min:1|max:10',
            'files.*' => 'required|file|max:10240',
            'attachable_type' => 'required|in:Dossier,Demandeur,Propriete',
            'attachable_id' => 'required|integer',
            'type_document' => 'nullable|string|max:50',
            'categorie' => 'nullable|string|in:global,demandeur,propriete,administratif',
            'descriptions' => 'nullable|array',
            'descriptions.*' => 'nullable|string|max:500',
            // Pour lier à une entité spécifique (demandeur/propriete) depuis un dossier
            'linked_entity_type' => 'nullable|in:Demandeur,Propriete',
            'linked_entity_id' => 'nullable|integer',
        ]);

        try {
            $modelClass = "App\\Models\\" . $request->attachable_type;
            
            if (!class_exists($modelClass)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type d\'entité invalide'
                ], 400);
            }

            $entity = $modelClass::findOrFail($request->attachable_id);

            if (!$this->canManagePiecesJointes($entity)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            // Déterminer l'entité cible (peut être différente de l'entité attachable)
            $targetEntity = $entity;
            $categorie = $request->categorie;

            // Si on lie à une entité spécifique depuis un dossier
            if ($request->linked_entity_type && $request->linked_entity_id) {
                $linkedClass = "App\\Models\\" . $request->linked_entity_type;
                $targetEntity = $linkedClass::findOrFail($request->linked_entity_id);
                
                // Définir la catégorie automatiquement
                $categorie = $categorie ?? match($request->linked_entity_type) {
                    'Demandeur' => PieceJointe::CATEGORIE_DEMANDEUR,
                    'Propriete' => PieceJointe::CATEGORIE_PROPRIETE,
                    default => PieceJointe::CATEGORIE_GLOBAL,
                };
            }

            $uploaded = [];
            $errors = [];
            
            DB::beginTransaction();

            foreach ($request->file('files') as $index => $file) {
                $validation = UploadService::validateFile($file);
                
                if (!$validation['valid']) {
                    $errors[] = [
                        'file' => $file->getClientOriginalName(),
                        'errors' => $validation['errors']
                    ];
                    continue;
                }

                try {
                    $description = $request->descriptions[$index] ?? null;
                    
                    // Obtenir le district de l'entité
                    $districtId = $this->getEntityDistrictId($targetEntity);

                    $piece = $targetEntity->ajouterPieceJointe(
                        $file,
                        $request->type_document,
                        $description,
                        Auth::id(),
                        $districtId,
                        $categorie
                    );

                    $uploaded[] = $piece;

                } catch (\Exception $fileException) {
                    $errors[] = [
                        'file' => $file->getClientOriginalName(),
                        'errors' => [$fileException->getMessage()]
                    ];
                }
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
     * Lister les pièces jointes avec filtres
     */
    public function index(Request $request)
    {
        $request->validate([
            'attachable_type' => 'required|in:Dossier,Demandeur,Propriete',
            'attachable_id' => 'required|integer',
            'categorie' => 'nullable|string',
            'include_related' => 'nullable|boolean', // Inclure les PJ des entités liées
        ]);

        try {
            $modelClass = "App\\Models\\" . $request->attachable_type;
            $entity = $modelClass::findOrFail($request->attachable_id);

            $query = $entity->piecesJointes()
                ->with(['user:id,name,email', 'verifiedBy:id,name,email']);

            // Filtrer par catégorie si spécifié
            if ($request->filled('categorie')) {
                $query->where('categorie', $request->categorie);
            }

            $pieces = $query->get()->map(fn($piece) => $this->formatPieceJointe($piece));

            // Si on demande les PJ des entités liées (pour un Dossier)
            $relatedPieces = [];
            if ($request->boolean('include_related') && $entity instanceof Dossier) {
                $relatedPieces = $this->getRelatedPiecesJointes($entity);
            }

            return response()->json([
                'success' => true,
                'pieces_jointes' => $pieces,
                'related_pieces' => $relatedPieces,
                'categories' => PieceJointe::getCategories(),
                'types_documents' => PieceJointe::getTypesDocuments(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les pièces jointes des demandeurs et propriétés d'un dossier
     */
    private function getRelatedPiecesJointes(Dossier $dossier): array
    {
        $related = [
            'demandeurs' => [],
            'proprietes' => [],
        ];

        // PJ des demandeurs du dossier
        foreach ($dossier->demandeurs as $demandeur) {
            $pieces = $demandeur->piecesJointes()
                ->with(['user:id,name'])
                ->get()
                ->map(fn($p) => $this->formatPieceJointe($p, [
                    'demandeur_id' => $demandeur->id,
                    'demandeur_nom' => "{$demandeur->nom_demandeur} {$demandeur->prenom_demandeur}",
                ]));
            
            if ($pieces->count() > 0) {
                $related['demandeurs'][$demandeur->id] = [
                    'demandeur' => [
                        'id' => $demandeur->id,
                        'nom' => $demandeur->nom_demandeur,
                        'prenom' => $demandeur->prenom_demandeur,
                        'cin' => $demandeur->cin,
                    ],
                    'pieces' => $pieces,
                ];
            }
        }

        // PJ des propriétés du dossier
        foreach ($dossier->proprietes as $propriete) {
            $pieces = $propriete->piecesJointes()
                ->with(['user:id,name'])
                ->get()
                ->map(fn($p) => $this->formatPieceJointe($p, [
                    'propriete_id' => $propriete->id,
                    'propriete_lot' => $propriete->lot,
                ]));
            
            if ($pieces->count() > 0) {
                $related['proprietes'][$propriete->id] = [
                    'propriete' => [
                        'id' => $propriete->id,
                        'lot' => $propriete->lot,
                        'titre' => $propriete->titre,
                    ],
                    'pieces' => $pieces,
                ];
            }
        }

        return $related;
    }

    /**
     * Formater une pièce jointe pour la réponse JSON
     */
    private function formatPieceJointe(PieceJointe $piece, array $extra = []): array
    {
        return array_merge([
            'id' => $piece->id,
            'nom_original' => $piece->nom_original,
            'nom_fichier' => $piece->nom_fichier,
            'type_mime' => $piece->type_mime,
            'taille' => $piece->taille,
            'extension' => $piece->extension,
            'type_document' => $piece->type_document,
            'categorie' => $piece->categorie,
            'categorie_label' => $piece->categorie_label,
            'description' => $piece->description,
            'is_verified' => $piece->is_verified,
            'url' => route('pieces-jointes.download', $piece->id),
            'view_url' => route('pieces-jointes.view', $piece->id),
            'taille_formatee' => $piece->taille_formatee,
            'icone' => $piece->icone,
            'is_image' => $piece->isImage(),
            'is_pdf' => $piece->isPdf(),
            'created_at' => $piece->created_at,
            'user' => $piece->user ? ['id' => $piece->user->id, 'name' => $piece->user->name] : null,
            'verified_by' => $piece->verifiedBy ? ['id' => $piece->verifiedBy->id, 'name' => $piece->verifiedBy->name] : null,
            'verified_at' => $piece->verified_at,
        ], $extra);
    }

    /**
     * Télécharger une pièce jointe
     */
    public function download($id): BinaryFileResponse
    {
        try {
            $piece = PieceJointe::findOrFail($id);

            if (!$this->canAccessPieceJointe($piece)) {
                abort(403, 'Accès non autorisé');
            }

            if (!$piece->fileExists()) {
                abort(404, 'Fichier introuvable');
            }

            $fullPath = Storage::disk('public')->path($piece->chemin);

            return response()->download(
                $fullPath,
                $piece->nom_original,
                ['Content-Type' => $piece->type_mime]
            );

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement', ['piece_id' => $id, 'error' => $e->getMessage()]);
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

            if (!$piece->fileExists()) {
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

            return response()->json([
                'success' => true,
                'message' => 'Fichier supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier une pièce jointe
     */
    public function verify($id)
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user || (!$user->isSuperAdmin() && !$user->isAdminDistrict())) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $piece = PieceJointe::findOrFail($id);
            $piece->verify($user->id);

            return response()->json([
                'success' => true,
                'message' => 'Document vérifié',
                'piece_jointe' => $this->formatPieceJointe($piece->fresh())
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour les métadonnées d'une pièce jointe
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'type_document' => 'nullable|string|max:50',
            'categorie' => 'nullable|string|in:global,demandeur,propriete,administratif',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $piece = PieceJointe::findOrFail($id);

            if (!$this->canManagePiecesJointes($piece->attachable)) {
                return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
            }

            $piece->update($request->only(['type_document', 'categorie', 'description']));

            return response()->json([
                'success' => true,
                'message' => 'Document mis à jour',
                'piece_jointe' => $this->formatPieceJointe($piece->fresh())
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============ MÉTHODES PRIVÉES ============

    private function getEntityDistrictId($entity): ?int
    {
        if ($entity instanceof Dossier) {
            return $entity->id_district;
        } elseif ($entity instanceof Demandeur) {
            return $entity->dossiers()->first()?->id_district;
        } elseif ($entity instanceof Propriete) {
            return $entity->dossier?->id_district;
        }
        return Auth::user()?->id_district;
    }

    private function canAccessPieceJointe(PieceJointe $piece): bool
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) return false;
        if ($user->isSuperAdmin()) return true;
        if ($piece->id_district && $user->id_district === $piece->id_district) return true;
        if ($piece->id_user === $user->id) return true;

        return false;
    }

    private function canManagePiecesJointes($entity): bool
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) return false;
        if ($user->isSuperAdmin()) return true;

        $entityDistrict = $this->getEntityDistrictId($entity);

        if (!$entityDistrict || $user->id_district !== $entityDistrict) {
            return false;
        }

        // Vérifier si le dossier est fermé
        $dossier = null;
        if ($entity instanceof Dossier) {
            $dossier = $entity;
        } elseif ($entity instanceof Propriete) {
            $dossier = $entity->dossier;
        } elseif ($entity instanceof Demandeur) {
            $dossier = $entity->dossiers()->first();
        }

        if ($dossier && $dossier->is_closed) {
            return false;
        }
        
        return $user->canCreate();
    }
}