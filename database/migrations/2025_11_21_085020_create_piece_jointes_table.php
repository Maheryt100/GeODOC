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
            $table->morphs('attachable'); // Crée attachable_id et attachable_type
            
            // Informations du fichier
            $table->string('nom_original');
            $table->string('nom_fichier'); // Nom stocké (unique)
            $table->string('chemin');
            $table->string('type_mime', 100);
            $table->unsignedBigInteger('taille'); // En octets
            $table->string('extension', 10);
            
            // Catégorisation
            $table->string('type_document', 50)->nullable(); // CIN, Acte, etc.
            $table->text('description')->nullable();
            
            // Métadonnées
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            
            // Statut
            $table->boolean('is_verified')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes(); // Pour la corbeille
            
            // Index pour performance
            
            $table->index(['id_user', 'created_at']);
            $table->index('type_document');
            $table->index(['id_district', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pieces_jointes');
    }
};