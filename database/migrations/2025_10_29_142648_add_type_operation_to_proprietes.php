<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Nettoyer les valeurs existantes
        DB::statement("UPDATE proprietes SET charge = NULL WHERE charge IS NOT NULL AND charge NOT IN ('Voie(s) publique(s)', 'Voie(s) d''accès', 'Servitude(s)')");

        // Modifier le type et ajouter la contrainte
        DB::statement("ALTER TABLE proprietes ALTER COLUMN charge TYPE VARCHAR(40)");
        DB::statement("ALTER TABLE proprietes ADD CONSTRAINT charge_enum CHECK (charge IN ('Voie(s) publique(s)', 'Voie(s) d''accès', 'Servitude(s)'))");

        // Ajouter type_operation
        Schema::table('proprietes', function (Blueprint $table) {
            $table->string('type_operation', 30)
                ->after('nature')
                ->default('immatriculation');
        });
        DB::statement("ALTER TABLE proprietes ADD CONSTRAINT type_operation_enum CHECK (type_operation IN ('morcellement', 'immatriculation'))");

        // Ajouter vocation
        if (!Schema::hasColumn('proprietes', 'vocation')) {
            Schema::table('proprietes', function (Blueprint $table) {
                $table->string('vocation', 30)->nullable()->after('nature');
            });
            DB::statement("ALTER TABLE proprietes ADD CONSTRAINT vocation_enum CHECK (vocation IN ('Editaire', 'Agricole', 'Forestière', 'Touristique'))");
        }

        // Supprimer type dans dossiers
        if (Schema::hasColumn('dossiers', 'type')) {
            Schema::table('dossiers', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS charge_enum");
        DB::statement("ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS type_operation_enum");
        DB::statement("ALTER TABLE proprietes DROP CONSTRAINT IF EXISTS vocation_enum");

        Schema::table('proprietes', function (Blueprint $table) {
            $table->dropColumn(['type_operation', 'vocation']);
            $table->string('charge', 40)->nullable()->change();
        });

        Schema::table('dossiers', function (Blueprint $table) {
            $table->string('type', 30)->nullable();
        });
    }
};