cc<?php

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
        Schema::create('proprietes', function (Blueprint $table) {
            $table->id();
            $table->string('lot',10);
            $table->string('propriete_mere',20)->nullable();
            $table->string('titre_mere',20)->nullable();
            $table->string('titre',20)->nullable();
            $table->string('proprietaire',50)->nullable();
            $table->unsignedBigInteger('contenance')->nullable();
            $table->string('charge',40)->nullable();
            $table->string('situation')->nullable();
            $table->string('nature',40);
            $table->string('numero_FN',10)->nullable();
            $table->string('numero_requisition',30)->nullable();
            $table->date('date_requisition')->nullable();
            $table->date('date_inscription')->nullable();
            $table->string('dep_vol',20)->nullable();
            $table->boolean('status')->default(false);
            $table->unsignedInteger('id_dossier');
            $table->unsignedInteger('id_user');
            $table->foreign('id_dossier')->references('id')->on('dossiers')->onDelete('cascade');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proprietes', function (Blueprint $table) {
            $table->dropForeign(['id_dossier']);
            $table->dropForeign(['id_user']);
        });
        Schema::dropIfExists('proprietes');
    }
};
