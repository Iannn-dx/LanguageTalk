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
        Schema::table('dictionary_imports', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id');
            $table->foreignId('language_id')->nullable()->after('user_id');

            $table->string('original_name')->after('language_id');
            $table->string('disk')->default('local')->after('original_name');
            $table->string('path')->nullable()->after('disk');
            $table->string('mime_type')->nullable()->after('path');
            $table->unsignedBigInteger('size')->default(0)->after('mime_type');
            $table->string('status')->default('uploaded')->after('size');

            $table->unsignedInteger('pages')->nullable()->after('status');
            $table->unsignedInteger('total_rows')->default(0)->after('pages');
            $table->unsignedInteger('imported_rows')->default(0)->after('total_rows');
            $table->unsignedInteger('skipped_rows')->default(0)->after('imported_rows');
            $table->unsignedInteger('failed_rows')->default(0)->after('skipped_rows');

            $table->string('parser')->nullable()->after('failed_rows');
            $table->json('options')->nullable()->after('parser');
            $table->text('error_message')->nullable()->after('options');
            $table->timestamp('started_at')->nullable()->after('error_message');
            $table->timestamp('finished_at')->nullable()->after('started_at');
        });

        Schema::table('dictionary_imports', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
            $table->foreign('language_id')
                ->references('id')
                ->on('languages')
                ->nullOnDelete();

            $table->index('user_id', 'dictionary_imports_user_id_index');
            $table->index('language_id', 'dictionary_imports_language_id_index');
            $table->index('status', 'dictionary_imports_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dictionary_imports', function (Blueprint $table) {
            $table->dropIndex('dictionary_imports_user_id_index');
            $table->dropIndex('dictionary_imports_language_id_index');
            $table->dropIndex('dictionary_imports_status_index');
            $table->dropForeign(['user_id']);
            $table->dropForeign(['language_id']);
        });

        Schema::table('dictionary_imports', function (Blueprint $table) {
            $table->dropColumn([
                'user_id',
                'language_id',
                'original_name',
                'disk',
                'path',
                'mime_type',
                'size',
                'status',
                'pages',
                'total_rows',
                'imported_rows',
                'skipped_rows',
                'failed_rows',
                'parser',
                'options',
                'error_message',
                'started_at',
                'finished_at',
            ]);
        });
    }
};
