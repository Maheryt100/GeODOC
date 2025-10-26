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
        Schema::create('contenir', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('id_dossier');
            $table->unsignedInteger('id_demandeur');
            $table->foreign('id_demandeur')->references('id')->on('demandeurs')->onDelete('cascade');
            $table->foreign('id_dossier')->references('id')->on('dossiers')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contenir', function (Blueprint $table) {
            $table->dropForeign(['id_dossier']);
            $table->dropForeign(['id_demandeur']);
        });
        Schema::dropIfExists('contenir');
    }
};
