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
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('nom_district');
            $table->integer('edilitaire')->nullable();
            $table->integer('agricole')->nullable();
            $table->unsignedInteger('id_region');
            $table->foreign('id_region')->references('id')->on('regions')->onDelete('cascade');
        });
    }

    /**
 * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('districts', function (Blueprint $table) {
            $table->dropForeign(['id_region']);
        });
        Schema::dropIfExists('districts');
    }
};
