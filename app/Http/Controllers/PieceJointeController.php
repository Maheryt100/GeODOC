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
     * Lister les pièces jointes
     */
    public function index(Request $request)
    {
        // ✅ CORRECTION: Validation plus permissive pour include_related
        $request->validate([
            'attachable_type' => 'required|in:Dossier,Demandeur,Propriete',
            'attachable_id' => 'required|integer',
            'categorie' => 'nullable|string',
            'type_document' => 'nullable|string',
            'include_related' => 'nullable|string|in:true,false,1,0', // ✅ Accepte string
        ]);

        try {
            $modelClass = "App\\Models\\" . $request->attachable_type;
            
            if (!class_exists($modelClass)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type d\'entité invalide'
                ], 400);
            }

            $entity = $modelClass::find($request->attachable_id);
            
            if (!$entity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Entité introuvable'
                ], 404);
            }

            // Vérifier l'accès
            if (!$this->canAccessEntity($entity)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            // Query de base
            $query = $entity->piecesJointes()
                ->with(['user:id,name,email', 'verifiedBy:id,name,email'])
                ->orderBy('created_at', 'desc');

            // Filtres
            if ($request->filled('categorie')) {
                $query->where('categorie', $request->categorie);
            }

            if ($request->filled('type_document')) {
                $query->where('type_document', $request->type_document);
            }

            $pieces = $query->get()->map(fn($piece) => $this->formatPieceJointe($piece));

            // PJ des entités liées (pour Dossier)
            $relatedPieces = [];
            
            // ✅ CORRECTION: Vérifier plusieurs formats de valeur
            $includeRelated = in_array($request->input('include_related'), ['true', '1', true, 1], true);
            
            if ($includeRelated && $entity instanceof Dossier) {
                $relatedPieces = $this->getRelatedPiecesJointes($entity);
            }

            return response()->json([
                'success' => true,
                'pieces_jointes' => $pieces,
                'related_pieces' => $relatedPieces,
                'total' => $pieces->count(),
                'categories' => PieceJointe::getCategories(),
                'types_documents' => PieceJointe::getTypesDocuments(),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur liste pièces jointes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload de pièces jointes
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

            // Vérifier les permissions
            if (!$this->canManagePiecesJointes($entity)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            // Si une entité liée est spécifiée (pour les dossiers)
            if ($request->filled('linked_entity_type') && $request->filled('linked_entity_id')) {
                $linkedModelClass = "App\\Models\\" . $request->linked_entity_type;
                $linkedEntity = $linkedModelClass::findOrFail($request->linked_entity_id);
                
                // Utiliser l'entité liée pour l'upload
                $entity = $linkedEntity;
            }

            // Déterminer la catégorie
            $categorie = $request->categorie ?? match($entity::class) {
                Demandeur::class => PieceJointe::CATEGORIE_DEMANDEUR,
                Propriete::class => PieceJointe::CATEGORIE_PROPRIETE,
                default => PieceJointe::CATEGORIE_GLOBAL,
            };

            $uploaded = [];
            $errors = [];
            
            DB::beginTransaction();

            foreach ($request->file('files') as $index => $file) {
                $validation = app(UploadService::class)->validateFile($file);
                
                if (!$validation['valid']) {
                    $errors[] = [
                        'file' => $file->getClientOriginalName(),
                        'errors' => $validation['errors']
                    ];
                    continue;
                }

                try {
                    $description = $request->descriptions[$index] ?? null;
                    $districtId = $this->getEntityDistrictId($entity);

                    $piece = $entity->ajouterPieceJointe(
                        $file,
                        $request->type_document,
                        $description,
                        Auth::id(),
                        $districtId,
                        $categorie
                    );

                    $uploaded[] = $this->formatPieceJointe($piece);

                } catch (\Exception $fileException) {
                    Log::error('Erreur upload fichier individuel', [
                        'file' => $file->getClientOriginalName(),
                        'error' => $fileException->getMessage()
                    ]);
                    
                    $errors[] = [
                        'file' => $file->getClientOriginalName(),
                        'errors' => [$fileException->getMessage()]
                    ];
                }
            }

            DB::commit();

            $message = count($uploaded) . ' fichier(s) uploadé(s) avec succès';
            if (count($errors) > 0) {
                $message .= ' - ' . count($errors) . ' erreur(s)';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
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
     * Récupérer les PJ des entités liées d'un dossier
     */
    private function getRelatedPiecesJointes(Dossier $dossier): array
    {
        $related = [
            'demandeurs' => [],
            'proprietes' => [],
        ];

        try {
            // PJ des demandeurs
            if ($dossier->demandeurs) {
                foreach ($dossier->demandeurs as $demandeur) {
                    $pieces = $demandeur->piecesJointes()
                        ->with(['user:id,name'])
                        ->orderBy('created_at', 'desc')
                        ->get()
                        ->map(fn($p) => $this->formatPieceJointe($p));
                    
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
            }

            // PJ des propriétés
            if ($dossier->proprietes) {
                foreach ($dossier->proprietes as $propriete) {
                    $pieces = $propriete->piecesJointes()
                        ->with(['user:id,name'])
                        ->orderBy('created_at', 'desc')
                        ->get()
                        ->map(fn($p) => $this->formatPieceJointe($p));
                    
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
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des PJ liées', [
                'dossier_id' => $dossier->id,
                'error' => $e->getMessage()
            ]);
        }

        return $related;
    }

    /**
     * Formater une pièce jointe
     */
    private function formatPieceJointe(PieceJointe $piece): array
    {
        return [
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
            'url' => $piece->url,
            'view_url' => $piece->view_url,
            'taille_formatee' => $piece->taille_formatee,
            'icone' => $piece->icone,
            'is_image' => $piece->is_image,
            'is_pdf' => $piece->is_pdf,
            'created_at' => $piece->created_at->toISOString(),
            'user' => $piece->user ? [
                'id' => $piece->user->id,
                'name' => $piece->user->name
            ] : null,
            'verified_by' => $piece->verifiedBy ? [
                'id' => $piece->verifiedBy->id,
                'name' => $piece->verifiedBy->name
            ] : null,
            'verified_at' => $piece->verified_at?->toISOString(),
        ];
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
                Log::error('Fichier introuvable', [
                    'piece_id' => $id,
                    'chemin' => $piece->chemin
                ]);
                abort(404, 'Fichier introuvable');
            }

            $fullPath = $piece->getFullPath();

            return response()->download(
                $fullPath,
                $piece->nom_original,
                ['Content-Type' => $piece->type_mime]
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
     * Visualiser une pièce jointe
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
            Log::error('Erreur visualisation', [
                'piece_id' => $id,
                'error' => $e->getMessage()
            ]);
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

            $nomFichier = $piece->nom_original;
            $piece->deleteFile();

            Log::info('Pièce jointe supprimée', [
                'piece_id' => $id,
                'nom' => $nomFichier,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fichier supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression pièce jointe', [
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
     * Vérifier une pièce jointe
     */
    public function verify($id)
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user || (!$user->isSuperAdmin() && !$user->isAdminDistrict())) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        try {
            $piece = PieceJointe::findOrFail($id);
            $piece->verify($user->id);

            Log::info('Pièce jointe vérifiée', [
                'piece_id' => $id,
                'verified_by' => $user->id
            ]);

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
     * Mettre à jour les métadonnées
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
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
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

    // ============ HELPERS ============

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

    private function canAccessEntity($entity): bool
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) return false;
        if ($user->isSuperAdmin() || $user->isCentralUser()) return true;

        $entityDistrict = $this->getEntityDistrictId($entity);
        return $entityDistrict && $user->id_district === $entityDistrict;
    }

    private function canAccessPieceJointe(PieceJointe $piece): bool
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) return false;
        if ($user->isSuperAdmin() || $user->isCentralUser()) return true;
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
            return $user->isSuperAdmin() || $user->isAdminDistrict();
        }
        
        return $user->canCreate();
    }
}