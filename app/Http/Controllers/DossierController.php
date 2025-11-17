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

    /**
     * Constructeur - Appliquer les middlewares
     */
    public function __construct()
    {
        // Tous les utilisateurs doivent être authentifiés et avoir accès à leur district
        $this->middleware(['auth', 'district.access']);
        
        // Actions spécifiques
        $this->middleware('district.access:create')->only(['create', 'store']);
        $this->middleware('district.access:update')->only(['edit', 'update']);
        $this->middleware('district.access:delete')->only(['destroy']);
        
        // ✅ NOUVEAU : Vérifier que le dossier n'est pas fermé pour les modifications
        $this->middleware('check.dossier.closed:modify')->only(['update', 'destroy']);
    }

    /**
     * Liste des dossiers - FILTRÉE automatiquement par district
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $query = Dossier::withCount(['demandeurs', 'proprietes'])
            ->with(['closedBy:id,name']); // ✅ NOUVEAU : Inclure qui a fermé

        // ✅ NOUVEAU : Filtrer par statut (ouvert/fermé)
        if ($request->filled('status')) {
            if ($request->status === 'open') {
                $query->open();
            } elseif ($request->status === 'closed') {
                $query->closed();
            }
        }

        $dossiers = $query->orderBy('date_descente_debut', 'desc')->get();
        
        // Informations additionnelles pour l'interface
        $districtInfo = null;
        if (!$user->isSuperAdmin()) {
            $districtInfo = [
                'nom' => $user->district->nom_district,
                'region' => $user->district->region->nom_region,
                'can_see_all' => false,
            ];
        } else {
            $districtInfo = [
                'nom' => 'Tous les districts',
                'can_see_all' => true,
            ];
        }

        return Inertia::render('dossiers/index', [
            'dossiers' => $dossiers->map(function($dossier) use ($user) {
                return array_merge($dossier->toArray(), [
                    'can_close' => $dossier->canBeClosedBy($user), // ✅ NOUVEAU
                    'can_modify' => $dossier->canBeModifiedBy($user), // ✅ NOUVEAU
                ]);
            }),
            'districtInfo' => $districtInfo,
            'userRole' => $user->role_name,
            'stats' => $this->getDistrictStats(),
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
        
        if ($user->isSuperAdmin()) {
            $districts = District::with('region')->get();
        } else {
            $districts = District::where('id', $user->id_district)
                ->with('region')
                ->get();
        }

        return Inertia::render('dossiers/create', [
            'districts' => $districts,
            'defaultDistrict' => $user->id_district,
            'canSelectDistrict' => $user->isSuperAdmin(),
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
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'id_district' => 'required|numeric|exists:districts,id',
            'date_ouverture' => 'nullable|date', // ✅ NOUVEAU
        ]);
        
        try {
            // Vérifier que l'utilisateur peut créer dans ce district
            if (!$user->isSuperAdmin() && $validated['id_district'] != $user->id_district) {
                return back()->withErrors([
                    'error' => 'Vous ne pouvez créer des dossiers que dans votre district.'
                ]);
            }

            // ✅ NOUVEAU : Date d'ouverture par défaut
            if (!isset($validated['date_ouverture'])) {
                $validated['date_ouverture'] = $validated['date_descente_debut'];
            }

            $validated['id_user'] = $user->id;
            
            $dossier = Dossier::create($validated);

            // Log de l'action
            $user->logAccess('create', 'dossier', $dossier->id);
            
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
     * Affichage d'un dossier - avec vérification d'accès
     */
    public function show($id)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $dossier = Dossier::with([
            'demandeurs',
            'closedBy:id,name,email', // ✅ NOUVEAU
            'proprietes' => function ($query) {
                $query->with([
                    'demandeurs',
                    'demandes' => function ($q) {
                        $q->select('id', 'id_propriete', 'id_demandeur', 'status', 'status_consort', 'total_prix')
                          ->with('demandeur:id,nom_demandeur,prenom_demandeur,cin');
                    }
                ]);
            }
        ])->findOrFail($id);

        // Vérification d'accès
        if (!$user->canAccessDossier($dossier)) {
            abort(403, 'Accès refusé à ce dossier');
        }

        // Enrichir les données
        foreach ($dossier->proprietes as $propriete) {
            $activeCount = $propriete->demandes->where('status', 'active')->count();
            $archivedCount = $propriete->demandes->where('status', 'archive')->count();
            
            $propriete->is_archived = ($archivedCount > 0 && $activeCount === 0);
            
            if ($propriete->demandeurs) {
                foreach ($propriete->demandeurs as $demandeur) {
                    $demande = $propriete->demandes->firstWhere('id_demandeur', $demandeur->id);
                    if ($demande) {
                        $demandeur->status = $demande->status;
                        $demandeur->id_demande = $demande->id;
                    }
                }
            }
        }

        // Log de l'accès
        $user->logAccess('view', 'dossier', $id);

        return Inertia::render('dossiers/Show', [
            'dossier' => array_merge($dossier->toArray(), [
                'can_close' => $dossier->canBeClosedBy($user), // ✅ NOUVEAU
                'can_modify' => $dossier->canBeModifiedBy($user), // ✅ NOUVEAU
            ]),
            'permissions' => [
                'canEdit' => $dossier->canBeModifiedBy($user), // ✅ MODIFIÉ
                'canDelete' => $user->canDelete('dossier') && $dossier->canBeModifiedBy($user),
                'canClose' => $dossier->canBeClosedBy($user), // ✅ NOUVEAU
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
        
        // ✅ NOUVEAU : Vérifier si le dossier peut être modifié
        if (!$dossier->canBeModifiedBy($user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être modifié.'
            ]);
        }
        
        $this->authorizeDistrictAccess('update', $dossier);
        
        if ($user->isSuperAdmin()) {
            $districts = District::all();
        } else {
            $districts = District::where('id', $user->id_district)->get();
        }
        
        return Inertia::render('dossiers/update', [
            'dossier' => $dossier,
            'districts' => $districts,
            'canChangeDistrict' => $user->isSuperAdmin(),
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
        
        // ✅ NOUVEAU : Vérifier si le dossier peut être modifié
        if (!$dossier->canBeModifiedBy($user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être modifié.'
            ]);
        }
        
        $this->authorizeDistrictAccess('update', $dossier);

        $validated = $request->validate([
            'nom_dossier' => 'required|string|max:255',
            'type_commune' => 'required|string',
            'commune' => 'required|string|max:255',
            'fokontany' => 'required|string|max:255',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'circonscription' => 'required|string|max:255',
            'id_district' => 'required|exists:districts,id',
            'date_ouverture' => 'nullable|date', // ✅ NOUVEAU
        ]);

        // Empêcher le changement de district sauf pour super admin
        if (!$user->isSuperAdmin() && $validated['id_district'] != $dossier->id_district) {
            return back()->withErrors([
                'error' => 'Vous ne pouvez pas changer le district du dossier.'
            ]);
        }

        $dossier->update($validated);

        // Log de l'action
        $user->logAccess('update', 'dossier', $id);

        return redirect()
            ->route('dossiers.show', $id)
            ->with('message', 'Dossier modifié avec succès');
    }

    /**
     * ✅ NOUVEAU : Fermer un dossier
     */
    public function close(Request $request, $id)
    {
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);

        // Vérifier les permissions
        if (!$dossier->canBeClosedBy($user)) {
            return back()->withErrors([
                'error' => 'Vous n\'avez pas la permission de fermer ce dossier.'
            ]);
        }

        $validated = $request->validate([
            'date_fermeture' => 'required|date|after_or_equal:' . $dossier->date_ouverture,
            'motif_fermeture' => 'nullable|string|max:500',
        ], [
            'date_fermeture.required' => 'La date de fermeture est obligatoire',
            'date_fermeture.after_or_equal' => 'La date de fermeture doit être après la date d\'ouverture',
        ]);

        try {
            DB::beginTransaction();

            $dossier->update([
                'date_fermeture' => $validated['date_fermeture'],
                'closed_by' => $user->id,
                'motif_fermeture' => $validated['motif_fermeture'] ?? null,
            ]);

            // Log de l'activité
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

            Log::info('Dossier fermé', [
                'dossier_id' => $dossier->id,
                'closed_by' => $user->id,
                'date_fermeture' => $validated['date_fermeture'],
            ]);

            return back()->with('success', 'Dossier fermé avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur fermeture dossier', [
                'error' => $e->getMessage(),
                'dossier_id' => $id,
            ]);
            return back()->withErrors(['error' => 'Erreur lors de la fermeture : ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ NOUVEAU : Rouvrir un dossier
     */
    public function reopen($id)
    {
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);

        // Vérifier les permissions
        if (!$dossier->canBeClosedBy($user)) {
            return back()->withErrors([
                'error' => 'Vous n\'avez pas la permission de rouvrir ce dossier.'
            ]);
        }

        if ($dossier->is_open) {
            return back()->withErrors([
                'error' => 'Ce dossier est déjà ouvert.'
            ]);
        }

        try {
            DB::beginTransaction();

            $dossier->update([
                'date_fermeture' => null,
                'closed_by' => null,
                'motif_fermeture' => null,
            ]);

            // Log de l'activité
            if (class_exists(\App\Models\ActivityLog::class)) {
                \App\Models\ActivityLog::create([
                    'id_user' => $user->id,
                    'action' => 'reopen',
                    'entity_type' => 'dossier',
                    'entity_id' => $dossier->id,
                    'id_district' => $dossier->id_district,
                    'metadata' => json_encode([
                        'reopened_at' => now(),
                    ]),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            }

            DB::commit();

            Log::info('Dossier rouvert', [
                'dossier_id' => $dossier->id,
                'reopened_by' => $user->id,
            ]);

            return back()->with('success', 'Dossier rouvert avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur réouverture dossier', [
                'error' => $e->getMessage(),
                'dossier_id' => $id,
            ]);
            return back()->withErrors(['error' => 'Erreur lors de la réouverture : ' . $e->getMessage()]);
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
        
        // ✅ NOUVEAU : Vérifier si le dossier peut être modifié
        if (!$dossier->canBeModifiedBy($user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être supprimé. Veuillez d\'abord le rouvrir.'
            ]);
        }
        
        $this->authorizeDistrictAccess('delete', $dossier);

        try {
            // Log avant suppression
            $user->logAccess('delete', 'dossier', $id);
            
            $dossier->delete();
            
            return Redirect::route('dossiers')
                ->with('success', 'Dossier supprimé avec succès');
                
        } catch (\Exception $e) {
            Log::error('Erreur suppression dossier', [
                'error' => $e->getMessage(),
                'dossier_id' => $id,
            ]);
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Obtenir les statistiques du district
     */
    private function getDistrictStats(): array
    {
        /** @var User $user */
        $user = Auth::user();

        $query = Dossier::query();

        if (!$user->isSuperAdmin()) {
            $query->where('id_district', $user->id_district);
        }

        return [
            'total' => $query->count(),
            'open' => (clone $query)->open()->count(), // ✅ NOUVEAU
            'closed' => (clone $query)->closed()->count(), // ✅ NOUVEAU
            'recent' => (clone $query)->recent(30)->count(),
        ];
    }
}