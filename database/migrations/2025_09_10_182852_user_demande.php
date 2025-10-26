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
        Schema::create('user_demandes', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('id_user');
            $table->unsignedInteger('id_demande');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_demande')->references('id')->on('demander')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_demandes', function (Blueprint $table) {
            $table->dropForeign(['id_user']);
            $table->dropForeign(['id_demande']);
        });
        Schema::dropIfExists('user_demandes');
    }
};
