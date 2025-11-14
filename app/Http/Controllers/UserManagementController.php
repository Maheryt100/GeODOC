<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\District;
use App\Models\Region;
use App\Models\Province;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Constructor - Vérifier les permissions
     */
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('district.access:manage_users');
    }

    /**
     * Liste des utilisateurs avec filtres
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Query de base avec eager loading
        $query = User::with(['district.region.province']);

        // Si admin district, voir seulement les users de son district
        if ($user->isAdminDistrict()) {
            $query->where(function($q) use ($user) {
                $q->where('id_district', $user->id_district)
                  ->orWhere('role', User::ROLE_USER);
            });
        }

        // 🔍 FILTRES
        
        // Filtre par rôle
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filtre par district
        if ($request->filled('district')) {
            $query->where('id_district', $request->district);
        }

        // Filtre par statut
        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('status', $isActive);
        }

        // Recherche par nom ou email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        // Pagination
        /** @var User $connectedUser */
        $connectedUser = Auth::user();

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString() //  Important pour conserver les filtres dans la pagination
            ->through(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_name' => $user->role_name,
                'status' => $user->status,
                'district' => $user->district ? [
                    'id' => $user->district->id,
                    'nom_district' => $user->district->nom_district,
                    'nom_region' => $user->district->region?->nom_region ?? 'Région inconnue',
                    'nom_province' => $user->district->region?->province?->nom_province ?? 'Province inconnue',
                ] : null,
                'location' => $user->location,
                'created_at' => $user->created_at->format('d/m/Y'),
                'can_edit' => $connectedUser->canManageUsers() || 
                            ($connectedUser->isAdminDistrict() && $user->id_district === $connectedUser->id_district),
                'can_delete' => $connectedUser->isSuperAdmin() && $user->id !== $connectedUser->id,
            ]);

        // Statistiques
        $stats = [
            'total' => User::count(),
            'super_admins' => User::where('role', User::ROLE_SUPER_ADMIN)->count(),
            'admin_district' => User::where('role', User::ROLE_ADMIN_DISTRICT)->count(),
            'user_district' => User::where('role', User::ROLE_USER_DISTRICT)->count(),
            'active' => User::where('status', true)->count(),
            'inactive' => User::where('status', false)->count(),
        ];

        // Districts pour les filtres
        $districts = District::with('region')->orderBy('nom_district')->get();

        return Inertia::render('users/Index', [
            'users' => $users,
            'stats' => $stats,
            'districts' => $districts,
            'filters' => [
                'role' => $request->get('role'),
                'district' => $request->get('district'),
                'status' => $request->get('status'),
                'search' => $request->get('search'),
            ],
            'roles' => [
                User::ROLE_SUPER_ADMIN => 'Super Administrateur',
                User::ROLE_ADMIN_DISTRICT => 'Administrateur District',
                User::ROLE_USER_DISTRICT => 'Utilisateur District',
                User::ROLE_USER => 'Utilisateur',
            ],
        ]);
    }

    /**
     * Formulaire de création
     */
    public function create()
    {
        /** @var User $user */
        $user = Auth::user();

        // Récupérer les provinces avec leurs régions et districts
        $locations = Province::with(['regions.districts'])
            ->orderBy('nom_province')
            ->get()
            ->map(function ($province) {
                return [
                    'id' => $province->id,
                    'nom_province' => $province->nom_province,
                    'regions' => $province->regions->map(function ($region) {
                        return [
                            'id' => $region->id,
                            'nom_region' => $region->nom_region,
                            'districts' => $region->districts->map(function ($district) {
                                return [
                                    'id' => $district->id,
                                    'nom_district' => $district->nom_district,
                                ];
                            }),
                        ];
                    }),
                ];
            });

        // Rôles disponibles selon l'utilisateur connecté
        $availableRoles = [];
        if ($user->isSuperAdmin()) {
            $availableRoles = [
                User::ROLE_SUPER_ADMIN => 'Super Administrateur',
                User::ROLE_ADMIN_DISTRICT => 'Administrateur District',
                User::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        } elseif ($user->isAdminDistrict()) {
            $availableRoles = [
                User::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        }

        // ✅ Utiliser le bon chemin
        return Inertia::render('users/Create', [  // Changé de 'Users/Create' à 'users/create'
            'locations' => $locations,
            'roles' => $availableRoles,
            'currentUserDistrict' => $user->id_district,
            'isSuperAdmin' => $user->isSuperAdmin(),
        ]);
    }

    /**
     * Enregistrer un nouvel utilisateur
     */
    public function store(Request $request)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'required|in:' . implode(',', [
                User::ROLE_SUPER_ADMIN,
                User::ROLE_ADMIN_DISTRICT,
                User::ROLE_USER_DISTRICT,
                User::ROLE_USER
            ]),
            'id_district' => 'nullable|exists:districts,id',
            'status' => 'boolean',
        ], [
            'name.required' => 'Le nom est obligatoire',
            'email.required' => 'L\'email est obligatoire',
            'email.unique' => 'Cet email est déjà utilisé',
            'password.required' => 'Le mot de passe est obligatoire',
            'password.confirmed' => 'Les mots de passe ne correspondent pas',
            'role.required' => 'Le rôle est obligatoire',
            'id_district.exists' => 'Le district sélectionné n\'existe pas',
        ]);

        try {
            DB::beginTransaction();

            // Vérifications de sécurité
            if ($currentUser->isAdminDistrict()) {
                if ($validated['role'] !== User::ROLE_USER_DISTRICT) {
                    return back()->withErrors(['role' => 'Vous ne pouvez créer que des utilisateurs district']);
                }
                if ($validated['id_district'] != $currentUser->id_district) {
                    return back()->withErrors(['id_district' => 'Vous ne pouvez créer des utilisateurs que dans votre district']);
                }
            }

            // Validation de la cohérence role/district
            if (in_array($validated['role'], [User::ROLE_ADMIN_DISTRICT, User::ROLE_USER_DISTRICT])) {
                if (empty($validated['id_district'])) {
                    return back()->withErrors(['id_district' => 'Un district est requis pour ce rôle']);
                }
            }

            if ($validated['role'] === User::ROLE_SUPER_ADMIN) {
                $validated['id_district'] = null;
            }

            // Créer l'utilisateur
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'id_district' => $validated['id_district'],
                'status' => $validated['status'] ?? true,
            ]);

            DB::commit();

            Log::info('Utilisateur créé', [
                'created_by' => $currentUser->id,
                'user_id' => $user->id,
                'role' => $user->role,
                'district' => $user->id_district,
            ]);

            return redirect()->route('users.index')
                ->with('success', "Utilisateur {$user->name} créé avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création utilisateur', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur lors de la création : ' . $e->getMessage()]);
        }
    }

    /**
     * Formulaire d'édition
     */
    public function edit($id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::with('district.region.province')->findOrFail($id);

        // Vérifier les permissions
        if ($currentUser->isAdminDistrict()) {
            if ($user->id_district !== $currentUser->id_district) {
                abort(403, 'Vous ne pouvez modifier que les utilisateurs de votre district');
            }
        }

        // Ne pas permettre à un utilisateur de se modifier lui-même
        if ($user->id === $currentUser->id) {
            return redirect()->route('profile.edit')
                ->with('info', 'Utilisez la page de profil pour modifier vos propres informations');
        }

        // Locations
        $locations = Province::with(['regions.districts'])
            ->orderBy('nom_province')
            ->get()
            ->map(function ($province) {
                return [
                    'id' => $province->id,
                    'nom_province' => $province->nom_province,
                    'regions' => $province->regions->map(function ($region) {
                        return [
                            'id' => $region->id,
                            'nom_region' => $region->nom_region,
                            'districts' => $region->districts->map(function ($district) {
                                return [
                                    'id' => $district->id,
                                    'nom_district' => $district->nom_district,
                                ];
                            }),
                        ];
                    }),
                ];
            });

        // Rôles disponibles
        $availableRoles = [];
        if ($currentUser->isSuperAdmin()) {
            $availableRoles = [
                User::ROLE_SUPER_ADMIN => 'Super Administrateur',
                User::ROLE_ADMIN_DISTRICT => 'Administrateur District',
                User::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        } elseif ($currentUser->isAdminDistrict()) {
            $availableRoles = [
                User::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        }

        // ✅ Utiliser le bon chemin ET renommer pour réutiliser le composant Create
        return Inertia::render('users/Create', [  // Réutilise 'users/create' au lieu de créer un fichier Edit séparé
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_name' => $user->role_name,
                'id_district' => $user->id_district,
                'status' => $user->status,
                'district' => $user->district ? [
                    'id' => $user->district->id,
                    'nom_district' => $user->district->nom_district,
                    'id_region' => $user->district->id_region,
                    'id_province' => $user->district->region->id_province,
                ] : null,
                'created_at' => $user->created_at->format('d/m/Y à H:i'),
            ],
            'locations' => $locations,
            'roles' => $availableRoles,
            'isSuperAdmin' => $currentUser->isSuperAdmin(),
        ]);
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::findOrFail($id);

        // Empêcher la modification de soi-même
        if ($user->id === $currentUser->id) {
            return back()->withErrors(['error' => 'Vous ne pouvez pas modifier votre propre compte via cette interface']);
        }

        // Vérifier les permissions
        if ($currentUser->isAdminDistrict() && $user->id_district !== $currentUser->id_district) {
            abort(403, 'Vous ne pouvez modifier que les utilisateurs de votre district');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => 'required|in:' . implode(',', [
                User::ROLE_SUPER_ADMIN,
                User::ROLE_ADMIN_DISTRICT,
                User::ROLE_USER_DISTRICT,
                User::ROLE_USER
            ]),
            'id_district' => 'nullable|exists:districts,id',
            'status' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            // Vérifications de sécurité
            if ($currentUser->isAdminDistrict()) {
                if ($validated['role'] !== User::ROLE_USER_DISTRICT) {
                    return back()->withErrors(['role' => 'Vous ne pouvez gérer que des utilisateurs district']);
                }
                if ($validated['id_district'] != $currentUser->id_district) {
                    return back()->withErrors(['id_district' => 'Vous ne pouvez assigner que votre district']);
                }
            }

            // Empêcher la suppression du dernier super admin
            if ($user->role === User::ROLE_SUPER_ADMIN && $validated['role'] !== User::ROLE_SUPER_ADMIN) {
                $superAdminCount = User::where('role', User::ROLE_SUPER_ADMIN)->count();
                if ($superAdminCount <= 1) {
                    return back()->withErrors(['role' => 'Impossible de retirer le rôle du dernier super administrateur']);
                }
            }

            // Validation cohérence role/district
            if (in_array($validated['role'], [User::ROLE_ADMIN_DISTRICT, User::ROLE_USER_DISTRICT])) {
                if (empty($validated['id_district'])) {
                    return back()->withErrors(['id_district' => 'Un district est requis pour ce rôle']);
                }
            }

            if ($validated['role'] === User::ROLE_SUPER_ADMIN) {
                $validated['id_district'] = null;
            }

            // Mettre à jour
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $validated['role'],
                'id_district' => $validated['id_district'],
                'status' => $validated['status'] ?? $user->status,
            ]);

            // Mettre à jour le mot de passe si fourni
            if (!empty($validated['password'])) {
                $user->update(['password' => Hash::make($validated['password'])]);
            }

            DB::commit();

            Log::info('Utilisateur modifié', [
                'modified_by' => $currentUser->id,
                'user_id' => $user->id,
                'changes' => $user->getChanges(),
            ]);

            return redirect()->route('users.index')
                ->with('success', "Utilisateur {$user->name} modifié avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur modification utilisateur', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * Basculer le statut actif/inactif
     */
    public function toggleStatus($id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::findOrFail($id);

        // Ne pas pouvoir se désactiver soi-même
        if ($user->id === $currentUser->id) {
            return back()->withErrors(['error' => 'Vous ne pouvez pas modifier votre propre statut']);
        }

        // Vérifier les permissions
        if ($currentUser->isAdminDistrict() && $user->id_district !== $currentUser->id_district) {
            abort(403);
        }

        try {
            $newStatus = !$user->status;
            $user->update(['status' => $newStatus]);

            Log::info('Statut utilisateur modifié', [
                'modified_by' => $currentUser->id,
                'user_id' => $user->id,
                'new_status' => $newStatus,
            ]);

            $message = $newStatus ? 'Utilisateur activé' : 'Utilisateur désactivé';
            
            return back()->with('success', $message);

        } catch (\Exception $e) {
            Log::error('Erreur toggle status', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * Supprimer un utilisateur (super admin seulement)
     */
    public function destroy($id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();

        if (!$currentUser->isSuperAdmin()) {
            abort(403, 'Seul un super administrateur peut supprimer des utilisateurs');
        }

        $user = User::findOrFail($id);

        // Ne pas pouvoir se supprimer soi-même
        if ($user->id === $currentUser->id) {
            return back()->withErrors(['error' => 'Vous ne pouvez pas supprimer votre propre compte']);
        }

        // Empêcher la suppression du dernier super admin
        if ($user->role === User::ROLE_SUPER_ADMIN) {
            $superAdminCount = User::where('role', User::ROLE_SUPER_ADMIN)->count();
            if ($superAdminCount <= 1) {
                return back()->withErrors(['error' => 'Impossible de supprimer le dernier super administrateur']);
            }
        }

        try {
            DB::beginTransaction();

            $userName = $user->name;
            $userId = $user->id;

            // Vérifier s'il y a des données liées
            $dossiersCount = DB::table('dossiers')->where('id_user', $userId)->count();
            $proprietesCount = DB::table('proprietes')->where('id_user', $userId)->count();
            $demandeursCount = DB::table('demandeurs')->where('id_user', $userId)->count();

            if ($dossiersCount > 0 || $proprietesCount > 0 || $demandeursCount > 0) {
                return back()->withErrors([
                    'error' => "Impossible de supprimer cet utilisateur. Il a créé : {$dossiersCount} dossier(s), {$proprietesCount} propriété(s), {$demandeursCount} demandeur(s)"
                ]);
            }

            $user->delete();

            DB::commit();

            Log::warning('Utilisateur supprimé', [
                'deleted_by' => $currentUser->id,
                'user_id' => $userId,
                'user_name' => $userName,
            ]);

            return redirect()->route('users.index')
                ->with('success', "Utilisateur {$userName} supprimé avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression utilisateur', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * Réinitialiser le mot de passe
     */
    public function resetPassword(Request $request, $id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::findOrFail($id);

        // Vérifier les permissions
        if (!$currentUser->isSuperAdmin() && 
            !($currentUser->isAdminDistrict() && $user->id_district === $currentUser->id_district)) {
            abort(403);
        }

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        try {
            $user->update(['password' => Hash::make($validated['password'])]);

            Log::info('Mot de passe réinitialisé', [
                'reset_by' => $currentUser->id,
                'user_id' => $user->id,
            ]);

            return back()->with('success', 'Mot de passe réinitialisé avec succès');

        } catch (\Exception $e) {
            Log::error('Erreur reset password', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }
}