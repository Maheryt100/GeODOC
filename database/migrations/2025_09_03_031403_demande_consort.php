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
        Schema::create('demande_consorts', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('id_demande');
            $table->unsignedInteger('id_consort');
            $table->foreign('id_consort')->references('id')->on('consorts')->onDelete('cascade');
            $table->foreign('id_demande')->references('id')->on('demander')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('demande_consorts', function (Blueprint $table) {
            $table->dropForeign(['id_consort']);
            $table->dropForeign(['id_demande']);
        });
        Schema::dropIfExists('demande_consorts');
    }
};
