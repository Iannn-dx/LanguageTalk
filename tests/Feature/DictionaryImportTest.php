<?php

namespace Tests\Feature;

use App\Jobs\ParseDictionaryPdfJob;
use App\Models\Admin\DictionaryEntity;
use App\Models\Admin\DictionaryImport;
use App\Models\Admin\DictionaryImportRow;
use App\Models\Admin\Language;
use App\Models\Admin\Source;
use App\Models\User;
use App\Services\Dictionary\PdfImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DictionaryImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->post(route('dictionary.imports.store'))->assertRedirect('/login');
    }

    public function test_non_admin_users_cannot_upload_dictionaries(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('dictionary.imports.store'), [], ['Accept' => 'application/json'])
            ->assertForbidden();
    }

    public function test_admins_can_upload_a_pdf_and_queue_parsing(): void
    {
        Queue::fake();
        Storage::fake('local');

        $language = Language::factory()->create();
        $file = $this->fixtureUpload();

        $response = $this->actingAs($this->admin())
            ->post(route('dictionary.imports.store'), [
                'language_id' => $language->id,
                'file' => $file,
            ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('import.status', DictionaryImport::STATUS_UPLOADED)
            ->assertJsonPath('import.language.id', $language->id)
            ->assertJsonPath('import.total_rows', 0);

        $import = DictionaryImport::query()->firstOrFail();

        $this->assertSame('tiny-dictionary.pdf', $import->original_name);
        $this->assertSame('local', $import->disk);
        $this->assertNotNull($import->path);
        Storage::disk('local')->assertExists($import->path);

        Queue::assertPushed(
            ParseDictionaryPdfJob::class,
            fn (ParseDictionaryPdfJob $job) => $job->importId === $import->id
        );
    }

    public function test_upload_requires_an_existing_language(): void
    {
        Storage::fake('local');

        $this->actingAs($this->admin())
            ->post(route('dictionary.imports.store'), [
                'language_id' => 9999,
                'file' => $this->fixtureUpload(),
            ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('language_id');

        $this->assertDatabaseCount('dictionary_imports', 0);
    }

    public function test_upload_rejects_non_pdf_files(): void
    {
        Storage::fake('local');

        $this->actingAs($this->admin())
            ->post(route('dictionary.imports.store'), [
                'language_id' => Language::factory()->create()->id,
                'file' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
            ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        $this->assertDatabaseCount('dictionary_imports', 0);
    }

    public function test_upload_rejects_a_pdf_mime_without_a_pdf_header(): void
    {
        Storage::fake('local');

        $this->actingAs($this->admin())
            ->post(route('dictionary.imports.store'), [
                'language_id' => Language::factory()->create()->id,
                'file' => UploadedFile::fake()->create('fake.pdf', 10, 'application/pdf'),
            ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_job_stages_rows_and_creates_a_source(): void
    {
        Storage::fake('local');

        $import = $this->readyToParseImport();
        $this->runParse($import);

        $import->refresh();

        $this->assertSame(DictionaryImport::STATUS_READY, $import->status);
        $this->assertSame(1, $import->pages);
        $this->assertSame(5, $import->total_rows);
        $this->assertSame('ibanag-v1', $import->parser);
        $this->assertNotNull($import->finished_at);
        $this->assertNull($import->error_message);

        $this->assertDatabaseCount('dictionary_import_rows', 5);
        $this->assertDatabaseHas('dictionary_import_rows', [
            'import_id' => $import->id,
            'row_number' => 1,
            'headword' => 'ababba',
            'word_folded' => 'ababba',
            'part_of_speech' => 'adj',
            'raw_part_of_speech' => 'adj.',
            'status' => DictionaryImportRow::STATUS_PENDING,
        ]);

        $source = Source::query()->firstOrFail();

        $this->assertSame('tiny dictionary', $source->title);
        $this->assertSame((int) $source->id, (int) $import->options['source_id']);
    }

    public function test_show_returns_the_preview_counts_and_duplicate_total(): void
    {
        Storage::fake('local');

        $import = $this->readyToParseImport();
        $this->runParse($import);

        DictionaryEntity::query()->create([
            'language_id' => $import->language_id,
            'word' => 'abaka',
            'word_folded' => 'abaka',
            'definition' => 'already here',
            'part_of_speech' => 'n',
        ]);

        $response = $this->actingAs($this->admin())
            ->getJson(route('dictionary.imports.show', $import));

        $response->assertOk()
            ->assertJsonPath('import.status', DictionaryImport::STATUS_READY)
            ->assertJsonPath('import.total_rows', 5)
            ->assertJsonPath('preview.duplicate_count', 1)
            ->assertJsonCount(5, 'preview.sample')
            ->assertJsonPath('import.source.title', 'tiny dictionary');

        $this->assertSame(
            1,
            collect($response->json('preview.pos_breakdown'))
                ->firstWhere('part_of_speech', 'adj')['count']
        );
    }

    public function test_confirm_imports_new_rows_skips_duplicates_and_links_the_source(): void
    {
        Storage::fake('local');

        $import = $this->readyToParseImport();
        $this->runParse($import);

        $existing = DictionaryEntity::query()->create([
            'language_id' => $import->language_id,
            'word' => 'abaka',
            'word_folded' => 'abaka',
            'definition' => 'kept definition',
            'part_of_speech' => 'n',
        ]);

        $sourceId = (int) $import->refresh()->options['source_id'];
        $path = $import->path;

        $response = $this->actingAs($this->admin())
            ->postJson(route('dictionary.imports.confirm', $import));

        $response->assertOk()
            ->assertJsonPath('imported', 4)
            ->assertJsonPath('skipped', 1)
            ->assertJsonPath('import.status', DictionaryImport::STATUS_COMPLETED);

        $import->refresh();

        $this->assertSame(4, $import->imported_rows);
        $this->assertSame(1, $import->skipped_rows);
        $this->assertNull($import->path);
        Storage::disk('local')->assertMissing($path);

        $this->assertDatabaseCount('dictionary_entities', 5);
        $this->assertDatabaseHas('dictionary_entities', [
            'word_folded' => 'ababba',
            'import_id' => $import->id,
        ]);
        $this->assertDatabaseHas('dictionary_entities', [
            'id' => $existing->id,
            'import_id' => null,
            'definition' => 'kept definition',
        ]);

        $this->assertSame(4, DB::table('entry_sources')->where('source_id', $sourceId)->count());
        $this->assertSame(4, DictionaryImportRow::query()->where('status', 'imported')->count());
        $this->assertSame(1, DictionaryImportRow::query()->where('status', 'skipped')->count());

        $this->actingAs($this->admin())
            ->postJson(route('dictionary.imports.confirm', $import))
            ->assertUnprocessable();
    }

    public function test_destroy_discards_the_import_rows_and_pdf(): void
    {
        Storage::fake('local');

        $import = $this->readyToParseImport();
        $this->runParse($import);

        $path = $import->refresh()->path;

        $this->actingAs($this->admin())
            ->deleteJson(route('dictionary.imports.destroy', $import))
            ->assertOk();

        $this->assertDatabaseMissing('dictionary_imports', ['id' => $import->id]);
        $this->assertDatabaseCount('dictionary_import_rows', 0);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_processing_imports_cannot_be_discarded(): void
    {
        Storage::fake('local');

        $import = $this->readyToParseImport();
        $import->forceFill(['status' => DictionaryImport::STATUS_PROCESSING])->save();

        $this->actingAs($this->admin())
            ->deleteJson(route('dictionary.imports.destroy', $import))
            ->assertUnprocessable();

        $this->assertDatabaseHas('dictionary_imports', ['id' => $import->id]);
    }

    public function test_confirm_skips_rows_repeated_within_the_same_import(): void
    {
        Storage::fake('local');

        $import = $this->readyToParseImport();
        $this->runParse($import);

        DictionaryImportRow::query()->create([
            'import_id' => $import->id,
            'row_number' => 6,
            'page' => 1,
            'headword' => 'abaka',
            'word_folded' => 'abaka',
            'part_of_speech' => 'n',
            'raw_part_of_speech' => 'n',
            'definition' => 'a repeated entry.',
            'status' => DictionaryImportRow::STATUS_PENDING,
        ]);

        $this->actingAs($this->admin())
            ->postJson(route('dictionary.imports.confirm', $import))
            ->assertOk()
            ->assertJsonPath('imported', 5)
            ->assertJsonPath('skipped', 1);

        $this->assertDatabaseCount('dictionary_entities', 5);
        $this->assertSame(
            1,
            DictionaryImportRow::query()
                ->where('status', DictionaryImportRow::STATUS_SKIPPED)
                ->where('message', 'Duplicate entry within this import.')
                ->count()
        );
    }

    public function test_job_marks_the_import_failed_and_keeps_the_pdf_when_parsing_fails(): void
    {
        Storage::fake('local');

        $import = $this->readyToParseImport();
        Storage::disk('local')->put($import->path, 'not a real pdf');

        try {
            $this->runParse($import);
            $this->fail('The parse job should have thrown for an invalid PDF.');
        } catch (\RuntimeException) {
            // Expected: the job records the failure and rethrows for the queue.
        }

        $import->refresh();

        $this->assertSame(DictionaryImport::STATUS_FAILED, $import->status);
        $this->assertNotNull($import->error_message);
        $this->assertNotNull($import->path);
        Storage::disk('local')->assertExists($import->path);
        $this->assertDatabaseCount('dictionary_import_rows', 0);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function fixtureUpload(): UploadedFile
    {
        return new UploadedFile(
            base_path('tests/Fixtures/tiny-dictionary.pdf'),
            'tiny-dictionary.pdf',
            'application/pdf',
            null,
            true
        );
    }

    private function readyToParseImport(): DictionaryImport
    {
        $language = Language::factory()->create();
        $path = 'imports/test-'.uniqid().'/source.pdf';

        Storage::disk('local')->put(
            $path,
            file_get_contents(base_path('tests/Fixtures/tiny-dictionary.pdf'))
        );

        return DictionaryImport::query()->create([
            'user_id' => $this->admin()->id,
            'language_id' => $language->id,
            'original_name' => 'tiny-dictionary.pdf',
            'disk' => 'local',
            'path' => $path,
            'mime_type' => 'application/pdf',
            'size' => 844,
            'status' => DictionaryImport::STATUS_UPLOADED,
        ]);
    }

    private function runParse(DictionaryImport $import): void
    {
        (new ParseDictionaryPdfJob($import->id))->handle(app(PdfImportService::class));
    }
}
