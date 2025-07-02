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
        Schema::create('proprietes', function (Blueprint $table) {
            $table->id();
            $table->string('lot',15);
            $table->string('propriete_mere',20)->nullable();
            $table->string('titre',20);
            $table->string('proprietaire',50);
            $table->unsignedBigInteger('contenance');
            $table->string('charge',40)->nullable();
            $table->string('situation');
            $table->string('circonscription','50')->nullable();
            $table->string('type',30);
            $table->string('nature',40);
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
        Schema::table('proprietes', function (Blueprint $table) {
            $table->dropForeign(['id_district']);
        });
        Schema::dropIfExists('proprietes');
    }
};
