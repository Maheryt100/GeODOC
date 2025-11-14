<?php

// routes/web.php

use App\Http\Controllers\DossierController;
use App\Http\Controllers\ProprieteController;
use App\Http\Controllers\DemandeurController;
use App\Http\Controllers\DemandeurProprieteController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\DistrictController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\DocumentGenerationController;
use App\Http\Controllers\AssociationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StatController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============ ROUTES PUBLIQUES ============
Route::get('/', function () {
    return to_route('login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
});

// ============ ROUTES AUTHENTIFIÉES ============
Route::middleware(['auth', 'district.scope'])->group(function () {
    
    // Dashboard avec statistiques par district
    Route::get('/dashboard', [StatController::class, 'index'])->name('dashboard');
    
    // ============ DOSSIERS ============
    Route::prefix('dossiers')->name('dossiers')->group(function () {
        Route::get('/', [DossierController::class, 'index']);
        
        // Création (permission create requise)
        Route::middleware('district.access:create')->group(function () {
            Route::get('/create', [DossierController::class, 'create'])->name('.create');
            Route::post('/', [DossierController::class, 'store'])->name('.store');
        });
        
        // Consultation (vérification automatique du district)
        Route::middleware('dossier.access:id')->group(function () {
            Route::get('/{id}', [DossierController::class, 'show'])->name('.show');
            Route::get('/{id}/demandeurs', [DossierController::class, 'demandeurs'])->name('.demandeurs');
            Route::get('/{id}/proprietes', [DossierController::class, 'proprietes'])->name('.proprietes');
        });
        
        // Modification (permission update requise)
        Route::middleware(['district.access:update', 'dossier.access:id'])->group(function () {
            Route::get('/{id}/edit', [DossierController::class, 'edit'])->name('.edit');
            Route::put('/{id}', [DossierController::class, 'update'])->name('.update');
        });
        
        // Suppression (permission delete requise)
        Route::delete('/{id}', [DossierController::class, 'destroy'])
            ->middleware(['district.access:delete', 'dossier.access:id'])
            ->name('.destroy');
        
        // Recherche
        Route::get('/search', [DossierController::class, 'search'])->name('.search');
    });

    // ============ PROPRIÉTÉS ============
    Route::prefix('proprietes')->name('proprietes.')->group(function () {
        Route::get('/dossier/{id_dossier}', [ProprieteController::class, 'index'])
            ->middleware('dossier.access:id_dossier')
            ->name('index');
        
        Route::middleware('district.access:create')->group(function () {
            Route::get('/create/{id}', [ProprieteController::class, 'create'])->name('create');
            Route::post('/', [ProprieteController::class, 'store'])->name('store');
        });
        
        Route::get('/{id}', [ProprieteController::class, 'show'])->name('show');
        
        Route::middleware('district.access:update')->group(function () {
            Route::get('/{id}/edit', [ProprieteController::class, 'edit'])->name('edit');
            Route::put('/{id}', [ProprieteController::class, 'update'])->name('update');
        });
        
        Route::middleware('district.access:delete')->group(function () {
            Route::delete('/{id}', [ProprieteController::class, 'destroy'])->name('destroy');
        });
        
        // Archive (permission spéciale)
        Route::middleware('district.access:archive')->group(function () {
            Route::post('/archive', [ProprieteController::class, 'archive'])->name('archive');
            Route::post('/unarchive', [ProprieteController::class, 'unarchive'])->name('unarchive');
        });
    });

    // ============ DEMANDEURS ============
    Route::prefix('demandeurs')->name('demandeurs.')->group(function () {
        Route::get('/dossier/{id_dossier}', [DemandeurController::class, 'index'])
            ->middleware('dossier.access:id_dossier')
            ->name('index');
        
        Route::middleware('district.access:create')->group(function () {
            Route::get('/create/{id}', [DemandeurController::class, 'create'])->name('create');
            Route::post('/', [DemandeurController::class, 'store'])->name('store');
            Route::get('/exist/{id}', [DemandeurController::class, 'exist'])->name('exist');
            Route::post('/search-cin', [DemandeurController::class, 'searchCin'])->name('searchCin');
            Route::post('/store-exist', [DemandeurController::class, 'storeExist'])->name('storeExist');
        });
        
        Route::middleware('district.access:update')->group(function () {
            Route::get('/{id_dossier}/{id_demandeur}/edit', [DemandeurController::class, 'edit'])->name('edit');
            Route::put('/{id}', [DemandeurController::class, 'update'])->name('update');
        });
        
        Route::middleware('district.access:delete')->group(function () {
            Route::delete('/{id_dossier}/{id_demandeur}', [DemandeurController::class, 'destroy'])->name('destroy');
            Route::delete('/{id_demandeur}/definitive', [DemandeurController::class, 'destroyDefinitive'])->name('destroyDefinitive');
        });
    });

    // ============ DEMANDES (DOCUMENTS) ============
    Route::prefix('demandes')->name('demandes.')->group(function () {
        Route::get('/dossier/{dossierId}', [DemandeController::class, 'index'])
            ->middleware('dossier.access:dossierId')
            ->name('index');
        
        Route::middleware('district.access:create')->group(function () {
            Route::get('/create/{id}', [DemandeController::class, 'create'])->name('create');
            Route::post('/', [DemandeController::class, 'store'])->name('store');
        });
        
        Route::get('/{id}/download', [DemandeController::class, 'download'])->name('download');
        Route::get('/{id}/csf', [DemandeController::class, 'downloadCSF'])->name('downloadCSF');
        
        Route::middleware('district.access:archive')->group(function () {
            Route::post('/archive', [DemandeController::class, 'archive'])->name('archive');
            Route::post('/unarchive', [DemandeController::class, 'unarchive'])->name('unarchive');
        });
        
        Route::middleware('district.access:export')->group(function () {
            Route::get('/{id}/export', [DemandeController::class, 'exportList'])->name('export');
        });
    });

    // ============ ASSOCIATIONS DEMANDEUR-PROPRIÉTÉ ============
    Route::middleware('district.access:create')->group(function () {
        // Nouveau lot - Créer une nouvelle propriété avec demandeur
        Route::get('/nouveau-lot/{id}', [DemandeurProprieteController::class, 'create'])
            ->name('nouveau-lot.create');
        Route::post('/nouveau-lot', [DemandeurProprieteController::class, 'store'])
            ->name('nouveau-lot.store');
        
        // Lier demandeur existant - Associer un demandeur existant à une propriété existante
        Route::get('/lier-demandeur/{id}/{id_demandeur?}/{id_propriete?}', [DemandeurProprieteController::class, 'linkExisting'])
            ->name('lier-demandeur.create');
        Route::post('/lier-demandeur/search', [DemandeurProprieteController::class, 'searchToLink'])
            ->name('lier-demandeur.search');
        Route::post('/lier-demandeur/store', [DemandeurProprieteController::class, 'storeLink'])
            ->name('lier-demandeur.store');
        
        // Ajouter demandeur - Ajouter un nouveau demandeur à une propriété existante
        Route::get('/ajouter-demandeur/{id}/{id_propriete?}', [DemandeurProprieteController::class, 'addToProperty'])
            ->name('ajouter-demandeur.create');
        Route::post('/ajouter-demandeur/store', [DemandeurProprieteController::class, 'storeToProperty'])
            ->name('ajouter-demandeur.store');
    });
    
    // Dissocier - Retirer un demandeur d'une propriété
    Route::middleware('district.access:delete')->group(function () {
        Route::post('/demandeur-propriete/dissociate', [DemandeurProprieteController::class, 'dissociate'])
            ->name('demandeur-propriete.dissociate');
    });

    // ============ CONFIGURATION DES PRIX ============
    // Accessible seulement aux super_admin et admin_district
    Route::prefix('circonscription')->name('circonscription.')
        ->middleware('district.access:configure_prices')
        ->group(function () {
            Route::get('/', [DistrictController::class, 'index'])->name('index');
            Route::post('/update', [DistrictController::class, 'update'])->name('update');
            Route::post('/bulk-update', [DistrictController::class, 'bulkUpdate'])->name('bulkUpdate');
            Route::post('/reset', [DistrictController::class, 'resetPrices'])->name('reset');
        });

    // ============ GESTION DES UTILISATEURS ============
    // Accessible seulement aux super_admin
    Route::prefix('users')->name('users.')
        ->middleware('district.access:manage_users')
        ->group(function () {
            // Liste des utilisateurs
            Route::get('/', [UserManagementController::class, 'index'])->name('index');
            
            // Créer un utilisateur
            Route::get('/create', [UserManagementController::class, 'create'])->name('create');
            Route::post('/', [UserManagementController::class, 'store'])->name('store');
            
            // Modifier un utilisateur
            Route::get('/{id}/edit', [UserManagementController::class, 'edit'])->name('edit');
            Route::put('/{id}', [UserManagementController::class, 'update'])->name('update');
            
            // Toggle statut actif/inactif
            Route::post('/{id}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('toggleStatus');
            
            // Réinitialiser mot de passe
            Route::post('/{id}/reset-password', [UserManagementController::class, 'resetPassword'])->name('resetPassword');
            
            // Supprimer un utilisateur (super admin seulement)
            Route::delete('/{id}', [UserManagementController::class, 'destroy'])->name('destroy');
        });

    // ============ GÉNÉRATION DE DOCUMENTS ============
    Route::prefix('documents')->name('documents.')->group(function () {
        Route::get('/generate/{id_dossier}', [DocumentGenerationController::class, 'index'])
            ->middleware('dossier.access:id_dossier')
            ->name('generate');
        
        Route::get('/acte-vente', [DocumentGenerationController::class, 'generateActeVente'])->name('acte-vente');
        Route::get('/csf', [DocumentGenerationController::class, 'generateCsf'])->name('csf');
        Route::get('/requisition', [DocumentGenerationController::class, 'generateRequisition'])->name('requisition');
    });

    // ============ API ENDPOINTS ============
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/demandeur/{id_demandeur}/proprietes', [AssociationController::class, 'getDemandeurProprietes'])
            ->name('demandeur.proprietes');
        
        Route::get('/propriete/{id_propriete}/demandeurs', [AssociationController::class, 'getProprieteDemandeurs'])
            ->name('propriete.demandeurs');
        
        Route::post('/dissociate', [AssociationController::class, 'dissociate'])
            ->middleware('district.access:delete')
            ->name('dissociate');
    });

    // Logout
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});