<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pieces_jointes', function (Blueprint $table) {
            $table->id();
            
            // Relations polymorphiques
            $table->string('attachable_type', 50);
            $table->unsignedBigInteger('attachable_id');
            
            // Informations du fichier
            $table->string('nom_original', 255);
            $table->string('nom_fichier', 255)->unique();
            $table->string('chemin', 500);
            $table->string('type_mime', 100);
            $table->unsignedBigInteger('taille');
            $table->string('extension', 10);
            
            // Catégorisation et métadonnées
            $table->string('categorie', 30)->default('global');
            $table->string('type_document', 50)->nullable();
            $table->text('description')->nullable();
            
            // Tracking utilisateur
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            
            // Statut de vérification
            $table->boolean('is_verified')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index optimisés
            $table->index(['attachable_type', 'attachable_id']);
            $table->index(['attachable_type', 'attachable_id', 'categorie']);
            $table->index(['id_user', 'created_at']);
            $table->index(['id_district', 'created_at']);
            $table->index('type_document');
            $table->index('categorie');
            $table->index('is_verified');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pieces_jointes');
    }
};