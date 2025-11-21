<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pieces_jointes', function (Blueprint $table) {
            // Catégorie pour faciliter le filtrage (global, demandeur, propriete)
            $table->string('categorie', 30)->default('global')->after('type_document');

            // Index composite
            $table->index(['attachable_type', 'attachable_id', 'categorie']);

            // Index simples nommés
            $table->index('categorie', 'idx_pieces_jointes_categorie');
            $table->index('type_document', 'idx_pieces_jointes_type_document');
            $table->index('created_at', 'idx_pieces_jointes_created_at');
        });
    }

    public function down(): void
    {
        Schema::table('pieces_jointes', function (Blueprint $table) {
            $table->dropIndex(['attachable_type', 'attachable_id', 'categorie']);
            $table->dropIndex('idx_pieces_jointes_categorie');
            $table->dropIndex('idx_pieces_jointes_type_document');
            $table->dropIndex('idx_pieces_jointes_created_at');
            $table->dropColumn('categorie');
        });
    }
};