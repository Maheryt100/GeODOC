<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/password');
    }

    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }

    /**
     * Admin reset password for a user identified by email.
     */
    public function adminStore(Request $request): RedirectResponse
    {
        // Only allow administrators to perform this action
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }
}
