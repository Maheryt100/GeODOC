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
        Schema::table('districts', function (Blueprint $table) {
            // Ajouter les 2 colonnes manquantes
            if (!Schema::hasColumn('districts', 'forestiere')) {
                $table->integer('forestiere')->nullable()->after('agricole');
            }
            if (!Schema::hasColumn('districts', 'touristique')) {
                $table->integer('touristique')->nullable()->after('forestiere');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('districts', function (Blueprint $table) {
            if (Schema::hasColumn('districts', 'forestiere')) {
                $table->dropColumn('forestiere');
            }
            if (Schema::hasColumn('districts', 'touristique')) {
                $table->dropColumn('touristique');
            }
        });
    }
};