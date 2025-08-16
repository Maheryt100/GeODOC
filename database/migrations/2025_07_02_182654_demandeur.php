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
            $table->string('nom_demandeur',100);
            $table->string('prenom_demandeur')->nullable();
            $table->date('date_naissance');
            $table->string('lieu_naissance',100);
            $table->string('sexe',10);
            $table->string('occupation',50);
            $table->string('nom_pere')->nullable();
            $table->string('nom_mere',100);
            $table->string('cin', 15)->unique();
            $table->date('date_delivrance');
            $table->string('lieu_delivrance',50);
            $table->date('date_delivrance_duplicata')->nullable();
            $table->string('lieu_delivrance_duplicata',50)->nullable();
            $table->string('domiciliation', 100);
            $table->string('situation_familiale',40);
            $table->string('regime_matrimoniale',40);
            $table->string('nationalite',50);
            $table->string('telephone',12)->nullable();
            $table->date('date_mariage')->nullable();
            $table->string('lieu_mariage',40)->nullable();
            $table->string('marie_a')->nullable();
            $table->unsignedInteger('id_district');
            $table->foreign('id_district')->references('id')->on('districts')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('demandeurs', function (Blueprint $table) {
            $table->dropForeign(['id_district']);
        });
        Schema::dropIfExists('demandeurs');
    }
};
