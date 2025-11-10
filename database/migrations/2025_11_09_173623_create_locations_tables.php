<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('nom_province');
            $table->timestamps();
        });

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('nom_region');
            $table->foreignId('id_province')->constrained('provinces')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('nom_district');
            $table->integer('edilitaire')->default(0);
            $table->integer('agricole')->default(0);
            $table->integer('forestiere')->default(0);
            $table->integer('touristique')->default(0);
            $table->foreignId('id_region')->constrained('regions')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regions');
        Schema::dropIfExists('provinces');
    }
};