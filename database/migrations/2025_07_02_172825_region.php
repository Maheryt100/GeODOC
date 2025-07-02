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
        Schema::create('region', function (Blueprint $table) {
            $table->id();
            $table->string('nom_region');
            $table->unsignedInteger('id_province');
            $table->foreign('id_province')->references('id')->on('province')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('region', function (Blueprint $table) {
            $table->dropForeign(['id_province']);
        });
        Schema::dropIfExists('region');
    }
};
