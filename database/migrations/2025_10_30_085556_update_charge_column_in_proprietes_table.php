<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proprietes', function (Blueprint $table) {
            
            $table->string('charge', 255)->nullable()->change();
            
        });
    }

    public function down(): void
    {
        Schema::table('proprietes', function (Blueprint $table) {
            $table->string('charge', 40)->nullable()->change();
        });
    }
};