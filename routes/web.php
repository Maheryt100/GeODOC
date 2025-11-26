<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AssociationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\DemandeurController;
use App\Http\Controllers\DemandeurProprieteController;
use App\Http\Controllers\DistrictController;
use App\Http\Controllers\DossierController;
use App\Http\Controllers\DocumentGenerationController;
use App\Http\Controllers\PieceJointeController;
use App\Http\Controllers\ProprieteController;
use App\Http\Controllers\StatController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\GlobalSearchController; // ✅ NOUVEAU
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================================================
// ROUTES PUBLIQUES
// ============================================================================

Route::get('/', function () {
    return to_route('login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
});

// ============================================================================
// ROUTES AUTHENTIFIÉES
// ============================================================================

Route::middleware(['auth', 'district.scope'])->group(function () {
    
    // ============================================================================
    // DASHBOARD
    // ============================================================================
    
    Route::get('/dashboard', [StatController::class, 'index'])->name('dashboard');
    Route::get('/statistiques', [StatController::class, 'statistics'])->name('statistiques.index');

    // ============================================================================
    // STATISTIQUES
    // ============================================================================
    
    Route::prefix('statistiques')->name('statistiques.')->group(function () {
        Route::get('/', [StatController::class, 'statistics'])->name('index');
        Route::get('/export-pdf', [StatController::class, 'exportPDF'])->name('export-pdf');
    });

    // ============================================================================
    // PARAMÈTRES UTILISATEUR (Settings)
    // ============================================================================
    
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::redirect('/', '/settings/profile');
        
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        
        Route::get('/password', [PasswordController::class, 'edit'])->name('password.edit');
        Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
        
        Route::get('/appearance', fn() => Inertia::render('settings/appearance'))->name('appearance');
    });

    // ============================================================================
    // DOSSIERS
    // ============================================================================
    
    Route::prefix('dossiers')->name('dossiers')->group(function () {
        Route::get('/', [DossierController::class, 'index']);
        
        // Création
        Route::middleware('district.access:create')->group(function () {
            Route::get('/create', [DossierController::class, 'create'])->name('.create');
            Route::post('/', [DossierController::class, 'store'])->name('.store');
        });
        
        // Consultation
        Route::middleware('dossier.access:id')->group(function () {
            Route::get('/{id}', [DossierController::class, 'show'])->name('.show');
            Route::get('/{id}/demandeurs', [DossierController::class, 'demandeurs'])->name('.demandeurs');
            Route::get('/{id}/proprietes', [DossierController::class, 'proprietes'])->name('.proprietes');
        });
        
        // Modification
        Route::middleware(['district.access:update', 'dossier.access:id', 'check.dossier.closed:modify'])->group(function () {
            Route::get('/{id}/edit', [DossierController::class, 'edit'])->name('.edit');
            Route::put('/{id}', [DossierController::class, 'update'])->name('.update');
        });
        
        // Suppression
        Route::delete('/{id}', [DossierController::class, 'destroy'])
            ->middleware(['district.access:delete', 'dossier.access:id', 'check.dossier.closed:modify'])
            ->name('.destroy');
        
        // Fermeture/Réouverture
        Route::middleware(['district.access:manage_users', 'dossier.access:id'])->group(function () {
            Route::post('/{id}/close', [DossierController::class, 'close'])->name('.close');
            Route::post('/{id}/reopen', [DossierController::class, 'reopen'])->name('.reopen');
        });
    });

    // ============================================================================
    // PROPRIÉTÉS
    // ============================================================================
    
    Route::prefix('proprietes')->name('proprietes.')->group(function () {
        Route::get('/dossier/{id_dossier}', [ProprieteController::class, 'index'])
            ->middleware('dossier.access:id_dossier')
            ->name('index');
        
        // Création
        Route::middleware(['district.access:create', 'check.dossier.closed:modify'])->group(function () {
            Route::get('/create/{id}', [ProprieteController::class, 'create'])->name('create');
            Route::post('/', [ProprieteController::class, 'store'])->name('store');
            Route::post('/store-multiple', [ProprieteController::class, 'storeMultiple'])->name('store-multiple');
        });
        
        // Consultation
        Route::get('/{id}', [ProprieteController::class, 'show'])->name('show');
        
        // Modification
        Route::middleware(['district.access:update', 'check.dossier.closed:modify'])->group(function () {
            Route::get('/{id}/edit', [ProprieteController::class, 'edit'])->name('edit');
            Route::put('/{id}', [ProprieteController::class, 'update'])->name('update');
        });
        
        // Suppression
        Route::middleware(['district.access:delete', 'check.dossier.closed:modify'])->group(function () {
            Route::delete('/{id}', [ProprieteController::class, 'destroy'])->name('destroy');
        });
        
        // Archivage
        Route::middleware(['district.access:archive', 'check.dossier.closed:modify'])->group(function () {
            Route::post('/archive', [ProprieteController::class, 'archive'])->name('archive');
            Route::post('/unarchive', [ProprieteController::class, 'unarchive'])->name('unarchive');
        });
    });

    // ============================================================================
    // DEMANDEURS
    // ============================================================================
    
    Route::prefix('demandeurs')->name('demandeurs.')->group(function () {
        Route::get('/dossier/{id_dossier}', [DemandeurController::class, 'index'])
            ->middleware('dossier.access:id_dossier')
            ->name('index');
        
        // Création
        Route::middleware(['district.access:create', 'check.dossier.closed:modify'])->group(function () {
            Route::get('/create/{id}', [DemandeurController::class, 'create'])->name('create');
            Route::post('/', [DemandeurController::class, 'store'])->name('store');
            Route::post('/store-multiple', [DemandeurController::class, 'storeMultiple'])->name('store-multiple');
            Route::get('/exist/{id}', [DemandeurController::class, 'exist'])->name('exist');
            Route::post('/store-exist', [DemandeurController::class, 'storeExist'])->name('storeExist');
        });
        
        // Modification
        Route::middleware(['district.access:update', 'check.dossier.closed:modify'])->group(function () {
            Route::get('/{id_dossier}/{id_demandeur}/edit', [DemandeurController::class, 'edit'])->name('edit');
            Route::put('/{id}', [DemandeurController::class, 'update'])->name('update');
        });
        
        // Suppression
        Route::middleware(['district.access:delete', 'check.dossier.closed:modify'])->group(function () {
            Route::delete('/{id_dossier}/{id_demandeur}', [DemandeurController::class, 'destroy'])->name('destroy');
            Route::delete('/{id_demandeur}/definitive', [DemandeurController::class, 'destroyDefinitive'])->name('destroyDefinitive');
        });
    });

    // ============================================================================
    // DEMANDES (DOCUMENTS)
    // ============================================================================
    
    Route::prefix('demandes')->name('demandes.')->group(function () {
        Route::get('/dossier/{dossierId}', [DemandeController::class, 'index'])
            ->middleware('dossier.access:dossierId')
            ->name('index');
        
        // Route de résumé
        Route::get('/resume/{dossierId}', [DemandeController::class, 'resume'])
            ->middleware('dossier.access:dossierId')
            ->name('resume');
        
        // Création
        Route::middleware('district.access:create')->group(function () {
            Route::get('/create/{id}', [DemandeController::class, 'create'])->name('create');
            Route::post('/', [DemandeController::class, 'store'])->name('store');
        });
        
        // Téléchargement
        Route::get('/{id}/download', [DemandeController::class, 'download'])->name('download');
        Route::get('/{id}/csf', [DemandeController::class, 'downloadCSF'])->name('downloadCSF');
        
        // Archivage
        Route::middleware('district.access:archive')->group(function () {
            Route::post('/archive', [DemandeController::class, 'archive'])->name('archive');
            Route::post('/unarchive', [DemandeController::class, 'unarchive'])->name('unarchive');
        });
        
        // Export
        Route::middleware('district.access:export')->group(function () {
            Route::get('/{id}/export', [DemandeController::class, 'exportList'])->name('export');
        });
    });

    // ============================================================================
    // ASSOCIATIONS DEMANDEUR-PROPRIÉTÉ
    // ============================================================================
    
    Route::middleware(['district.access:create', 'check.dossier.closed:modify'])->group(function () {
        Route::post('/association/link', [AssociationController::class, 'link'])->name('association.link');
    });
    
    Route::middleware(['district.access:delete', 'check.dossier.closed:modify'])->group(function () {
        Route::post('/association/dissociate', [AssociationController::class, 'dissociate'])->name('association.dissociate');
    });

    // ============================================================================
    // ROUTES DE COMPATIBILITÉ (anciennes routes)
    // ============================================================================
    
    Route::middleware(['district.access:create', 'check.dossier.closed:modify'])->group(function () {
        // Création nouveau lot avec demandeur
        Route::get('/nouveau-lot/{id}', [DemandeurProprieteController::class, 'create'])->name('nouveau-lot.create');
        Route::post('/nouveau-lot', [DemandeurProprieteController::class, 'store'])->name('nouveau-lot.store');
        
        // Anciens formulaires de liaison
        Route::get('/lier-demandeur/{id}/{id_demandeur?}/{id_propriete?}', [DemandeurProprieteController::class, 'linkExisting'])->name('lier-demandeur.create');
        Route::post('/lier-demandeur/search', [DemandeurProprieteController::class, 'searchToLink'])->name('lier-demandeur.search');
        Route::post('/lier-demandeur/store', [DemandeurProprieteController::class, 'storeLink'])->name('lier-demandeur.store');
        
        // Anciens formulaires d'ajout à propriété
        Route::get('/ajouter-demandeur/{id}/{id_propriete?}', [DemandeurProprieteController::class, 'addToProperty'])->name('ajouter-demandeur.create');
        Route::post('/ajouter-demandeur/store', [DemandeurProprieteController::class, 'storeToProperty'])->name('ajouter-demandeur.store');
    });

    // ============================================================================
    // CONFIGURATION DES PRIX (Districts)
    // ============================================================================
    
    Route::prefix('circonscription')->name('circonscription.')
        ->middleware('district.access:configure_prices')
        ->group(function () {
            Route::get('/', [DistrictController::class, 'index'])->name('index');
            Route::post('/update', [DistrictController::class, 'update'])->name('update');
            Route::post('/bulk-update', [DistrictController::class, 'bulkUpdate'])->name('bulkUpdate');
            Route::post('/reset', [DistrictController::class, 'resetPrices'])->name('reset');
        });

    // ============================================================================
    // GESTION DES UTILISATEURS
    // ============================================================================
    
    Route::prefix('users')->name('users.')
        ->middleware('district.access:manage_users')
        ->group(function () {
            Route::get('/', [UserManagementController::class, 'index'])->name('index');
            Route::get('/create', [UserManagementController::class, 'create'])->name('create');
            Route::post('/', [UserManagementController::class, 'store'])->name('store');
            Route::get('/{id}/edit', [UserManagementController::class, 'edit'])->name('edit');
            Route::put('/{id}', [UserManagementController::class, 'update'])->name('update');
            Route::post('/{id}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('toggleStatus');
            Route::post('/{id}/reset-password', [UserManagementController::class, 'resetPassword'])->name('resetPassword');
            Route::delete('/{id}', [UserManagementController::class, 'destroy'])->name('destroy');
        });

    // ============================================================================
    // GÉNÉRATION DE DOCUMENTS
    // ============================================================================
    
    Route::prefix('documents')->name('documents.')->group(function () {
        Route::get('/generate/{id_dossier}', [DocumentGenerationController::class, 'index'])
            ->middleware('dossier.access:id_dossier')
            ->name('generate');
        
        // ✅ Routes de génération/téléchargement unifiées
        Route::get('/recu', [DocumentGenerationController::class, 'generateRecu'])->name('recu');
        Route::get('/acte-vente', [DocumentGenerationController::class, 'generateActeVente'])->name('acte-vente');
        Route::get('/csf', [DocumentGenerationController::class, 'generateCsf'])->name('csf');
        Route::get('/requisition', [DocumentGenerationController::class, 'generateRequisition'])->name('requisition');
        
        // ✅ Téléchargement d'un document existant (par ID)
        Route::get('/recu/{id}/download', [DocumentGenerationController::class, 'downloadRecu'])->name('recu.download');
        
        // ✅ Historique des documents
        Route::get('/recu/history/{id_propriete}', [DocumentGenerationController::class, 'getRecuHistory'])->name('recu.history');
    });

    // ============================================================================
    // PIÈCES JOINTES
    // ============================================================================
    
    Route::prefix('pieces-jointes')->name('pieces-jointes.')->group(function () {
        // Lister les pièces jointes d'une entité
        Route::get('/', [PieceJointeController::class, 'index'])
            ->name('index');
        
        // Upload de fichiers
        Route::post('/upload', [PieceJointeController::class, 'upload'])
            ->middleware('district.access:create')
            ->name('upload');
        
        // Télécharger un fichier
        Route::get('/{id}/download', [PieceJointeController::class, 'download'])
            ->name('download');
        
        // Visualiser un fichier (inline)
        Route::get('/{id}/view', [PieceJointeController::class, 'view'])
            ->name('view');
        
        // Mettre à jour les métadonnées
        Route::put('/{id}', [PieceJointeController::class, 'update'])
            ->middleware('district.access:update')
            ->name('update');
        
        // Supprimer un fichier
        Route::delete('/{id}', [PieceJointeController::class, 'destroy'])
            ->middleware('district.access:delete')
            ->name('destroy');
        
        // Vérifier un document (admin uniquement)
        Route::post('/{id}/verify', [PieceJointeController::class, 'verify'])
            ->middleware('district.access:manage_users')
            ->name('verify');
    });
    
    // ============================================================================
    // LOGS D'ACTIVITÉ (Admin et Super Admin)
    // ============================================================================
    
    Route::prefix('admin/activity-logs')->name('admin.activity-logs.')
        ->middleware('district.access:manage_users')
        ->group(function () {
            Route::get('/', [ActivityLogController::class, 'index'])->name('index');
            Route::get('/document-stats', [ActivityLogController::class, 'documentStats'])->name('document-stats');
            Route::get('/user/{userId}', [ActivityLogController::class, 'userActivity'])->name('user-activity');
            Route::get('/export', [ActivityLogController::class, 'export'])->name('export');
        });

    // ============================================================================
    // API ENDPOINTS
    // ============================================================================
    
    Route::prefix('api')->name('api.')->group(function () {
        // Associations
        Route::get('/demandeur/{id_demandeur}/proprietes', [AssociationController::class, 'getDemandeurProprietes'])
            ->name('demandeur.proprietes');
        Route::get('/propriete/{id_propriete}/demandeurs', [AssociationController::class, 'getProprieteDemandeurs'])
            ->name('propriete.demandeurs');
        
        // Recherche demandeur
        Route::get('/demandeur/search-by-cin/{cin}', [DemandeurController::class, 'searchByCin'])
            ->name('demandeur.search-by-cin');
        
        // Dissociation
        Route::post('/dissociate', [AssociationController::class, 'dissociate'])
            ->middleware('district.access:delete')
            ->name('dissociate');

        // ============================================================================
        // RECHERCHE GLOBALE (API)
        // ============================================================================
        
        Route::get('/api/global-search', [GlobalSearchController::class, 'search'])
            ->name('api.global-search');
        Route::get('/api/search-suggestions', [GlobalSearchController::class, 'suggestions'])
            ->name('api.search-suggestions');

    });

    // ============================================================================
    // LOGOUT
    // ============================================================================
    
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});