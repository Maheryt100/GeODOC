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
        Schema::create('demandeurs', function (Blueprint $table) {
            $table->id();
            $table->string('titre_demandeur',20);
            $table->string('nom_demandeur',40);
            $table->string('prenom_demandeur')->nullable();
            $table->date('date_naissance');
            $table->string('lieu_naissance',100);
            $table->string('sexe',10);
            $table->string('occupation',30);
            $table->string('nom_pere')->nullable();
            $table->string('nom_mere');
            $table->string('cin');
            $table->date('date_delivrance');
            $table->string('lieu_delivrance',40);
            $table->date('date_delivrance_duplicata')->nullable();
            $table->string('lieu_delivrance_duplicata',40)->nullable();
            $table->string('domiciliation');
            $table->string('situation_familiale',40);
            $table->string('regime_matrimoniale',40);
            $table->string('telephone',10)->nullable();
            $table->date('date_mariage')->nullable();
            $table->string('lieu_mariage',40);
            $table->unsignedInteger('id_region');
            $table->foreign('id_region')->references('id')->on('regions')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('demandeurs', function (Blueprint $table) {
            $table->dropForeign(['id_region']);
        });
        Schema::dropIfExists('demandeurs');
    }
};
