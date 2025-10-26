<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(){
        if (Auth::user()->role != 'admin') {
            return back()->with('message', 'Seule les administrateurs ont accès à ce fonctionnalité');
        }

        return Inertia::render('settings/list-user',[
            'users' => User::paginate(7),
        ]);
    }

}
