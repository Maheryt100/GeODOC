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
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Dashboard\StatisticsController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\GlobalSearchController;
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
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');
    
    // Statistiques
    Route::prefix('statistiques')->name('statistiques.')->group(function () {
    Route::get('/', [StatisticsController::class, 'index'])
        ->name('index');
    Route::post('/export-pdf', [StatisticsController::class, 'exportPDF'])
        ->name('export-pdf');
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
    // ✅ ASSOCIATIONS DEMANDEUR-PROPRIÉTÉ - ROUTES CORRIGÉES
    // ============================================================================
    
    // ✅ LIAISON (CREATE)
    Route::post('/association/link', [AssociationController::class, 'link'])
        ->middleware(['district.access:create', 'check.dossier.closed:modify'])
        ->name('association.link');
    
    // ✅ DISSOCIATION (DELETE) - MIDDLEWARES CORRIGÉS
    Route::post('/association/dissociate', [AssociationController::class, 'dissociate'])
        ->middleware(['auth', 'district.scope']) // ✅ Pas besoin de check.dossier.closed ici, géré dans le controller
        ->name('association.dissociate');

    // ============================================================================
    // ROUTES DE COMPATIBILITÉ (anciennes routes)
    // ============================================================================
    
    Route::middleware(['district.access:create', 'check.dossier.closed:modify'])->group(function () {
        Route::get('/nouveau-lot/{id}', [DemandeurProprieteController::class, 'create'])->name('nouveau-lot.create');
        Route::post('/nouveau-lot', [DemandeurProprieteController::class, 'store'])->name('nouveau-lot.store');
        
        Route::get('/lier-demandeur/{id}/{id_demandeur?}/{id_propriete?}', [DemandeurProprieteController::class, 'linkExisting'])->name('lier-demandeur.create');
        Route::post('/lier-demandeur/search', [DemandeurProprieteController::class, 'searchToLink'])->name('lier-demandeur.search');
        Route::post('/lier-demandeur/store', [DemandeurProprieteController::class, 'storeLink'])->name('lier-demandeur.store');
        
        Route::get('/ajouter-demandeur/{id}/{id_propriete?}', [DemandeurProprieteController::class, 'addToProperty'])->name('ajouter-demandeur.create');
        Route::post('/ajouter-demandeur/store', [DemandeurProprieteController::class, 'storeToProperty'])->name('ajouter-demandeur.store');
    });

    // ============================================================================
    // GESTION DES LOCALISATIONS ET PRIX
    // ============================================================================
    
    Route::prefix('location')->name('location.')
        ->middleware('district.access:configure_prices')
        ->group(function () {
            Route::get('/', [DistrictController::class, 'index'])->name('index');
            Route::post('/update', [DistrictController::class, 'update'])->name('update');
            Route::post('/bulk-update', [DistrictController::class, 'bulkUpdate'])->name('bulkUpdate');
            Route::post('/reset', [DistrictController::class, 'resetPrices'])->name('reset');
            Route::get('/export', [DistrictController::class, 'export'])->name('export');
            Route::get('/search', [DistrictController::class, 'search'])->name('search');
            Route::get('/{id}', [DistrictController::class, 'show'])->name('show');
        });

    Route::redirect('/circonscription', '/location')->name('circonscription.index');
    Route::post('/circonscription/update', [DistrictController::class, 'update'])->name('circonscription.update');
    Route::post('/circonscription/bulk-update', [DistrictController::class, 'bulkUpdate'])->name('circonscription.bulkUpdate');
    Route::post('/circonscription/reset', [DistrictController::class, 'resetPrices'])->name('circonscription.reset');

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
        // Page d'index
        Route::get('/generate/{id_dossier}', [DocumentGenerationController::class, 'index'])
            ->middleware('dossier.access:id_dossier')
            ->name('generate');
        
        // ✅ IMPORTANT : Ces routes NE DOIVENT PAS avoir de middleware 'check.dossier.closed'
        // car elles sont en lecture seule (téléchargement)
        Route::get('/recu', [DocumentGenerationController::class, 'generateRecu'])
            ->name('recu');
        
        Route::get('/acte-vente', [DocumentGenerationController::class, 'generateActeVente'])
            ->name('acte-vente');
        
        Route::get('/csf', [DocumentGenerationController::class, 'generateCsf'])
            ->name('csf');
        
        Route::get('/requisition', [DocumentGenerationController::class, 'generateRequisition'])
            ->name('requisition');
        
        // Téléchargement de reçus existants
        Route::get('/recu/{id}/download', [DocumentGenerationController::class, 'downloadRecu'])
            ->name('recu.download');
        
        // Historique
        Route::get('/recu/history/{id_propriete}', [DocumentGenerationController::class, 'getRecuHistory'])
            ->name('recu.history');
    });

    // ============================================================================
    // PIÈCES JOINTES
    // ============================================================================
    
    Route::prefix('pieces-jointes')->name('pieces-jointes.')->group(function () {
        Route::get('/', [PieceJointeController::class, 'index'])->name('index');
        
        Route::post('/upload', [PieceJointeController::class, 'upload'])
            ->middleware('district.access:create')
            ->name('upload');
        
        Route::get('/{id}/download', [PieceJointeController::class, 'download'])->name('download');
        Route::get('/{id}/view', [PieceJointeController::class, 'view'])->name('view');
        
        Route::put('/{id}', [PieceJointeController::class, 'update'])
            ->middleware('district.access:update')
            ->name('update');
        
        Route::delete('/{id}', [PieceJointeController::class, 'destroy'])
            ->middleware('district.access:delete')
            ->name('destroy');
        
        Route::post('/{id}/verify', [PieceJointeController::class, 'verify'])
            ->middleware('district.access:manage_users')
            ->name('verify');
    });
    
    // ============================================================================
    // LOGS D'ACTIVITÉ
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
        
        // ✅ Dissociation API (déjà définie ci-dessus, pas besoin de dupliquer)
        // Route::post('/dissociate', ...) - SUPPRIMÉE car dupliquée

        // Recherche globale
        Route::get('/global-search', [GlobalSearchController::class, 'search'])
            ->name('global-search');
        Route::get('/search-suggestions', [GlobalSearchController::class, 'suggestions'])
            ->name('search-suggestions');


            /**
             * ✅ NOUVEAU : Statistiques de génération de documents
             */
            Route::get('/dossier/{id_dossier}/documents/stats', function($id_dossier) {
                $dossier = \App\Models\Dossier::findOrFail($id_dossier);
                
                // Statistiques des propriétés (basées sur demander.status)
                $totalProprietes = $dossier->proprietes()->count();
                
                $proprietesAvecDemandeursArchives = $dossier->proprietes()
                    ->whereHas('demandeurs', function($query) {
                        $query->where('demander.status', 'archive');
                    })
                    ->whereDoesntHave('demandeurs', function($query) {
                        $query->where('demander.status', 'active');
                    })
                    ->count();
                
                $proprietesSansDemandeur = $dossier->proprietes()
                    ->whereDoesntHave('demandeurs', function($query) {
                        $query->where('demander.status', 'active');
                    })
                    ->count();
                
                $proprietesDisponibles = $dossier->proprietes()
                    ->whereHas('demandeurs', function($query) {
                        $query->where('demander.status', 'active');
                    })
                    ->count();
                
                // Statistiques des documents générés
                $recusGeneres = \App\Models\DocumentGenere::where('id_dossier', $id_dossier)
                    ->where('type_document', \App\Models\DocumentGenere::TYPE_RECU)
                    ->where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)
                    ->count();
                
                $advGeneres = \App\Models\DocumentGenere::where('id_dossier', $id_dossier)
                    ->where('type_document', \App\Models\DocumentGenere::TYPE_ADV)
                    ->where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)
                    ->count();
                
                $csfGeneres = \App\Models\DocumentGenere::where('id_dossier', $id_dossier)
                    ->where('type_document', \App\Models\DocumentGenere::TYPE_CSF)
                    ->where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)
                    ->count();
                
                $requisitionsGenerees = \App\Models\DocumentGenere::where('id_dossier', $id_dossier)
                    ->where('type_document', \App\Models\DocumentGenere::TYPE_REQ)
                    ->where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)
                    ->count();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'proprietes' => [
                            'total' => $totalProprietes,
                            'disponibles' => $proprietesDisponibles,
                            'avec_demandeurs_archives' => $proprietesAvecDemandeursArchives,
                            'sans_demandeur' => $proprietesSansDemandeur,
                            'pourcentage_disponible' => $totalProprietes > 0 
                                ? round(($proprietesDisponibles / $totalProprietes) * 100, 1) 
                                : 0,
                        ],
                        'documents' => [
                            'recus' => $recusGeneres,
                            'actes_vente' => $advGeneres,
                            'csf' => $csfGeneres,
                            'requisitions' => $requisitionsGenerees,
                            'total' => $recusGeneres + $advGeneres + $csfGeneres + $requisitionsGenerees,
                        ],
                        'progression' => [
                            'recus_vs_proprietes' => $proprietesDisponibles > 0
                                ? round(($recusGeneres / $proprietesDisponibles) * 100, 1)
                                : 0,
                            'adv_vs_recus' => $recusGeneres > 0
                                ? round(($advGeneres / $recusGeneres) * 100, 1)
                                : 0,
                        ],
                    ],
                ]);
            })->name('dossier.documents.stats');
            
            /**
             * ✅ NOUVEAU : Vérifier la disponibilité d'une propriété
             */
            Route::get('/propriete/{id}/availability', function($id) {
                $propriete = \App\Models\Propriete::with('dossier')->findOrFail($id);
                
                $demandeursActifs = \App\Models\Demander::where('id_propriete', $id)
                    ->where('status', 'active')
                    ->count();
                
                $demandeursArchives = \App\Models\Demander::where('id_propriete', $id)
                    ->where('status', 'archive')
                    ->count();
                
                $hasRecu = \App\Models\DocumentGenere::where('type_document', \App\Models\DocumentGenere::TYPE_RECU)
                    ->where('id_propriete', $id)
                    ->where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)
                    ->exists();
                
                $status = 'available';
                $message = null;
                
                if ($demandeursActifs === 0 && $demandeursArchives > 0) {
                    $status = 'all_archived';
                    $message = "Tous les demandeurs ({$demandeursArchives}) ont été archivés";
                } elseif ($demandeursActifs === 0) {
                    $status = 'no_demandeur';
                    $message = 'Aucun demandeur actif';
                }
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'propriete_id' => $id,
                        'status' => $status,
                        'message' => $message,
                        'has_recu' => $hasRecu,
                        'demandeurs' => [
                            'actifs' => $demandeursActifs,
                            'archives' => $demandeursArchives,
                            'total' => $demandeursActifs + $demandeursArchives,
                        ],
                        'can_generate' => [
                            'recu' => $status === 'available' && !$hasRecu,
                            'acte_vente' => $status === 'available' && $hasRecu,
                            'csf' => $status === 'available',
                            'requisition' => $demandeursActifs > 0, // ✅ Basé sur demandeurs actifs
                        ],
                    ],
                ]);
            })->name('propriete.availability');
    });

    // ============================================================================
    // LOGOUT
    // ============================================================================
    
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});