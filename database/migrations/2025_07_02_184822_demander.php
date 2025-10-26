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
            $table->unsignedInteger('id_user');
            $table->string('status',15)->default('active');
            $table->boolean('status_consort');
            $table->string('motif_archive')->nullable();
            $table->unsignedInteger('total_prix');
            $table->foreign('id_demandeur')->references('id')->on('demandeurs')->onDelete('cascade');
            $table->foreign('id_propriete')->references('id')->on('proprietes')->onDelete('cascade');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade');
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
            $table->dropForeign(['id_user']);
        });
        Schema::dropIfExists('demander');
    }
};
