<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

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
        ]);

        if (Auth::attempt($credentials)) {
            // Régénère la session
            $request->session()->regenerate();

            $user = Auth::user();

            // Redirection selon le rôle
            switch($user->role) {
                case 'super_admin':
                    return redirect()->intended('/dashboard');
                case 'admin_district':
                case 'user_district':
                    return redirect()->intended('/districts/' . $user->id_district . '/dashboard');
                default:
                    Auth::logout();
                    return back()->withErrors(['email' => 'Rôle utilisateur inconnu']);
            }
        }

        return back()->withErrors([
            'email' => 'Identifiants incorrects ou utilisateur inactif',
        ]);
    }

    /**
     * Déconnexion utilisateur
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
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