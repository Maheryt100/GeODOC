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
        Schema::create('dossiers', function (Blueprint $table) {
            $table->id();
            $table->string('nom_dossier',40);
            $table->date('date_descente_debut');
            $table->date('date_descente_fin');
            $table->string('type_commune',20);
            $table->string('commune',100);
            $table->string('fokontany',100);
            $table->string('type');
            $table->string('circonscription',50);
            $table->unsignedBigInteger('id_district');
            $table->unsignedInteger('id_user');
            $table->foreign('id_district')->references('id')->on('districts')->onDelete('cascade');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropForeign(['id_district']);
            $table->dropForeign(['id_user']);
        });

        Schema::dropIfExists('dossiers');
    }
};
