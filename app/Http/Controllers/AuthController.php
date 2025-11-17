<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use App\Services\ActivityLogger;

class AuthController extends Controller
{
     use AuthorizesRequests;
    /**
     * Affiche le formulaire de connexion
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Traite la connexion utilisateur
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required'
        ], [
            'email.required' => 'L\'email est obligatoire',
            'email.email' => 'Format d\'email invalide',
            'password.required' => 'Le mot de passe est obligatoire',
        ]);

        if (Auth::attempt($credentials)) {
            /** @var User $user */
            $user = Auth::user();

            ActivityLogger::logLogin($user);

            // ✅ Vérifier si le compte est actif
            if (!$user->status) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Votre compte est désactivé. Contactez un administrateur.'
                ]);
            }

            // ✅ Vérifier si un district est requis et assigné
            if (in_array($user->role, [User::ROLE_ADMIN_DISTRICT, User::ROLE_USER_DISTRICT])) {
                if (!$user->id_district) {
                    Auth::logout();
                    return back()->withErrors([
                        'email' => 'Aucun district assigné. Contactez un administrateur.'
                    ]);
                }
            }

            // Régénère la session
            $request->session()->regenerate();

            // ✅ CORRECTION: Tous les rôles vont au même dashboard
            // Le middleware district.scope s'occupera du filtrage
            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'email' => 'Identifiants incorrects.',
        ])->onlyInput('email');
    }

    /**
     * Déconnexion utilisateur
     */
    public function logout(Request $request)
    {
          $user = Auth::user();
        
        // ✅ Logger la déconnexion AVANT de déconnecter
        if ($user) {
            ActivityLogger::logLogout($user);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return redirect('/login')->with('success', 'Déconnexion réussie');
    }

    /**
     * Affiche le profil utilisateur
     */
    public function profile()
    {
        return view('auth.profile', [
            'user' => Auth::user()
        ]);
    }

    /**
     * Mise à jour du profil et du district/role (super admin uniquement)
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Seul le super admin peut modifier le district ou le rôle
        $this->authorize('manage-users', User::class);

        $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email,' . $user->id,
            'role'       => 'required|in:super_admin,admin_district,user_district',
            'id_district'=> 'nullable|exists:districts,id'
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;

        // Affectation du district si rôle district
        if (in_array($request->role, ['admin_district', 'user_district'])) {
            $user->id_district = $request->id_district;
        } else {
            $user->id_district = null;
        }

        $user->save();

        return redirect()->back()->with('success', 'Utilisateur mis à jour');
    }
}