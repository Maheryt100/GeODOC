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
    public function piecesJointes(): MorphMany
    {
        return $this->morphMany(PieceJointe::class, 'attachable')
            ->orderBy('created_at', 'desc');
    }

    public function piecesJointesActives(): MorphMany
    {
        return $this->piecesJointes()->whereNull('deleted_at');
    }

    public function piecesJointesVerifiees(): MorphMany
    {
        return $this->piecesJointes()->where('is_verified', true);
    }

    // Filtrer par catégorie
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
     * Ajouter une pièce jointe avec catégorie
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
            $validation = app(\App\Services\UploadService::class)->validateFile($file);
            
            if (!$validation['valid']) {
                throw new \Exception(implode(', ', $validation['errors']));
            }

            $extension = strtolower($file->getClientOriginalExtension());
            $nomFichier = Str::uuid() . '.' . $extension;
            
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
            
            $directory = "pieces_jointes/{$sousDossier}/" . date('Y/m');
            
            $chemin = Storage::disk('public')->putFileAs(
                $directory,
                $file,
                $nomFichier
            );
            
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

            if (class_exists(\App\Models\ActivityLog::class)) {
                \App\Models\ActivityLog::logPieceJointeUpload(
                    $piece->id,
                    $file->getClientOriginalName(),
                    $file->getSize(),
                    class_basename($this),
                    $this->id,
                    $districtId ?? (Auth::user()?->id_district ?? null),
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

    public function ajouterPiecesJointes(
        array $files,
        ?string $typeDocument = null,
        ?int $userId = null,
        ?int $districtId = null,
        ?string $categorie = null
    ): array {
        $piecesAjoutees = [];
        $erreurs = [];
        
        foreach ($files as $index => $file) {
            if ($file instanceof UploadedFile) {
                try {
                    $piecesAjoutees[] = $this->ajouterPieceJointe(
                        $file,
                        $typeDocument,
                        null,
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
        
        return $piecesAjoutees;
    }

    public function supprimerPieceJointe(int $pieceJointeId): bool
    {
        $piece = $this->piecesJointes()->find($pieceJointeId);
        
        if (!$piece) return false;

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

    public function getPiecesJointesParType(string $typeDocument)
    {
        return $this->piecesJointes()->where('type_document', $typeDocument)->get();
    }

    public function getPiecesJointesParCategorie(string $categorie)
    {
        return $this->piecesJointes()->where('categorie', $categorie)->get();
    }

    public function hasPiecesJointes(): bool
    {
        return $this->piecesJointes()->exists();
    }

    public function nombrePiecesJointes(): int
    {
        return $this->piecesJointes()->count();
    }

    public function tailleTotalePiecesJointes(): int
    {
        return $this->piecesJointes()->sum('taille') ?? 0;
    }

    /**
     * Statistiques des pièces jointes par catégorie
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

    public static function bootHasPiecesJointes()
    {
        static::deleting(function ($model) {
            if (method_exists($model, 'isForceDeleting') && $model->isForceDeleting()) {
                $model->supprimerToutesPiecesJointes();
            }
        });
    }
}