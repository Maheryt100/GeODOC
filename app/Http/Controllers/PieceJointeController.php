<?php

namespace App\Http\Controllers;

use App\Models\Demandeur;
use App\Models\Dossier;
use App\Models\PieceJointe;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PieceJointeController extends Controller
{
    /**
     * Afficher toutes les pièces jointes d'un dossier
     */
    public function index($id_dossier)
    {
        $dossier = Dossier::with([
            'piecesJointes.user',
            'proprietes.piecesJointes.user',
            'demandeurs.piecesJointes.user'
        ])->findOrFail($id_dossier);

        // Organiser les pièces jointes par catégorie
        $piecesJointes = [
            'dossier' => $dossier->piecesJointes,
            'proprietes' => $dossier->proprietes->map(fn($p) => [
                'id' => $p->id,
                'lot' => $p->lot,
                'titre' => $p->titre,
                'pieces' => $p->piecesJointes,
            ])->filter(fn($p) => $p['pieces']->isNotEmpty()),
            'demandeurs' => $dossier->demandeurs->map(fn($d) => [
                'id' => $d->id,
                'nom' => $d->nom_demandeur . ' ' . $d->prenom_demandeur,
                'cin' => $d->cin,
                'pieces' => $d->piecesJointes,
            ])->filter(fn($d) => $d['pieces']->isNotEmpty()),
        ];

        return Inertia::render('PiecesJointes/Index', [
            'dossier' => $dossier,
            'piecesJointes' => $piecesJointes,
        ]);
    }

    /**
     * Upload une pièce jointe
     */
    public function store(Request $request)
    {
        $request->validate([
            'fichier' => 'required|file|max:10240', // 10MB max
            'type_document' => 'required|in:piece_identite,acte_vente,csf,requisition,autre',
            'description' => 'nullable|string|max:500',
            'attachable_type' => 'required|in:dossier,propriete,demandeur',
            'attachable_id' => 'required|integer',
        ]);

        try {
            $file = $request->file('fichier');
            
            // Déterminer le modèle
            $modelClass = match($request->attachable_type) {
                'dossier' => Dossier::class,
                'propriete' => Propriete::class,
                'demandeur' => Demandeur::class,
            };

            $attachable = $modelClass::findOrFail($request->attachable_id);

            // Générer un nom unique
            $nomFichier = Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Stocker le fichier
            $chemin = $file->storeAs(
                'pieces_jointes/' . $request->attachable_type . 's',
                $nomFichier,
                'public'
            );

            // Créer l'enregistrement
            $pieceJointe = PieceJointe::create([
                'nom_fichier' => $nomFichier,
                'nom_original' => $file->getClientOriginalName(),
                'chemin' => $chemin,
                'type_mime' => $file->getMimeType(),
                'taille' => $file->getSize(),
                'type_document' => $request->type_document,
                'description' => $request->description,
                'attachable_type' => $modelClass,
                'attachable_id' => $request->attachable_id,
                'id_user' => Auth::id(),
            ]);

            return back()->with('message', 'Fichier uploadé avec succès');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erreur lors de l\'upload: ' . $e->getMessage()]);
        }
    }

    /**
     * Télécharger une pièce jointe
     */
    public function download($id)
    {
        $piece = PieceJointe::findOrFail($id);
        
        $fullPath = storage_path('app/public/' . $piece->chemin);
        
        if (!file_exists($fullPath)) {
            return back()->withErrors(['error' => 'Fichier introuvable']);
        }

        return response()->download($fullPath, $piece->nom_original);
    }

    /**
     * Supprimer une pièce jointe
     */
    public function destroy($id)
    {
        $piece = PieceJointe::findOrFail($id);
        
        // Vérifier si l'utilisateur est le propriétaire ou admin
        // Si vous n'avez pas de système de rôles, supprimez cette vérification
        if ($piece->id_user !== Auth::id()) {
            // Autoriser quand même pour simplifier
            // return back()->withErrors(['error' => 'Non autorisé']);
        }

        $piece->delete();
        
        return back()->with('message', 'Fichier supprimé avec succès');
    }

    /**
     * Afficher les documents générés d'un dossier
     */
    public function documentsGeneres($id_dossier)
    {
        $dossier = Dossier::with([
            'proprietes.piecesJointes' => function($q) {
                $q->whereIn('type_document', ['acte_vente', 'csf', 'requisition'])
                  ->with('user')
                  ->latest();
            },
            'proprietes.demandeurs'
        ])->findOrFail($id_dossier);

        // Récupérer tous les documents générés
        $documentsGeneres = PieceJointe::where(function($q) use ($dossier) {
            $q->where('attachable_type', Dossier::class)
              ->where('attachable_id', $dossier->id);
        })
        ->orWhere(function($q) use ($dossier) {
            $q->where('attachable_type', Propriete::class)
              ->whereIn('attachable_id', $dossier->proprietes->pluck('id'));
        })
        ->whereIn('type_document', ['acte_vente', 'csf', 'requisition'])
        ->with(['attachable', 'user'])
        ->latest()
        ->get();

        return Inertia::render('PiecesJointes/DocumentsGeneres', [
            'dossier' => $dossier,
            'documents' => $documentsGeneres,
        ]);
    }
}