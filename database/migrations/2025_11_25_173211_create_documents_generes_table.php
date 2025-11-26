<?php
// this is the table documents
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Nouvelle table pour tracer TOUS les documents générés
     */
    public function up(): void
    {
        Schema::create('documents_generes', function (Blueprint $table) {
            $table->id();
            
            // Type de document
            $table->enum('type_document', ['RECU', 'ADV', 'CSF', 'REQ'])->index();
            
            // Références aux entités
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->foreignId('id_demandeur')->nullable()->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            
            // Informations du document
            $table->string('numero_document', 100)->nullable(); // Numéro reçu, etc.
            $table->string('file_path', 500);
            $table->string('nom_fichier', 255);
            $table->bigInteger('montant')->nullable(); // Pour les reçus
            $table->date('date_document')->nullable();
            
            // Métadonnées
            $table->boolean('has_consorts')->default(false);
            $table->json('demandeurs_ids')->nullable(); // Liste des IDs demandeurs (pour ADV avec consorts)
            $table->json('metadata')->nullable(); // Autres infos
            
            // Tracking
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('generated_at');
            $table->integer('download_count')->default(0);
            $table->timestamp('last_downloaded_at')->nullable();
            
            // Status
            $table->enum('status', ['active', 'archived', 'obsolete'])->default('active');
            
            $table->timestamps();
            
            // Index optimisés pour recherche rapide
            $table->index(['type_document', 'id_propriete', 'status']);
            $table->index(['type_document', 'id_propriete', 'id_demandeur', 'status']);
            $table->index(['id_dossier', 'type_document']);
            $table->index(['generated_at']);
            $table->unique(['type_document', 'id_propriete', 'id_demandeur'], 'unique_document');
        });

        // Ajouter un index sur recu_paiements pour compatibilité
        Schema::table('recu_paiements', function (Blueprint $table) {
            $table->index(['id_propriete', 'id_demandeur', 'status'], 'idx_recu_lookup');
        });
    }

    public function down(): void
    {
        Schema::table('recu_paiements', function (Blueprint $table) {
            $table->dropIndex('idx_recu_lookup');
        });
        
        Schema::dropIfExists('documents_generes');
    }
};