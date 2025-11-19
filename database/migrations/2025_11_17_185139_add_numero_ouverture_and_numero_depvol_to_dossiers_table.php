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
        // Vérifier si les colonnes existent déjà avant de les ajouter
        
        // Ajout du numéro d'ouverture dans les dossiers
        if (!Schema::hasColumn('dossiers', 'numero_ouverture')) {
            Schema::table('dossiers', function (Blueprint $table) {
                // Numéro d'ouverture unique par district
                $table->string('numero_ouverture', 50)->nullable()->after('nom_dossier');
                
                // Index pour recherche rapide
                $table->index('numero_ouverture');
                $table->index(['id_district', 'numero_ouverture']);
            });
        }

        // Ajout du numéro dep/vol dans les propriétés
        if (!Schema::hasColumn('proprietes', 'numero_dep_vol')) {
            Schema::table('proprietes', function (Blueprint $table) {
                // Numéro qui suit le dep_vol (ex: si dep_vol=299, numero=041)
                $table->string('numero_dep_vol', 50)->nullable()->after('dep_vol');
                
                // Index pour recherche
                $table->index('numero_dep_vol');
                $table->index(['dep_vol', 'numero_dep_vol']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            if (Schema::hasColumn('dossiers', 'numero_ouverture')) {
                $table->dropIndex(['id_district', 'numero_ouverture']);
                $table->dropIndex(['numero_ouverture']);
                $table->dropColumn('numero_ouverture');
            }
        });

        Schema::table('proprietes', function (Blueprint $table) {
            if (Schema::hasColumn('proprietes', 'numero_dep_vol')) {
                $table->dropIndex(['dep_vol', 'numero_dep_vol']);
                $table->dropIndex(['numero_dep_vol']);
                $table->dropColumn('numero_dep_vol');
            }
        });
    }
};