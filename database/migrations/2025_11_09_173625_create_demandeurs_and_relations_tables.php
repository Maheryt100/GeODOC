<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandeurs', function (Blueprint $table) {
        $table->id();
        $table->string('titre_demandeur', 20);
        $table->string('nom_demandeur', 100);
        $table->string('prenom_demandeur', 100);
        $table->date('date_naissance');

        $table->string('lieu_naissance', 100)->nullable();
        $table->string('sexe', 10)->nullable();
        $table->string('occupation', 50)->nullable();
        $table->string('nom_pere')->nullable();
        $table->string('nom_mere', 100)->nullable();
        $table->string('cin', 15)->unique()->nullable();
        $table->date('date_delivrance')->nullable();
        $table->string('lieu_delivrance', 50)->nullable();
        $table->date('date_delivrance_duplicata')->nullable();
        $table->string('lieu_delivrance_duplicata', 50)->nullable();
        $table->string('domiciliation', 100)->nullable();
        $table->string('situation_familiale', 40)->nullable();
        $table->string('regime_matrimoniale', 40)->nullable();
        $table->string('nationalite', 50)->nullable();
        $table->string('telephone', 12)->nullable();
        $table->date('date_mariage')->nullable();
        $table->string('lieu_mariage', 40)->nullable();
        $table->string('marie_a')->nullable();

        $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
        $table->timestamps();

        });

        Schema::create('consorts', function (Blueprint $table) {
            $table->id();
            $table->boolean('status')->default(true);
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_consort')->constrained('demandeurs')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('demander', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('status', 15)->default('active');
            $table->boolean('status_consort');
            $table->string('motif_archive')->nullable();
            $table->unsignedInteger('total_prix');
            $table->timestamps();
        });

        Schema::create('demande_consorts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demande')->constrained('demander')->onDelete('cascade');
            $table->foreignId('id_consort')->constrained('consorts')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('contenir', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contenir');
        Schema::dropIfExists('demande_consorts');
        Schema::dropIfExists('demander');
        Schema::dropIfExists('consorts');
        Schema::dropIfExists('demandeurs');
    }
};