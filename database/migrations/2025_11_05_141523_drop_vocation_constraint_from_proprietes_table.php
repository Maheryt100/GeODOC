<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Supprime les contraintes CHECK existantes si elles sont présentes
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS vocation_check');
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS type_operation_check');
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS proprietes_vocation_check');
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS proprietes_type_operation_check');
        DB::statement('ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS charge_enum');
    }

    public function down(): void
    {
        // Si jamais tu veux les recréer dans le rollback
        DB::statement("
            ALTER TABLE proprietes
            ADD CONSTRAINT vocation_check
            CHECK (vocation IN ('Agricole', 'Forestiere', 'Touristique', 'Edilitaire'))
        ");

        DB::statement("
            ALTER TABLE proprietes
            ADD CONSTRAINT type_operation_check
            CHECK (type_operation IN ('morcellement', 'immatriculation'))
        ");
    }
};
