<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ⚠️ D'abord, suppression de la contrainte existante si elle existe
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS type_operation_check');

        // Ensuite, modification de la colonne type_operation
        Schema::table('proprietes', function (Blueprint $table) {
            $table->string('type_operation', 30)->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        // On peut restaurer la version précédente (avec valeur par défaut et contrainte)
        Schema::table('proprietes', function (Blueprint $table) {
            $table->string('type_operation', 30)->default('immatriculation')->nullable(false)->change();
        });

        DB::statement("
            ALTER TABLE proprietes
            ADD CONSTRAINT type_operation_check
            CHECK (type_operation IN ('morcellement', 'immatriculation'))
        ");
    }
};
