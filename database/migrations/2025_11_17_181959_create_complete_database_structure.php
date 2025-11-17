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
            
            // Prix par type de vocation (en Ariary)
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
            $table->string('role', 50)->default('user');
            
            $table->foreignId('id_district')
                ->nullable()
                ->constrained('districts')
                ->onDelete('set null');
            
            $table->boolean('status')->default(true);
            $table->rememberToken();
            $table->timestamps();
            
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

        Schema::create('user_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            $table->string('action', 50);
            $table->string('resource_type', 50);
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            $table->index(['id_user', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index('created_at');
        });

        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('permission', 100);
            $table->boolean('granted')->default(true);
            $table->timestamps();
            
            $table->unique(['id_user', 'permission']);
            $table->index(['id_user', 'granted']);
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('action', 50);
            $table->string('entity_type', 50);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('document_type', 50)->nullable();
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            $table->index(['id_user', 'action', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['id_district', 'created_at']);
            $table->index('action');
            $table->index('created_at');
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
            
            // Gestion de l'ouverture/fermeture du dossier
            $table->date('date_ouverture')->nullable();
            $table->date('date_fermeture')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('motif_fermeture')->nullable();
            
            $table->timestamps();
            
            $table->index('nom_dossier');
            $table->index('id_district');
            $table->index(['id_district', 'created_at']);
            $table->index('date_fermeture');
            $table->index(['id_district', 'date_fermeture']);
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
            $table->boolean('is_archived')->default(false);
            
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
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
            
            $table->index('cin');
            $table->index('nom_demandeur');
        });

        Schema::create('consorts', function (Blueprint $table) {
            $table->id();
            $table->boolean('status')->default(true);
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_consort')->constrained('demandeurs')->onDelete('cascade');
            $table->timestamps();
            
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
            
            $table->unique(['id_demandeur', 'id_propriete']);
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
            
            $table->unique(['id_dossier', 'id_demandeur']);
        });

        // ========================================
        // 5. PAIEMENTS
        // ========================================
        
        Schema::create('recu_paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('numero_recu')->unique();
            $table->bigInteger('montant');
            $table->date('date_recu');
            $table->string('file_path')->nullable();
            $table->enum('status', ['draft', 'confirmed'])->default('draft');
            $table->timestamps();
            
            $table->index(['id_propriete', 'status']);
            $table->index('date_recu');
        });

        // ========================================
        // 6. ASSIGNATIONS UTILISATEURS
        // ========================================
        
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
        
        // Paiements
        Schema::dropIfExists('recu_paiements');
        
        // Relations demandeurs
        Schema::dropIfExists('contenir');
        Schema::dropIfExists('demande_consorts');
        Schema::dropIfExists('demander');
        Schema::dropIfExists('consorts');
        Schema::dropIfExists('demandeurs');
        
        // Dossiers et propriétés
        Schema::dropIfExists('proprietes');
        Schema::dropIfExists('dossiers');
        
        // Logs et permissions
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('user_access_logs');
        
        // Système
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        
        // Utilisateurs
        Schema::dropIfExists('users');
        
        // Localisation
        Schema::dropIfExists('communes');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regions');
        Schema::dropIfExists('provinces');
    }
};