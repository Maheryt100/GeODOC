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

    Route::get('demandeurs/create', function (){
        return Inertia::render('demandeurs/create');
    })->name('demandeurs.create');


    //Route concernant tous les propriétés
    Route::get('proprietes', function (){
        return Inertia::render('proprietes/index');
    })->name('proprietes');

    //Route pour la generation des fichiers word
    Route::get('demandes', function (){
        return Inertia::render('demandes/index');
    })->name('demandes');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
