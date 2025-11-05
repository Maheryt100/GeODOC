<?php

namespace App\Traits;

use App\Models\PieceJointe;

trait HasPiecesJointes
{
    /**
     * Relation polymorphique avec les pièces jointes
     */
    public function piecesJointes()
    {
        return $this->morphMany(PieceJointe::class, 'attachable');
    }

    /**
     * Obtenir les pièces jointes d'un type spécifique
     */
    public function getPiecesJointesByType(string $type)
    {
        return $this->piecesJointes()->where('type_document', $type)->get();
    }

    /**
     * Vérifier si l'entité a des pièces jointes
     */
    public function hasPiecesJointes(): bool
    {
        return $this->piecesJointes()->exists();
    }

    /**
     * Compter les pièces jointes
     */
    public function countPiecesJointes(): int
    {
        return $this->piecesJointes()->count();
    }
}
