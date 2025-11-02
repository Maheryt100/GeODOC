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
        // 1. Remplacer tous les NULL par 0
        DB::statement("UPDATE districts SET edilitaire = 0 WHERE edilitaire IS NULL");
        DB::statement("UPDATE districts SET agricole = 0 WHERE agricole IS NULL");
        DB::statement("UPDATE districts SET forestiere = 0 WHERE forestiere IS NULL");
        DB::statement("UPDATE districts SET touristique = 0 WHERE touristique IS NULL");
        
        // 2. Modifier les colonnes pour ne plus accepter NULL et avoir 0 par défaut
        Schema::table('districts', function (Blueprint $table) {
            $table->integer('edilitaire')->default(0)->change();
            $table->integer('agricole')->default(0)->change();
            $table->integer('forestiere')->default(0)->change();
            $table->integer('touristique')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('districts', function (Blueprint $table) {
            $table->integer('edilitaire')->nullable()->change();
            $table->integer('agricole')->nullable()->change();
            $table->integer('forestiere')->nullable()->change();
            $table->integer('touristique')->nullable()->change();
        });
    }
};