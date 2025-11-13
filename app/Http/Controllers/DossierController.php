<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\District;
use App\Traits\ManagesDistrictAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
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
    }

    /**
     * Liste des dossiers - FILTRÉE automatiquement par district
     */
    public function index()
    {
        /** @var User $user */
        $user = Auth::user();

        // Grâce au trait HasDistrictScope dans Dossier,
        // cette requête sera automatiquement filtrée par district
        // SAUF pour les super admins
        $dossiers = Dossier::withCount(['demandeurs', 'proprietes'])
            ->orderBy('date_descente_debut', 'desc')
            ->get();
        
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
            'dossiers' => $dossiers,
            'districtInfo' => $districtInfo,
            'userRole' => $user->role_name,
            'stats' => $this->getDistrictStats(),
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
        
        // Super admin peut choisir le district
        // Autres utilisateurs voient seulement leur district
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
        ]);
        
        try {
            // ✅ SÉCURITÉ : Vérifier que l'utilisateur peut créer dans ce district
            if (!$user->isSuperAdmin() && $validated['id_district'] != $user->id_district) {
                return back()->withErrors([
                    'error' => 'Vous ne pouvez créer des dossiers que dans votre district.'
                ]);
            }

            $validated['id_user'] = $user->id;
            
            $dossier = Dossier::create($validated);

            // Log de l'action
            $user->logAccess('create', 'dossier', $dossier->id);
            
            return Redirect::route('dossiers')
                ->with('message', 'Dossier créé avec succès');
                
        } catch (\Exception $exception) {
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    /**
     * Recherche - automatiquement filtrée par district
     */
    public function search(Request $request)
    {
        $search = $request->input('search', '');
        /** @var User $user */
        $user = Auth::user();

        try {
            // Le scope district s'applique automatiquement
            $query = Dossier::withCount('demandeurs', 'proprietes');

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom_dossier', 'ilike', "%{$search}%")
                      ->orWhere('commune', 'ilike', "%{$search}%")
                      ->orWhere('circonscription', 'ilike', "%{$search}%")
                      ->orWhere('fokontany', 'ilike', "%{$search}%");
                });
            }

            $dossiers = $query->orderBy('date_descente_debut', 'desc')->get();
            
            $message = empty($search) 
                ? 'Tous les dossiers' 
                : ($dossiers->isEmpty() 
                    ? "Aucun dossier ne correspond à '{$search}'" 
                    : "{$dossiers->count()} dossier(s) trouvé(s)");
            
            return Inertia::render('dossiers/index', [
                'dossiers' => $dossiers,
                'districtInfo' => [
                    'nom' => $user->isSuperAdmin() ? 'Tous les districts' : $user->district->nom_district,
                    'can_see_all' => $user->isSuperAdmin(),
                ],
            ])->with('message', $message);
            
        } catch (\Exception $exception) {
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
        
        // Récupérer le dossier (le scope district s'applique automatiquement)
        $dossier = Dossier::with([
            'demandeurs',
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

        // Double vérification de sécurité (normalement déjà fait par le scope)
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
            'dossier' => $dossier,
            'permissions' => [
                'canEdit' => $user->canUpdate('dossier'),
                'canDelete' => $user->canDelete('dossier'),
                'canArchive' => $user->canArchive(),
                'canExport' => $user->canExportData(),
            ],
        ]);
    }

    /**
     * Édition - avec vérification d'accès
     */
    public function edit($id)
    {
        $this->authorizeDistrictAccess('update');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);
        
        // Vérifier l'accès
        $this->authorizeDistrictAccess('update', $dossier);
        
        // Districts disponibles
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
        
        // Vérifier l'accès
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
        ]);

        // ✅ SÉCURITÉ : Empêcher le changement de district sauf pour super admin
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
     * Suppression
     */
    public function destroy($id)
    {
        $this->authorizeDistrictAccess('delete');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);
        
        // Vérifier l'accès
        $this->authorizeDistrictAccess('delete', $dossier);

        try {
            // Log avant suppression
            $user->logAccess('delete', 'dossier', $id);
            
            $dossier->delete();
            
            return Redirect::route('dossiers')
                ->with('success', 'Dossier supprimé avec succès');
                
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}