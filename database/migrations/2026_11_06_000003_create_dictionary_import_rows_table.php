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
        Schema::create('dictionary_import_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_id')
                ->constrained('dictionary_imports')
                ->cascadeOnDelete();

            $table->unsignedInteger('row_number');
            $table->unsignedSmallInteger('page')->nullable();
            $table->string('headword');
            $table->string('word_folded');
            $table->string('part_of_speech')->nullable();
            $table->string('raw_part_of_speech')->nullable();
            $table->text('definition')->nullable();
            $table->string('status')->default('pending');
            $table->text('message')->nullable();
            $table->timestamps();

            $table->unique(
                ['import_id', 'row_number'],
                'dictionary_import_rows_import_id_row_number_unique'
            );
            $table->index(
                ['import_id', 'status'],
                'dictionary_import_rows_import_id_status_index'
            );
            $table->index(
                ['import_id', 'word_folded'],
                'dictionary_import_rows_import_id_word_folded_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dictionary_import_rows');
    }
};
