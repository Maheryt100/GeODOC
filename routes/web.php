<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Route concernant tous les Demandeurs
    Route::get('demandeurs', function (){
       return Inertia::render('demandeurs/index');
    })->name('demandeurs');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
