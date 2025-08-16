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
        Schema::create('consorts', function (Blueprint $table) {
            $table->id();
            $table->boolean('status')->default(true);
            $table->unsignedInteger('id_demandeur');
            $table->unsignedInteger('id_consort');
            $table->foreign('id_consort')->references('id')->on('demandeurs')->onDelete('cascade');
            $table->foreign('id_demandeur')->references('id')->on('demandeurs')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consorts', function (Blueprint $table) {
            $table->dropForeign(['id_demandeur']);
            $table->dropForeign(['id_consort']);
        });
        Schema::dropIfExists('consorts');
    }
};
