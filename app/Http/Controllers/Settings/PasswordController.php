<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class PasswordController extends Controller
{
    /**
     * Afficher le formulaire de changement de mot de passe
     */
    public function edit()
    {
        return Inertia::render('settings/password');
    }

    /**
     * Mettre à jour le mot de passe
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ], [
            'current_password.required' => 'Le mot de passe actuel est obligatoire',
            'current_password.current_password' => 'Le mot de passe actuel est incorrect',
            'password.required' => 'Le nouveau mot de passe est obligatoire',
            'password.confirmed' => 'Les mots de passe ne correspondent pas',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return Redirect::route('password.edit')
            ->with('success', 'Mot de passe mis à jour avec succès');
    }
}