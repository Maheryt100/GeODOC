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
        // Ajout du numéro d'ouverture dans les dossiers
        Schema::table('dossiers', function (Blueprint $table) {
            // Numéro d'ouverture unique par district
            $table->string('numero_ouverture', 50)->nullable()->after('nom_dossier');
            
            // Index pour recherche rapide
            $table->index('numero_ouverture');
            $table->index(['id_district', 'numero_ouverture']);
        });

        // Ajout du numéro dep/vol dans les propriétés
        Schema::table('proprietes', function (Blueprint $table) {
            // Numéro qui suit le dep_vol
            $table->string('numero_dep_vol', 50)->nullable()->after('dep_vol');
            
            // Index pour recherche
            $table->index('numero_dep_vol');
            $table->index(['dep_vol', 'numero_dep_vol']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropIndex(['id_district', 'numero_ouverture']);
            $table->dropIndex(['numero_ouverture']);
            $table->dropColumn('numero_ouverture');
        });

        Schema::table('proprietes', function (Blueprint $table) {
            $table->dropIndex(['dep_vol', 'numero_dep_vol']);
            $table->dropIndex(['numero_dep_vol']);
            $table->dropColumn('numero_dep_vol');
        });
    }
};