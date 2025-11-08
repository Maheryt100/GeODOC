<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('demandeurs', function (Blueprint $table) {
            // Si la colonne 'civilite' existe déjà
            if (Schema::hasColumn('demandeurs', 'civilite')) {
                $table->string('civilite', 20)->nullable(false)->change();
            }

            $table->string('titre_demandeur', 20)->nullable(false)->change();
            $table->string('nom_demandeur', 100)->nullable(false)->change();
            $table->string('prenom_demandeur', 100)->nullable(false)->change();
            $table->date('date_naissance')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('demandeurs', function (Blueprint $table) {
            if (Schema::hasColumn('demandeurs', 'civilite')) {
                $table->string('civilite', 20)->nullable()->change();
            }

            $table->string('titre_demandeur', 20)->nullable()->change();
            $table->string('nom_demandeur', 100)->nullable()->change();
            $table->string('prenom_demandeur', 100)->nullable()->change();
            $table->date('date_naissance')->nullable()->change();
        });
    }
};
