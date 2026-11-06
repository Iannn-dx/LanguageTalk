<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->correctDictionaryEntities();
        $this->correctTranslations();
        $this->correctExamples();
        $this->correctWordVariants();
        $this->correctEntryLocations();
        $this->correctEntrySources();
        $this->correctFeedbacks();
        $this->correctLocations();
        $this->correctSources();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->revertSources();
        $this->revertLocations();
        $this->revertFeedbacks();
        $this->revertEntrySources();
        $this->revertEntryLocations();
        $this->revertWordVariants();
        $this->revertExamples();
        $this->revertTranslations();
        $this->revertDictionaryEntities();
    }

    private function correctDictionaryEntities(): void
    {
        Schema::table('dictionary_entities', function (Blueprint $table) {
            $table->string('word_folded')->nullable()->after('word');
            $table->unsignedSmallInteger('source_page')->nullable()->after('part_of_speech');
            $table->foreignId('import_id')->nullable()->after('source_page');
        });

        Schema::table('dictionary_entities', function (Blueprint $table) {
            $table->foreign('import_id')
                ->references('id')
                ->on('dictionary_imports')
                ->nullOnDelete();
        });

        Schema::table('dictionary_entities', function (Blueprint $table) {
            $table->text('definition')->change();
        });

        DB::table('dictionary_entities')
            ->whereNull('word_folded')
            ->update(['word_folded' => DB::raw('lower(word)')]);

        Schema::table('dictionary_entities', function (Blueprint $table) {
            $table->unique(
                ['language_id', 'word_folded', 'part_of_speech'],
                'dictionary_entities_language_word_pos_unique'
            );
            $table->index(
                ['language_id', 'word_folded'],
                'dictionary_entities_language_word_folded_index'
            );
            $table->index('import_id', 'dictionary_entities_import_id_index');
        });
    }

    private function revertDictionaryEntities(): void
    {
        Schema::table('dictionary_entities', function (Blueprint $table) {
            $table->dropUnique('dictionary_entities_language_word_pos_unique');
            $table->dropIndex('dictionary_entities_language_word_folded_index');
            $table->dropIndex('dictionary_entities_import_id_index');
            $table->dropForeign(['import_id']);
        });

        Schema::table('dictionary_entities', function (Blueprint $table) {
            $table->string('definition')->change();
        });

        Schema::table('dictionary_entities', function (Blueprint $table) {
            $table->dropColumn(['word_folded', 'source_page', 'import_id']);
        });
    }

    private function correctTranslations(): void
    {
        Schema::table('translations', function (Blueprint $table) {
            $table->dropForeign(['target_source_id']);
        });

        Schema::table('translations', function (Blueprint $table) {
            $table->renameColumn('target_source_id', 'target_language_id');
        });

        Schema::table('translations', function (Blueprint $table) {
            $table->text('translated_text')->change();
        });

        Schema::table('translations', function (Blueprint $table) {
            $table->foreign('target_language_id')
                ->references('id')
                ->on('languages')
                ->cascadeOnDelete();
            $table->index('entry_id', 'translations_entry_id_index');
            $table->index('source_language_id', 'translations_source_language_id_index');
            $table->index('target_language_id', 'translations_target_language_id_index');
        });
    }

    private function revertTranslations(): void
    {
        Schema::table('translations', function (Blueprint $table) {
            $table->dropIndex('translations_entry_id_index');
            $table->dropIndex('translations_source_language_id_index');
            $table->dropIndex('translations_target_language_id_index');
            $table->dropForeign(['target_language_id']);
        });

        Schema::table('translations', function (Blueprint $table) {
            $table->string('translated_text')->change();
        });

        Schema::table('translations', function (Blueprint $table) {
            $table->renameColumn('target_language_id', 'target_source_id');
        });

        Schema::table('translations', function (Blueprint $table) {
            $table->foreign('target_source_id')
                ->references('id')
                ->on('languages')
                ->cascadeOnDelete();
        });
    }

    private function correctExamples(): void
    {
        Schema::table('examples', function (Blueprint $table) {
            $table->text('sentence')->change();
            $table->text('translated_text')->change();
            $table->text('explanation')->change();
        });

        Schema::table('examples', function (Blueprint $table) {
            $table->index('entry_id', 'examples_entry_id_index');
            $table->index('language_id', 'examples_language_id_index');
        });
    }

    private function revertExamples(): void
    {
        Schema::table('examples', function (Blueprint $table) {
            $table->dropIndex('examples_entry_id_index');
            $table->dropIndex('examples_language_id_index');
        });

        Schema::table('examples', function (Blueprint $table) {
            $table->string('sentence')->change();
            $table->string('translated_text')->change();
            $table->string('explanation')->change();
        });
    }

    private function correctWordVariants(): void
    {
        Schema::table('word_variants', function (Blueprint $table) {
            $table->text('description')->change();
            $table->index('entry_id', 'word_variants_entry_id_index');
        });
    }

    private function revertWordVariants(): void
    {
        Schema::table('word_variants', function (Blueprint $table) {
            $table->dropIndex('word_variants_entry_id_index');
            $table->string('description')->change();
        });
    }

    private function correctEntryLocations(): void
    {
        Schema::table('entry_locations', function (Blueprint $table) {
            $table->unique(
                ['entry_id', 'location_id'],
                'entry_locations_entry_id_location_id_unique'
            );
            $table->index('location_id', 'entry_locations_location_id_index');
        });
    }

    private function revertEntryLocations(): void
    {
        Schema::table('entry_locations', function (Blueprint $table) {
            $table->dropUnique('entry_locations_entry_id_location_id_unique');
            $table->dropIndex('entry_locations_location_id_index');
        });
    }

    private function correctEntrySources(): void
    {
        Schema::table('entry_sources', function (Blueprint $table) {
            $table->dropForeign(['source_id']);
        });

        Schema::table('entry_sources', function (Blueprint $table) {
            $table->foreign('source_id')
                ->references('id')
                ->on('sources')
                ->cascadeOnDelete();
            $table->unique(
                ['entry_id', 'source_id'],
                'entry_sources_entry_id_source_id_unique'
            );
            $table->index('source_id', 'entry_sources_source_id_index');
        });
    }

    private function revertEntrySources(): void
    {
        Schema::table('entry_sources', function (Blueprint $table) {
            $table->dropUnique('entry_sources_entry_id_source_id_unique');
            $table->dropIndex('entry_sources_source_id_index');
            $table->dropForeign(['source_id']);
        });

        Schema::table('entry_sources', function (Blueprint $table) {
            $table->foreign('source_id')
                ->references('id')
                ->on('languages')
                ->cascadeOnDelete();
        });
    }

    private function correctFeedbacks(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->text('comments')->change();
            $table->text('suggested_corrections')->change();
        });

        Schema::table('feedbacks', function (Blueprint $table) {
            $table->index('user_id', 'feedbacks_user_id_index');
            $table->index('translation_id', 'feedbacks_translation_id_index');
        });
    }

    private function revertFeedbacks(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropIndex('feedbacks_user_id_index');
            $table->dropIndex('feedbacks_translation_id_index');
        });

        Schema::table('feedbacks', function (Blueprint $table) {
            $table->string('comments')->change();
            $table->string('suggested_corrections')->change();
        });
    }

    private function correctLocations(): void
    {
        if ($this->isPostgres()) {
            DB::statement('ALTER TABLE locations ALTER COLUMN latitude TYPE numeric(10,7) USING latitude::numeric(10,7)');
            DB::statement('ALTER TABLE locations ALTER COLUMN longitude TYPE numeric(10,7) USING longitude::numeric(10,7)');

            return;
        }

        Schema::table('locations', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->change();
            $table->decimal('longitude', 10, 7)->change();
        });
    }

    private function revertLocations(): void
    {
        if ($this->isPostgres()) {
            DB::statement('ALTER TABLE locations ALTER COLUMN latitude TYPE varchar(255) USING latitude::text');
            DB::statement('ALTER TABLE locations ALTER COLUMN longitude TYPE varchar(255) USING longitude::text');

            return;
        }

        Schema::table('locations', function (Blueprint $table) {
            $table->string('latitude')->change();
            $table->string('longitude')->change();
        });
    }

    private function correctSources(): void
    {
        if ($this->isPostgres()) {
            DB::statement("ALTER TABLE sources ALTER COLUMN publication_year TYPE smallint USING COALESCE(NULLIF(trim(publication_year), ''), '0')::smallint");

            return;
        }

        Schema::table('sources', function (Blueprint $table) {
            $table->smallInteger('publication_year')->change();
        });
    }

    private function revertSources(): void
    {
        if ($this->isPostgres()) {
            DB::statement('ALTER TABLE sources ALTER COLUMN publication_year TYPE varchar(255) USING publication_year::text');

            return;
        }

        Schema::table('sources', function (Blueprint $table) {
            $table->string('publication_year')->change();
        });
    }

    private function isPostgres(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql';
    }
};
