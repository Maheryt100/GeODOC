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
        Schema::create('piece_jointes', function (Blueprint $table) {
            $table->id();
            $table->string('document');
            $table->unsignedBigInteger('id_demandeur');
            $table->foreign('id_demandeur')->references('id')->on('demandeurs')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('piece_jointes', function (Blueprint $table) {
            $table->dropForeign(['id_demandeur']);
        });
        Schema::dropIfExists('piece_jointes');
    }
};
