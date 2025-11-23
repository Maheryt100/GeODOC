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
        // Vérifier si la table existe déjà
        if (Schema::hasTable('pieces_jointes')) {
            // Ajouter les colonnes manquantes si nécessaire
            Schema::table('pieces_jointes', function (Blueprint $table) {
                if (!Schema::hasColumn('pieces_jointes', 'description')) {
                    $table->text('description')->nullable()->after('type_document');
                }
                if (!Schema::hasColumn('pieces_jointes', 'is_verified')) {
                    $table->boolean('is_verified')->default(false)->after('description');
                }
                if (!Schema::hasColumn('pieces_jointes', 'verified_by')) {
                    $table->unsignedBigInteger('verified_by')->nullable()->after('is_verified');
                }
                if (!Schema::hasColumn('pieces_jointes', 'verified_at')) {
                    $table->timestamp('verified_at')->nullable()->after('verified_by');
                }
                if (!Schema::hasColumn('pieces_jointes', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        } else {
            // Créer la table complète
            Schema::create('pieces_jointes', function (Blueprint $table) {
                $table->id();
                
                // Relations polymorphiques
                $table->string('attachable_type', 50);
                $table->unsignedBigInteger('attachable_id');
                $table->index(['attachable_type', 'attachable_id'], 'pieces_jointes_attachable_index');
                
                // Informations du fichier
                $table->string('nom_original');
                $table->string('nom_fichier')->unique();
                $table->string('chemin')->unique();
                $table->string('type_mime', 100);
                $table->bigInteger('taille')->unsigned();
                $table->string('extension', 10);
                
                // Catégorisation
                $table->enum('categorie', ['global', 'demandeur', 'propriete', 'administratif'])->default('global');
                $table->string('type_document', 50)->nullable();
                $table->text('description')->nullable();
                
                // Métadonnées
                $table->unsignedBigInteger('id_user')->nullable();
                $table->unsignedBigInteger('id_district')->nullable();
                
                // Vérification
                $table->boolean('is_verified')->default(false);
                $table->unsignedBigInteger('verified_by')->nullable();
                $table->timestamp('verified_at')->nullable();
                
                // Timestamps et soft deletes
                $table->timestamps();
                $table->softDeletes();
                
                // Foreign keys
                $table->foreign('id_user')->references('id')->on('users')->onDelete('set null');
                $table->foreign('id_district')->references('id')->on('districts')->onDelete('set null');
                $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
                
                // Index supplémentaires
                $table->index('categorie');
                $table->index('type_document');
                $table->index('id_district');
                $table->index('created_at');
                $table->index('is_verified');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pieces_jointes');
    }
};