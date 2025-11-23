<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\PieceJointe;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class CheckAttachmentsAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        // Super Admin a accès à tout
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Vérifier l'accès aux pièces jointes par ID
        $pieceId = $request->route('id');
        if ($pieceId) {
            $piece = PieceJointe::find($pieceId);
            
            if (!$piece) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pièce jointe introuvable'
                ], 404);
            }

            // Vérifier l'accès
            if (!$this->canAccessPiece($user, $piece)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette pièce jointe'
                ], 403);
            }
        }

        // Vérifier l'accès aux entités attachables
        if ($request->has('attachable_type') && $request->has('attachable_id')) {
            $attachableType = $request->input('attachable_type');
            $attachableId = $request->input('attachable_id');
            
            if (!$this->canAccessAttachable($user, $attachableType, $attachableId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette entité'
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * Vérifier si l'utilisateur peut accéder à une pièce jointe
     */
    private function canAccessPiece(User $user, PieceJointe $piece): bool
    {
        // Utilisateur central peut tout voir
        if ($user->isCentralUser()) {
            return true;
        }

        // Même district
        if ($piece->id_district && $user->id_district === $piece->id_district) {
            return true;
        }

        // Propriétaire du fichier
        if ($piece->id_user === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Vérifier si l'utilisateur peut accéder à une entité attachable
     */
    private function canAccessAttachable(User $user, string $type, int $id): bool
    {
        $modelClass = "App\\Models\\" . $type;

        if (!class_exists($modelClass)) {
            return false;
        }

        $entity = $modelClass::find($id);

        if (!$entity) {
            return false;
        }

        // Pour les dossiers
        if ($type === 'Dossier') {
            if ($user->isCentralUser()) {
                return true;
            }
            return $entity->id_district === $user->id_district;
        }

        // Pour les demandeurs
        if ($type === 'Demandeur') {
            if ($user->isCentralUser()) {
                return true;
            }
            // Vérifier via les dossiers du demandeur
            $dossierDistrict = $entity->dossiers()->first()?->id_district;
            return $dossierDistrict && $dossierDistrict === $user->id_district;
        }

        // Pour les propriétés
        if ($type === 'Propriete') {
            if ($user->isCentralUser()) {
                return true;
            }
            // Vérifier via le dossier de la propriété
            return $entity->dossier?->id_district === $user->id_district;
        }

        return false;
    }
}