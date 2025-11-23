<?php

namespace App\Traits;

use App\Models\PieceJointe;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

trait HasPiecesJointes
{
    /**
     * Relation morphMany vers les pièces jointes
     */
    public function piecesJointes(): MorphMany
    {
        return $this->morphMany(PieceJointe::class, 'attachable')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Pièces jointes actives (non supprimées)
     */
    public function piecesJointesActives(): MorphMany
    {
        return $this->piecesJointes()->whereNull('deleted_at');
    }

    /**
     * Pièces jointes vérifiées
     */
    public function piecesJointesVerifiees(): MorphMany
    {
        return $this->piecesJointes()->where('is_verified', true);
    }

    /**
     * Filtrer par catégorie
     */
    public function piecesJointesGlobales(): MorphMany
    {
        return $this->piecesJointes()->where('categorie', PieceJointe::CATEGORIE_GLOBAL);
    }

    public function piecesJointesDemandeur(): MorphMany
    {
        return $this->piecesJointes()->where('categorie', PieceJointe::CATEGORIE_DEMANDEUR);
    }

    public function piecesJointesPropriete(): MorphMany
    {
        return $this->piecesJointes()->where('categorie', PieceJointe::CATEGORIE_PROPRIETE);
    }

    /**
     * Ajouter une pièce jointe
     */
    public function ajouterPieceJointe(
        UploadedFile $file,
        ?string $typeDocument = null,
        ?string $description = null,
        ?int $userId = null,
        ?int $districtId = null,
        ?string $categorie = null
    ): PieceJointe {
        try {
            // Validation du fichier
            $validation = app(\App\Services\UploadService::class)->validateFile($file);
            
            if (!$validation['valid']) {
                throw new \Exception(implode(', ', $validation['errors']));
            }

            $extension = strtolower($file->getClientOriginalExtension());
            $nomFichier = Str::uuid() . '.' . $extension;
            
            // Déterminer le sous-dossier
            $modelType = class_basename($this);
            $sousDossier = match($modelType) {
                'Dossier' => 'dossiers',
                'Demandeur' => 'demandeurs',
                'Propriete' => 'proprietes',
                default => 'autres'
            };
            
            // Déterminer la catégorie automatiquement si non fournie
            $categorieFinale = $categorie ?? match($modelType) {
                'Demandeur' => PieceJointe::CATEGORIE_DEMANDEUR,
                'Propriete' => PieceJointe::CATEGORIE_PROPRIETE,
                default => PieceJointe::CATEGORIE_GLOBAL,
            };
            
            // Construire le chemin avec année/mois
            $directory = "pieces_jointes/{$sousDossier}/" . date('Y/m');
            
            // Stocker le fichier
            $chemin = Storage::disk('public')->putFileAs(
                $directory,
                $file,
                $nomFichier
            );
            
            // Créer l'enregistrement
            $piece = $this->piecesJointes()->create([
                'nom_original' => $file->getClientOriginalName(),
                'nom_fichier' => $nomFichier,
                'chemin' => $chemin,
                'type_mime' => $file->getMimeType(),
                'taille' => $file->getSize(),
                'extension' => $extension,
                'type_document' => $typeDocument,
                'categorie' => $categorieFinale,
                'description' => $description,
                'id_user' => $userId ?? Auth::id(),
                'id_district' => $districtId ?? (Auth::user()?->id_district ?? null),
            ]);

            // Log l'activité
            if (class_exists(\App\Models\ActivityLog::class)) {
                \App\Models\ActivityLog::logPieceJointeUpload(
                    $piece->id,
                    $file->getClientOriginalName(),
                    $file->getSize(),
                    class_basename($this),
                    $this->id,
                    $piece->id_district,
                    $typeDocument
                );
            }

            Log::info('Pièce jointe uploadée', [
                'piece_id' => $piece->id,
                'entity' => class_basename($this),
                'entity_id' => $this->id,
                'categorie' => $categorieFinale,
                'file' => $file->getClientOriginalName(),
            ]);

            return $piece;

        } catch (\Exception $e) {
            Log::error('Erreur ajout pièce jointe', [
                'entity' => class_basename($this),
                'entity_id' => $this->id,
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Ajouter plusieurs pièces jointes
     */
    public function ajouterPiecesJointes(
        array $files,
        ?string $typeDocument = null,
        ?array $descriptions = null,
        ?int $userId = null,
        ?int $districtId = null,
        ?string $categorie = null
    ): array {
        $piecesAjoutees = [];
        $erreurs = [];
        
        foreach ($files as $index => $file) {
            if ($file instanceof UploadedFile) {
                try {
                    $description = $descriptions[$index] ?? null;
                    
                    $piecesAjoutees[] = $this->ajouterPieceJointe(
                        $file,
                        $typeDocument,
                        $description,
                        $userId,
                        $districtId,
                        $categorie
                    );
                } catch (\Exception $e) {
                    $erreurs[] = [
                        'index' => $index,
                        'file' => $file->getClientOriginalName(),
                        'error' => $e->getMessage()
                    ];
                }
            }
        }
        
        return [
            'uploaded' => $piecesAjoutees,
            'errors' => $erreurs
        ];
    }

    /**
     * Supprimer une pièce jointe
     */
    public function supprimerPieceJointe(int $pieceJointeId): bool
    {
        $piece = $this->piecesJointes()->find($pieceJointeId);
        
        if (!$piece) {
            return false;
        }

        // Log l'activité
        if (class_exists(\App\Models\ActivityLog::class)) {
            \App\Models\ActivityLog::logActivity(
                'delete',
                'piece_jointe',
                $piece->id,
                [
                    'nom_fichier' => $piece->nom_original,
                    'attachable_type' => class_basename($this),
                    'attachable_id' => $this->id,
                    'id_district' => $piece->id_district,
                ]
            );
        }
        
        return $piece->deleteFile();
    }

    /**
     * Supprimer toutes les pièces jointes
     */
    public function supprimerToutesPiecesJointes(): bool
    {
        try {
            foreach ($this->piecesJointes as $piece) {
                $piece->deleteFile();
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur suppression pièces jointes', [
                'entity' => class_basename($this),
                'entity_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Obtenir les pièces jointes par type
     */
    public function getPiecesJointesParType(string $typeDocument)
    {
        return $this->piecesJointes()->where('type_document', $typeDocument)->get();
    }

    /**
     * Obtenir les pièces jointes par catégorie
     */
    public function getPiecesJointesParCategorie(string $categorie)
    {
        return $this->piecesJointes()->where('categorie', $categorie)->get();
    }

    /**
     * Vérifier si l'entité a des pièces jointes
     */
    public function hasPiecesJointes(): bool
    {
        return $this->piecesJointes()->exists();
    }

    /**
     * Nombre de pièces jointes
     */
    public function nombrePiecesJointes(): int
    {
        return $this->piecesJointes()->count();
    }

    /**
     * Taille totale des pièces jointes
     */
    public function tailleTotalePiecesJointes(): int
    {
        return $this->piecesJointes()->sum('taille') ?? 0;
    }

    /**
     * Statistiques des pièces jointes
     */
    public function getStatsPiecesJointes(): array
    {
        return [
            'total' => $this->piecesJointes()->count(),
            'verified' => $this->piecesJointesVerifiees()->count(),
            'par_categorie' => [
                'global' => $this->piecesJointesGlobales()->count(),
                'demandeur' => $this->piecesJointesDemandeur()->count(),
                'propriete' => $this->piecesJointesPropriete()->count(),
            ],
            'taille_totale' => $this->tailleTotalePiecesJointes(),
        ];
    }

    /**
     * Boot du trait
     */
    public static function bootHasPiecesJointes()
    {
        static::deleting(function ($model) {
            if (method_exists($model, 'isForceDeleting') && $model->isForceDeleting()) {
                $model->supprimerToutesPiecesJointes();
            }
        });
    }
}