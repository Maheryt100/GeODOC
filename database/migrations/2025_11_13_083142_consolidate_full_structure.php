<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        
        // ========================================
        // 1. LOCALISATION (Hiérarchie géographique)
        // ========================================
        
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('nom_province', 100);
            $table->timestamps();
            
            $table->index('nom_province');
        });

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('nom_region', 100);
            $table->foreignId('id_province')->constrained('provinces')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('nom_region');
            $table->index('id_province');
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('nom_district', 100);
            
            // ✅ CORRECTION 6: Prix par type de vocation (en Ariary)
            $table->unsignedBigInteger('edilitaire')->default(0);
            $table->unsignedBigInteger('agricole')->default(0);
            $table->unsignedBigInteger('forestiere')->default(0);
            $table->unsignedBigInteger('touristique')->default(0);
            
            $table->foreignId('id_region')->constrained('regions')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('nom_district');
            $table->index('id_region');
        });

        Schema::create('communes', function (Blueprint $table) {
            $table->id();
            $table->string('nom_commune', 100);
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            $table->foreignId('id_region')->constrained('regions')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('nom_commune');
        });
        // ========================================
        // 2. AUTHENTIFICATION ET SYSTÈME
        // ========================================
        
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // ✅ CORRECTION 1: Rôle par défaut 'user' au lieu de 'users'
            $table->string('role', 50)->default('user');
            
            // ✅ CORRECTION 2: Ajout de id_district manquant (CRITIQUE)
            $table->foreignId('id_district')
                ->nullable()
                ->constrained('districts')
                ->onDelete('set null');
            
            $table->boolean('status')->default(true);
            $table->rememberToken();
            $table->timestamps();
            
            // Index pour performance
            $table->index('role');
            $table->index('status');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // ✅ CORRECTION 3: Nom de colonne cohérent id_user au lieu de user_id
        Schema::create('user_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            
            // ✅ CORRECTION 4: Ajout de colonnes manquantes
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            $table->string('action', 50);
            $table->string('resource_type', 50);
            $table->unsignedBigInteger('resource_id')->nullable();
            
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            // Index pour performance
            $table->index(['id_user', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index('created_at');
        });

        // ✅ CORRECTION 5: Ajout de la colonne granted manquante
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('permission', 100);
            $table->boolean('granted')->default(true);
            $table->timestamps();
            
            // Une permission par utilisateur
            $table->unique(['id_user', 'permission']);
            $table->index(['id_user', 'granted']);
        });


        // ========================================
        // 3. DOSSIERS ET PROPRIÉTÉS
        // ========================================
        
        Schema::create('dossiers', function (Blueprint $table) {
            $table->id();
            $table->string('nom_dossier', 100);
            $table->date('date_descente_debut');
            $table->date('date_descente_fin');
            $table->string('type_commune', 50);
            $table->string('commune', 100);
            $table->string('fokontany', 100);
            $table->string('circonscription', 100);
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            // Index pour performance
            $table->index('nom_dossier');
            $table->index('id_district');
            $table->index(['id_district', 'created_at']);
        });

        Schema::create('proprietes', function (Blueprint $table) {
            $table->id();
            $table->string('lot', 15);
            $table->string('propriete_mere', 50)->nullable();
            $table->string('titre_mere', 50)->nullable();
            $table->string('titre', 50)->nullable();
            $table->string('proprietaire', 100)->nullable();
            $table->unsignedBigInteger('contenance')->nullable();
            $table->string('charge', 255)->nullable();
            $table->text('situation')->nullable();
            $table->string('nature', 50);
            $table->string('type_operation', 50);
            $table->string('vocation', 50)->nullable();
            $table->string('numero_FN', 30)->nullable();
            $table->string('numero_requisition', 50)->nullable();
            $table->date('date_requisition')->nullable();
            $table->date('date_inscription')->nullable();
            $table->string('dep_vol', 50)->nullable();
            $table->boolean('status')->default(false);
            
            // ✅ CORRECTION 7: Ajout de is_archived manquant (CRITIQUE pour votre logique)
            $table->boolean('is_archived')->default(false);
            
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            // Index pour performance
            $table->index('lot');
            $table->index('id_dossier');
            $table->index(['id_dossier', 'is_archived']);
        });

        // ========================================
        // 4. DEMANDEURS ET RELATIONS
        // ========================================
        
        Schema::create('demandeurs', function (Blueprint $table) {
            $table->id();
            $table->string('titre_demandeur', 20);
            $table->string('nom_demandeur', 100);
            $table->string('prenom_demandeur', 100)->nullable();
            $table->date('date_naissance');
            $table->string('lieu_naissance', 100)->nullable();
            $table->string('sexe', 10)->nullable();
            $table->string('occupation', 100)->nullable();
            $table->text('nom_pere')->nullable();
            $table->text('nom_mere')->nullable();
            
            // ✅ CORRECTION 8: CIN unique mais nullable
            $table->string('cin', 15)->nullable()->unique();
            
            $table->date('date_delivrance')->nullable();
            $table->string('lieu_delivrance', 100)->nullable();
            $table->date('date_delivrance_duplicata')->nullable();
            $table->string('lieu_delivrance_duplicata', 100)->nullable();
            $table->string('domiciliation', 150)->nullable();
            $table->string('situation_familiale', 50)->nullable();
            $table->string('regime_matrimoniale', 50)->nullable();
            $table->string('nationalite', 50)->default('Malagasy');
            $table->string('telephone', 15)->nullable();
            $table->date('date_mariage')->nullable();
            $table->string('lieu_mariage', 100)->nullable();
            $table->text('marie_a')->nullable();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            // Index pour performance
            $table->index('cin');
            $table->index('nom_demandeur');
        });

        Schema::create('consorts', function (Blueprint $table) {
            $table->id();
            $table->boolean('status')->default(true);
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_consort')->constrained('demandeurs')->onDelete('cascade');
            $table->timestamps();
            
            // ✅ CORRECTION 9: Contrainte unique pour éviter les doublons
            $table->unique(['id_demandeur', 'id_consort']);
        });

        Schema::create('demander', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('status', 20)->default('active');
            $table->boolean('status_consort')->default(false);
            $table->text('motif_archive')->nullable();
            $table->unsignedBigInteger('total_prix')->default(0);
            $table->timestamps();
            
            // ✅ CORRECTION 10: Contrainte unique pour éviter doublons
            $table->unique(['id_demandeur', 'id_propriete']);
            
            // Index pour performance
            $table->index('status');
            $table->index(['id_propriete', 'status']);
        });

        Schema::create('demande_consorts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demande')->constrained('demander')->onDelete('cascade');
            $table->foreignId('id_consort')->constrained('consorts')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_demande', 'id_consort']);
        });

        Schema::create('contenir', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->timestamps();
            
            // ✅ CORRECTION 11: Contrainte unique pour éviter doublons
            $table->unique(['id_dossier', 'id_demandeur']);
        });

        // ========================================
        // 5. ASSIGNATIONS UTILISATEURS
        // ========================================
        
        // ✅ CORRECTION 12: Cette table semble redondante avec id_district dans users
        // Je la garde mais elle pourrait être supprimée
        Schema::create('user_districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            $table->unsignedInteger('edilitaire')->nullable();
            $table->unsignedInteger('agricole')->nullable();
            $table->timestamps();
            
            $table->unique(['id_user', 'id_district']);
        });

        Schema::create('user_requisitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_user', 'id_propriete']);
        });

        Schema::create('user_demandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_demande')->constrained('demander')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_user', 'id_demande']);
        });

        Schema::create('user_csf', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_demande')->constrained('demander')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_user', 'id_demande']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Ordre inverse de création pour respecter les contraintes de clés étrangères
        
        // Assignations utilisateurs
        Schema::dropIfExists('user_csf');
        Schema::dropIfExists('user_demandes');
        Schema::dropIfExists('user_requisitions');
        Schema::dropIfExists('user_districts');
        
        // Relations demandeurs
        Schema::dropIfExists('contenir');
        Schema::dropIfExists('demande_consorts');
        Schema::dropIfExists('demander');
        Schema::dropIfExists('consorts');
        Schema::dropIfExists('demandeurs');
        
        // Dossiers et propriétés
        Schema::dropIfExists('proprietes');
        Schema::dropIfExists('dossiers');
        
        // Localisation
        Schema::dropIfExists('communes');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regions');
        Schema::dropIfExists('provinces');
        
        // Système et authentification
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('user_access_logs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};