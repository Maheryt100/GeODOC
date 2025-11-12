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
        Schema::create('communes', function (Blueprint $table) {
            $table->id();
            $table->string('nom_commune');
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            $table->foreignId('id_region')->constrained('regions')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Run the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communes');
    }
};