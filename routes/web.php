<?php

use App\Http\Controllers\DemandeurController;
use App\Http\Controllers\ProprieteController;
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

    Route::post('demandeurs/store', [DemandeurController::class, 'store'])->name('demandeurs.store');


    //Route concernant tous les propriétés
    Route::get('proprietes', [ProprieteController::class, 'index'])->name('proprietes');
    Route::get('proprietes/create', function (){
       return Inertia::render('proprietes/create');
    })->name('proprietes.create');
    Route::post('proprietes/store', [ProprieteController::class, 'store'])->name('proprietes.store');
    Route::get('proprietes/{id}/edit', [ProprieteController::class, 'edit'])->name('proprietes.edit');
    Route::put('proprietes/{id}', [ProprieteController::class, 'update'])->name('proprietes.update');
    Route::delete('proprietes/{id}', [ProprieteController::class, 'destroy'])->name('proprietes.destroy');
    Route::get('proprietes/{id}/show', [ProprieteController::class, 'show'])->name('proprietes.show');

    //Route pour la generation des fichiers word
    Route::get('demandes', function (){
        return Inertia::render('demandes/index');
    })->name('demandes');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
