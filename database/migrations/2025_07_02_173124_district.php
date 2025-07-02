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
        Schema::create('district', function (Blueprint $table) {
            $table->id();
            $table->string('nom_district');
            $table->integer('edilitaire');
            $table->integer('agricole');
            $table->unsignedInteger('region_id');
            $table->foreign('region_id')->references('id')->on('region')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
 * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('district', function (Blueprint $table) {
            $table->dropForeign(['region_id']);
        });
        Schema::dropIfExists('district');
    }
};
