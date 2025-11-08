<?php

use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\ConsortController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\DemandeurController;
use App\Http\Controllers\DemandeurProprieteController;
use App\Http\Controllers\DistrictController;
use App\Http\Controllers\DocumentGenerationController;
use App\Http\Controllers\DossierController;
use App\Http\Controllers\ProprieteController;
use App\Http\Controllers\StatController;

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return to_route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [StatController::class, 'index'])->name('dashboard');

    Route::prefix('dossiers')->group(function () {
        // ==========================================
        // ROUTES DE BASE DES DOSSIERS
        // ==========================================
        Route::get('/', [DossierController::class, 'index'])->name('dossiers');
        Route::get('/create', [DossierController::class, 'create'])->name('dossiers.create');
        Route::post('/store', [DossierController::class, 'store'])->name('dossiers.store');
        Route::post("/search", [DossierController::class, 'search'])->name('dossiers.search');
        Route::get('/search', function () {
            return redirect()->route('dossiers');
        });
        Route::get('/{id}/show', [DossierController::class, 'show'])->name('dossiers.show');
        Route::get("/{id}/edit", [DossierController::class, 'edit'])->name('dossiers.edit');
        Route::post("update/{id}", [DossierController::class, 'update'])->name('dossiers.update');
        Route::get('{id}/list', [DemandeController::class, 'list'])->name('dossiers.list');

        // ==========================================
        // GÉNÉRATION DE DOCUMENTS (NOUVEAU SYSTÈME - ROUTES GET)
        // ==========================================
        Route::get('/{id}/documents/generate', [DocumentGenerationController::class, 'index'])
            ->name('documents.generate');
        
        // ✅ CHANGEMENT IMPORTANT : GET au lieu de POST pour permettre le téléchargement direct
        Route::get('/documents/generate/acte', [DocumentGenerationController::class, 'generateActeVente'])
            ->name('documents.generate.acte');
        Route::get('/documents/generate/csf', [DocumentGenerationController::class, 'generateCsf'])
            ->name('documents.generate.csf');
        Route::get('/documents/generate/requisition', [DocumentGenerationController::class, 'generateRequisition'])
            ->name('documents.generate.requisition');

        // ==========================================
        // DEMANDEUR-PROPRIETE (3 WORKFLOWS)
        // ==========================================
        
        // 1. NOUVEAU LOT : Créer Propriété + Demandeurs ensemble
        Route::get('/{id}/nouveau-lot', [DemandeurProprieteController::class, 'create'])
            ->name('nouveau-lot.create');
        Route::post('/nouveau-lot/store', [DemandeurProprieteController::class, 'store'])
            ->name('nouveau-lot.store');

        // 2. AJOUTER DEMANDEUR : Ajouter un demandeur à une propriété existante
        Route::get('/{id}/ajouter-demandeur/{id_propriete?}', [DemandeurProprieteController::class, 'addToProperty'])
            ->name('ajouter-demandeur.create');
        Route::post('/ajouter-demandeur/store', [DemandeurProprieteController::class, 'storeToProperty'])
            ->name('ajouter-demandeur.store');

        // 3. LIER EXISTANT : Lier un demandeur existant à une propriété existante
        Route::get('/{id}/lier-demandeur/{id_demandeur?}/{id_propriete?}', [DemandeurProprieteController::class, 'linkExisting'])
            ->name('lier-demandeur.create');
        Route::post('/lier-demandeur/search', [DemandeurProprieteController::class, 'searchToLink'])
            ->name('lier-demandeur.search');
        Route::post('/lier-demandeur/store', [DemandeurProprieteController::class, 'storeLink'])
            ->name('lier-demandeur.store');

        // 4. DISSOCIER : Dissocier un demandeur d'une propriété
        Route::post('/dissocier', [DemandeurProprieteController::class, 'dissociate'])
            ->name('demandeur-propriete.dissociate');

        // ==========================================
        // DEMANDEURS
        // ==========================================
        Route::get('/{id}/demandeurs', [DossierController::class, 'demandeurs'])->name('dossiers.demandeurs');
        Route::get('/{id}/demandeur/create', [DemandeurController::class, 'create'])->name('demandeurs.create');
        Route::get('/{dossier}/demandeur/edit/{demandeur}', [DemandeurController::class, 'edit'])->name('demandeurs.edit');
        Route::delete('/{dossier}/demandeur/delete/{demandeur}', [DemandeurController::class, 'destroy'])->name('demandeurs.destroy');
        Route::post('/demandeurs/search/insert', [DemandeurController::class, 'searchCin'])->name('demandeurs.searchCin');
        Route::post('/demandeurs/store/exist', [DemandeurController::class, 'storeExist'])->name('store.exist');
        Route::post('demandeurs/store', [DemandeurController::class, 'store'])->name('demandeurs.store');
        Route::put('demandeurs/{id}', [DemandeurController::class, 'update'])->name('demandeurs.update');
        Route::get('demandeurs/search/{dossier}', [DemandeurController::class, 'index'])->name('demandeurs.search');
        Route::delete('/demandeurs/{demandeur}/destroy-definitive', [DemandeurController::class, 'destroyDefinitive'])->name('demandeurs.destroy.definitive');

        // ==========================================
        // PROPRIETES
        // ==========================================
        Route::get('{id}/proprietes', [DossierController::class, 'proprietes'])->name('dossiers.proprietes');
        Route::get('{id}/proprietes/create', [ProprieteController::class, 'create'])->name('proprietes.create');
        Route::get('propriete/edit/{id}', [ProprieteController::class, 'edit'])->name('proprietes.edit');
        Route::delete('proprietes/{id}', [ProprieteController::class, 'destroy'])->name('proprietes.destroy');
        Route::get('proprietes/search/{dossier}', [ProprieteController::class, 'index'])->name('proprietes.search');
        
        // Archive/Désarchive propriété
        Route::post('/proprietes/archive', [ProprieteController::class, 'archive'])
            ->name('proprietes.archive');
        Route::post('/proprietes/unarchive', [ProprieteController::class, 'unarchive'])
            ->name('proprietes.unarchive');

        // ==========================================
        // DOCUMENTS & LISTES (ANCIEN SYSTÈME)
        // ==========================================
        Route::get('/list/search/{dossier}', [DemandeController::class, 'index'])->name('documents.index');
        Route::get('{id}/lier/document', [DemandeController::class, 'create'])->name('lier.document');
        Route::post('document/archive', [DemandeController::class, 'archive'])->name('document.archive');
        Route::post('document/unarchive', [DemandeController::class, 'unarchive'])->name('document.unarchive');
        
        // Téléchargements (ANCIEN - utilisé par l'ancien système)
        Route::get('download/{id}/document', [DemandeController::class, 'download'])->name('document.download');
        Route::get('download/{id}/CSF', [DemandeController::class, 'downloadCSF'])->name('download.CSF');
        
        Route::get('export/{id}/list', [DemandeController::class, 'exportList'])->name('export.list');
    });

    // ==========================================
    // ROUTES GLOBALES PROPRIETES
    // ==========================================
    Route::get('proprietes', [ProprieteController::class, 'index'])->name('proprietes');
    Route::post('proprietes/store', [ProprieteController::class, 'store'])->name('proprietes.store');
    Route::get('proprietes/{id}/edit', [ProprieteController::class, 'edit'])->name('proprietes.edit');
    Route::put('proprietes/{id}', [ProprieteController::class, 'update'])->name('proprietes.update');
    Route::get('proprietes/{id}/show', [ProprieteController::class, 'show'])->name('proprietes.show');

    // ==========================================
    // ANCIEN SYSTÈME DE GÉNÉRATION (PEUT ÊTRE SUPPRIMÉ APRÈS MIGRATION COMPLÈTE)
    // ==========================================
    Route::get('documents/create', [DemandeController::class, 'create'])->name('documents.create');
    Route::post('documents/store', [DemandeController::class, 'store'])->name('documents.store');

    // ==========================================
    // CONSORTS
    // ==========================================
    Route::get('consorts', [ConsortController::class, 'index'])->name('consorts');
    Route::get('consorts/search', function () {
        return redirect()->route('consorts');
    })->name('consorts.search');
    Route::prefix('consorts')->group(function () {
        Route::get('archive/{id}/{demandeur}', [ConsortController::class, 'archive'])->name('consorts.archive');
        Route::post('search', [ConsortController::class, 'search'])->name('consorts.search');
    });

    // ==========================================
    // PRIX DES TERRAINS
    // ==========================================
    Route::get('prix/terrain', [DistrictController::class, 'index'])->name('districts.terrain');
    Route::prefix('terrain')->group(function () {
        Route::post('update', [DistrictController::class, 'update'])->name('terrain.update');
    });

    // ==========================================
    // GESTION UTILISATEURS
    // ==========================================
    Route::get('add/users', [RegisteredUserController::class, 'create'])->name('add.users');
    Route::post('add/users', [RegisteredUserController::class, 'store'])->name('users.store');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';