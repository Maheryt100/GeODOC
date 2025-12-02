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
    
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

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

            // ✅ Tous les rôles vont au même dashboard
            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'email' => 'Identifiants incorrects.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        
        if ($user) {
            ActivityLogger::logLogout($user);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return redirect('/login')->with('success', 'Déconnexion réussie');
    }

    public function profile()
    {
        return view('auth.profile', [
            'user' => Auth::user()
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $this->authorize('manage-users', User::class);

        $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email,' . $user->id,
            'role'       => 'required|in:' . implode(',', [
                User::ROLE_SUPER_ADMIN,
                User::ROLE_CENTRAL_USER,
                User::ROLE_ADMIN_DISTRICT,
                User::ROLE_USER_DISTRICT
            ]),
            'id_district'=> 'nullable|exists:districts,id'
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;

        // Affectation du district si rôle district
        if (in_array($request->role, [User::ROLE_ADMIN_DISTRICT, User::ROLE_USER_DISTRICT])) {
            $user->id_district = $request->id_district;
        } else {
            $user->id_district = null;
        }

        $user->save();

        return redirect()->back()->with('success', 'Utilisateur mis à jour');
    }
}