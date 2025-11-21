<?php

namespace App\Traits;

use App\Models\PieceJointe;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HasPiecesJointes
{
    /**
     * Relation polymorphique vers les pièces jointes
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
     * Ajouter une pièce jointe
     * 
     * @param UploadedFile $file
     * @param string|null $typeDocument
     * @param string|null $description
     * @param int|null $userId
     * @param int|null $districtId
     * @return PieceJointe
     */
    public function ajouterPieceJointe(
        UploadedFile $file,
        ?string $typeDocument = null,
        ?string $description = null,
        ?int $userId = null,
        ?int $districtId = null
    ): PieceJointe {
        // Générer un nom unique
        $extension = $file->getClientOriginalExtension();
        $nomFichier = Str::uuid() . '.' . $extension;
        
        // Déterminer le sous-dossier selon le type de modèle
        $modelType = class_basename($this);
        $sousDossier = match($modelType) {
            'Dossier' => 'dossiers',
            'Demandeur' => 'demandeurs',
            'Propriete' => 'proprietes',
            default => 'autres'
        };
        
        // Chemin complet
        $chemin = "pieces_jointes/{$sousDossier}/" . $nomFichier;
        
        // Stocker le fichier
        Storage::disk('public')->put($chemin, file_get_contents($file->getRealPath()));
        
        // Créer l'enregistrement
        $piece = $this->piecesJointes()->create([
            'nom_original' => $file->getClientOriginalName(),
            'nom_fichier' => $nomFichier,
            'chemin' => $chemin,
            'type_mime' => $file->getMimeType(),
            'taille' => $file->getSize(),
            'extension' => $extension,
            'type_document' => $typeDocument,
            'description' => $description,
            'id_user' => $userId ?? auth()->id(),
            'id_district' => $districtId ?? (auth()->user()->id_district ?? null),
        ]);

        // Logger l'upload
        if (class_exists(\App\Models\ActivityLog::class)) {
            \App\Models\ActivityLog::logActivity(
                'upload',
                'piece_jointe',
                $piece->id,
                [
                    'nom_fichier' => $file->getClientOriginalName(),
                    'taille' => $file->getSize(),
                    'type_document' => $typeDocument,
                    'attachable_type' => class_basename($this),
                    'attachable_id' => $this->id,
                    'id_district' => $districtId ?? (auth()->user()->id_district ?? null),
                ]
            );
        }

        return $piece;
    }

    /**
     * Ajouter plusieurs pièces jointes
     * 
     * @param array $files Tableau de UploadedFile
     * @param string|null $typeDocument
     * @param int|null $userId
     * @param int|null $districtId
     * @return array
     */
    public function ajouterPiecesJointes(
        array $files,
        ?string $typeDocument = null,
        ?int $userId = null,
        ?int $districtId = null
    ): array {
        $piecesAjoutees = [];
        
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $piecesAjoutees[] = $this->ajouterPieceJointe(
                    $file,
                    $typeDocument,
                    null,
                    $userId,
                    $districtId
                );
            }
        }
        
        return $piecesAjoutees;
    }

    /**
     * Supprimer une pièce jointe
     * 
     * @param int $pieceJointeId
     * @return bool
     */
    public function supprimerPieceJointe(int $pieceJointeId): bool
    {
        $piece = $this->piecesJointes()->find($pieceJointeId);
        
        if (!$piece) {
            return false;
        }

        // Logger la suppression
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
     * 
     * @return bool
     */
    public function supprimerToutesPiecesJointes(): bool
    {
        foreach ($this->piecesJointes as $piece) {
            $piece->deleteFile();
        }
        
        return true;
    }

    /**
     * Obtenir les pièces jointes par type
     * 
     * @param string $typeDocument
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPiecesJointesParType(string $typeDocument)
    {
        return $this->piecesJointes()
            ->where('type_document', $typeDocument)
            ->get();
    }

    /**
     * Vérifier si l'entité a des pièces jointes
     * 
     * @return bool
     */
    public function hasPiecesJointes(): bool
    {
        return $this->piecesJointes()->exists();
    }

    /**
     * Obtenir le nombre de pièces jointes
     * 
     * @return int
     */
    public function nombrePiecesJointes(): int
    {
        return $this->piecesJointes()->count();
    }

    /**
     * Obtenir la taille totale des pièces jointes
     * 
     * @return int
     */
    public function tailleTotalePiecesJointes(): int
    {
        return $this->piecesJointes()->sum('taille');
    }

    /**
     * Boot du trait
     */
    public static function bootHasPiecesJointes()
    {
        // Supprimer toutes les pièces jointes lors de la suppression du modèle
        static::deleting(function ($model) {
            if (method_exists($model, 'isForceDeleting') && $model->isForceDeleting()) {
                $model->supprimerToutesPiecesJointes();
            }
        });
    }
}