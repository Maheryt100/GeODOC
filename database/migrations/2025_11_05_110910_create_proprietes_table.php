<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proprietes', function (Blueprint $table) {
            $table->id();
            $table->string('lot', 10);
            $table->string('propriete_mere', 20)->nullable();
            $table->string('titre_mere', 20)->nullable();
            $table->string('titre', 20)->nullable();
            $table->string('proprietaire', 50)->nullable();
            $table->unsignedBigInteger('contenance')->nullable();
            $table->string('charge', 255)->nullable();
            $table->string('situation')->nullable();
            $table->string('nature', 40);
            $table->string('type_operation', 30)->default('immatriculation');
            $table->string('vocation', 30)->nullable();
            $table->string('numero_FN', 10)->nullable();
            $table->string('numero_requisition', 30)->nullable();
            $table->date('date_requisition')->nullable();
            $table->date('date_inscription')->nullable();
            $table->string('dep_vol', 20)->nullable();
            $table->boolean('status')->default(false);
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

    
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS type_operation_check');
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS vocation_check');
        Schema::dropIfExists('proprietes');
    }
};