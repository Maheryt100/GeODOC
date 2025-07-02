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
        Schema::create('demander', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('id_demandeur');
            $table->unsignedInteger('id_propriete');
            $table->unsignedInteger('total_prix');
            $table->foreign('id_demandeur')->references('id')->on('demandeur')->onDelete('cascade');
            $table->foreign('id_propriete')->references('id')->on('propriete')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('demander', function (Blueprint $table) {
            $table->dropForeign(['id_demandeur']);
            $table->dropForeign(['id_propriete']);
        });
        Schema::dropIfExists('demander');
    }
};
