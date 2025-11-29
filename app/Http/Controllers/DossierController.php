<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\District;
use App\Traits\ManagesDistrictAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;

class DossierController extends Controller
{
    use ManagesDistrictAccess;

    public function __construct()
    {
        $this->middleware(['auth', 'district.access']);
        $this->middleware('district.access:create')->only(['create', 'store']);
        $this->middleware('district.access:update')->only(['edit', 'update']);
        $this->middleware('district.access:delete')->only(['destroy']);
        $this->middleware('check.dossier.closed:modify')->only(['update', 'destroy']);
    }

    /**
     * Liste des dossiers
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $query = Dossier::withCount(['demandeurs', 'proprietes'])
            ->with(['closedBy:id,name']);

        // CRITIQUE : Appliquer le filtre de district
        $query = $this->applyDistrictFilter($query);

        // Filtrer par statut
        if ($request->filled('status')) {
            if ($request->status === 'open') {
                $query->whereNull('date_fermeture');
            } elseif ($request->status === 'closed') {
                $query->whereNotNull('date_fermeture');
            }
        }

        $dossiers = $query->orderBy('date_descente_debut', 'desc')->get();
        
        // CRITIQUE : Utiliser les méthodes sécurisées du trait
        return Inertia::render('dossiers/index', [
            'dossiers' => $dossiers->map(function($dossier) use ($user) {
                return array_merge($dossier->toArray(), [
                    'can_close' => $this->canCloseDossier($dossier, $user),
                    'can_modify' => $this->canModifyDossier($dossier, $user),
                ]);
            }),
            'districtInfo' => [
                'nom' => $this->getUserDistrictName($user),
                'can_see_all' => $user->canAccessAllDistricts(),
            ],
            'userRole' => $user->role_name,
            'stats' => $this->getDistrictStatsLocal(),
            'filters' => [
                'status' => $request->get('status'),
            ],
        ]);
    }
    
    /**
     * Formulaire de création
     */
    public function create()
    {
        $this->authorizeDistrictAccess('create');
        
        /** @var User $user */
        $user = Auth::user();
        
        $districts = $this->getAvailableDistricts($user);

        return Inertia::render('dossiers/create', [
            'districts' => $districts,
            'defaultDistrict' => $user->id_district,
            'canSelectDistrict' => $user->canAccessAllDistricts(),
        ]);
    }

    /**
     * Enregistrement d'un nouveau dossier
     */
    public function store(Request $request)
    {
        $this->authorizeDistrictAccess('create');
        
        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'nom_dossier' => 'required|string|max:100',
            'type_commune' => 'required|string|in:Commune Urbaine,Commune Rurale',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'date_ouverture' => 'required|date',
            'id_district' => 'required|numeric|exists:districts,id',
            'numero_ouverture' => 'nullable|string|max:50|unique:dossiers,numero_ouverture',
        ]);
        
        try {
            if (!$user->canAccessAllDistricts() && $validated['id_district'] != $user->id_district) {
                return back()->withErrors([
                    'error' => 'Vous ne pouvez créer des dossiers que dans votre district.'
                ]);
            }

            if (!isset($validated['date_ouverture'])) {
                $validated['date_ouverture'] = $validated['date_descente_debut'];
            }

            $validated['id_user'] = $user->id;
            
            $dossier = Dossier::create($validated);

            $this->logAction('create', 'dossier', $dossier->id);
            
            return Redirect::route('dossiers')
                ->with('message', 'Dossier créé avec succès');
                
        } catch (\Exception $exception) {
            Log::error('Erreur création dossier', [
                'error' => $exception->getMessage(),
                'user_id' => $user->id,
            ]);
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    /**
     * ✅ CORRECTION CRITIQUE : Affichage d'un dossier avec TOUTES les relations
     */
    public function show($id)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // ✅ CHARGER AVEC TOUTES LES RELATIONS NÉCESSAIRES POUR LA DISSOCIATION
        $dossier = Dossier::with([
            'demandeurs', // Tous les demandeurs du dossier
            'closedBy:id,name,email',
            'district:id,nom_district', // ✅ NOUVEAU : Pour les infos du district
            'piecesJointes' => function($q) {
                $q->orderBy('created_at', 'desc')->limit(50);
            },
            'proprietes' => function ($query) {
                $query->with([
                    // ✅ CORRECTION : Charger demandeurs ET demandes ensemble
                    'demandeurs:id,titre_demandeur,nom_demandeur,prenom_demandeur,cin,domiciliation',
                    'piecesJointes' => function($q) {
                        $q->orderBy('created_at', 'desc')->limit(20);
                    },
                    // ✅ CRITIQUE : Charger les demandes avec TOUS les champs nécessaires
                    'demandes' => function ($q) {
                        $q->select('id', 'id_propriete', 'id_demandeur', 'status', 'status_consort', 'total_prix', 'created_at')
                          ->with([
                              'demandeur' => function($subQ) {
                                  $subQ->select('id', 'titre_demandeur', 'nom_demandeur', 'prenom_demandeur', 'cin', 'domiciliation', 'telephone', 'occupation');
                              }
                          ])
                          ->orderBy('created_at', 'desc'); // Les plus récentes en premier
                    }
                ]);
            }
        ])->findOrFail($id);
        
        // Compter les pièces jointes
        $dossier->pieces_jointes_count = $dossier->piecesJointes->count();

        // Vérifier l'accès
        if (!$user->canAccessDossier($dossier)) {
            abort(403, 'Accès refusé à ce dossier');
        }

        // ✅ TRAITEMENT AMÉLIORÉ : Enrichir les propriétés avec les statuts
        foreach ($dossier->proprietes as $propriete) {
            // Compter les demandes actives et archivées
            $activeCount = $propriete->demandes->where('status', 'active')->count();
            $archivedCount = $propriete->demandes->where('status', 'archive')->count();
            
            // ✅ Marquer comme archivée si TOUTES les demandes sont archivées
            $propriete->is_archived = ($archivedCount > 0 && $activeCount === 0);
            
            // ✅ CORRECTION : Enrichir les demandeurs avec leurs statuts
            if ($propriete->demandeurs) {
                foreach ($propriete->demandeurs as $demandeur) {
                    // Trouver la demande correspondante
                    $demande = $propriete->demandes->firstWhere('id_demandeur', $demandeur->id);
                    if ($demande) {
                        $demandeur->status = $demande->status;
                        $demandeur->id_demande = $demande->id;
                    }
                }
            }
        }

        // ✅ LOG POUR DEBUG
        Log::info('Dossier chargé pour affichage', [
            'dossier_id' => $id,
            'proprietes_count' => $dossier->proprietes->count(),
            'demandeurs_count' => $dossier->demandeurs->count(),
            'premiere_propriete' => $dossier->proprietes->first() ? [
                'id' => $dossier->proprietes->first()->id,
                'lot' => $dossier->proprietes->first()->lot,
                'demandes_count' => $dossier->proprietes->first()->demandes->count(),
                'demandes' => $dossier->proprietes->first()->demandes->map(fn($d) => [
                    'id' => $d->id,
                    'id_demandeur' => $d->id_demandeur,
                    'status' => $d->status,
                    'has_demandeur' => !!$d->demandeur,
                    'demandeur_nom' => $d->demandeur ? $d->demandeur->nom_demandeur : null
                ])
            ] : null
        ]);

        $this->logAction('view', 'dossier', $id);

        return Inertia::render('dossiers/Show', [
            'dossier' => array_merge($dossier->toArray(), [
                'can_close' => $this->canCloseDossier($dossier, $user),
                'can_modify' => $this->canModifyDossier($dossier, $user),
            ]),
            'permissions' => [
                'canEdit' => $this->canModifyDossier($dossier, $user),
                'canDelete' => $user->canDelete() && $this->canModifyDossier($dossier, $user),
                'canClose' => $this->canCloseDossier($dossier, $user),
                'canArchive' => $user->canArchive(),
                'canExport' => $user->canExportData(),
            ],
        ]);
    }

    /**
     * Édition
     */
    public function edit($id)
    {
        $this->authorizeDistrictAccess('update');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);
        
        if (!$this->canModifyDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être modifié.'
            ]);
        }
        
        $this->authorizeDistrictAccess('update', $dossier);
        
        $districts = $this->getAvailableDistricts($user);
        
        // ✅ Formater les dates pour les inputs HTML
        $dossierData = $dossier->toArray();
        
        // Formater les dates au format Y-m-d
        if (isset($dossierData['date_descente_debut'])) {
            $dossierData['date_descente_debut'] = \Carbon\Carbon::parse($dossierData['date_descente_debut'])->format('Y-m-d');
        }
        if (isset($dossierData['date_descente_fin'])) {
            $dossierData['date_descente_fin'] = \Carbon\Carbon::parse($dossierData['date_descente_fin'])->format('Y-m-d');
        }
        if (isset($dossierData['date_ouverture'])) {
            $dossierData['date_ouverture'] = \Carbon\Carbon::parse($dossierData['date_ouverture'])->format('Y-m-d');
        }
        
        return Inertia::render('dossiers/update', [
            'dossier' => $dossierData,
            'districts' => $districts,
            'canChangeDistrict' => $user->canAccessAllDistricts(),
        ]);
    }

    /**
     * Mise à jour
     */
    public function update(Request $request, $id)
    {
        $this->authorizeDistrictAccess('update');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);
        
        if (!$this->canModifyDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être modifié.'
            ]);
        }
        
        $this->authorizeDistrictAccess('update', $dossier);

        $validated = $request->validate([
            'nom_dossier' => 'required|string|max:255',
            'type_commune' => 'required|string|in:Commune Urbaine,Commune Rurale',
            'commune' => 'required|string|max:255',
            'fokontany' => 'required|string|max:255',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'date_ouverture' => 'required|date', 
            'circonscription' => 'required|string|max:255',
            'id_district' => 'required|exists:districts,id',
            'numero_ouverture' => 'nullable|string|max:50|unique:dossiers,numero_ouverture,' . $id,
        ]);

        if (!$user->canAccessAllDistricts() && $validated['id_district'] != $dossier->id_district) {
            return back()->withErrors([
                'error' => 'Vous ne pouvez pas changer le district du dossier.'
            ]);
        }

        $dossier->update($validated);
        $this->logAction('update', 'dossier', $id);

        return redirect()
            ->route('dossiers.show', $id)
            ->with('message', 'Dossier modifié avec succès');
    }

    /**
     * Fermer un dossier
     */
    public function close(Request $request, $id)
    {
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);

        if (!$this->canCloseDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Vous n\'avez pas la permission de fermer ce dossier.'
            ]);
        }

        $validated = $request->validate([
            'date_fermeture' => 'required|date|after_or_equal:' . $dossier->date_ouverture,
            'motif_fermeture' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $dossier->update([
                'date_fermeture' => $validated['date_fermeture'],
                'closed_by' => $user->id,
                'motif_fermeture' => $validated['motif_fermeture'] ?? null,
            ]);

            if (class_exists(\App\Models\ActivityLog::class)) {
                \App\Models\ActivityLog::create([
                    'id_user' => $user->id,
                    'action' => 'close',
                    'entity_type' => 'dossier',
                    'entity_id' => $dossier->id,
                    'id_district' => $dossier->id_district,
                    'metadata' => json_encode([
                        'motif' => $validated['motif_fermeture'],
                        'date_fermeture' => $validated['date_fermeture'],
                    ]),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            DB::commit();

            return back()->with('success', 'Dossier fermé avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur fermeture dossier', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * Rouvrir un dossier
     */
    public function reopen($id)
    {
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);

        if (!$this->canCloseDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Vous n\'avez pas la permission de rouvrir ce dossier.'
            ]);
        }

        if (!$dossier->date_fermeture) {
            return back()->withErrors(['error' => 'Ce dossier est déjà ouvert.']);
        }

        try {
            DB::beginTransaction();

            $dossier->update([
                'date_fermeture' => null,
                'closed_by' => null,
                'motif_fermeture' => null,
            ]);

            if (class_exists(\App\Models\ActivityLog::class)) {
                \App\Models\ActivityLog::create([
                    'id_user' => $user->id,
                    'action' => 'reopen',
                    'entity_type' => 'dossier',
                    'entity_id' => $dossier->id,
                    'id_district' => $dossier->id_district,
                    'metadata' => json_encode(['reopened_at' => now()]),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            }

            DB::commit();
            return back()->with('success', 'Dossier rouvert avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur réouverture dossier', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * Suppression
     */
    public function destroy($id)
    {
        $this->authorizeDistrictAccess('delete');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);
        
        if (!$this->canModifyDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être supprimé.'
            ]);
        }
        
        $this->authorizeDistrictAccess('delete', $dossier);

        try {
            $this->logAction('delete', 'dossier', $id);
            $dossier->delete();
            
            return Redirect::route('dossiers')
                ->with('success', 'Dossier supprimé avec succès');
                
        } catch (\Exception $e) {
            Log::error('Erreur suppression dossier', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Vérifier si un utilisateur peut fermer/rouvrir un dossier
     */
    private function canCloseDossier(Dossier $dossier, User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminDistrict() && $user->id_district === $dossier->id_district) {
            return true;
        }

        return false;
    }

    /**
     * Vérifier si un dossier peut être modifié
     */
    private function canModifyDossier(Dossier $dossier, User $user): bool
    {
        if ($dossier->date_fermeture) {
            return false;
        }

        if (!$user->canAccessAllDistricts() && $user->id_district !== $dossier->id_district) {
            return false;
        }

        return true;
    }

    /**
     * Statistiques du district
     */
    private function getDistrictStatsLocal(): array
    {
        /** @var User $user */
        $user = Auth::user();

        $query = Dossier::query();

        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }

        return [
            'total' => $query->count(),
            'open' => (clone $query)->whereNull('date_fermeture')->count(),
            'closed' => (clone $query)->whereNotNull('date_fermeture')->count(),
            'recent' => (clone $query)->where('created_at', '>=', now()->subDays(30))->count(),
        ];
    }
}