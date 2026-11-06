<?php

namespace App\Jobs;

use App\Models\Admin\DictionaryImport;
use App\Models\Admin\DictionaryImportRow;
use App\Models\Admin\Source;
use App\Services\Dictionary\PdfImportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ParseDictionaryPdfJob implements ShouldQueue
{
    use Queueable;

    /**
     * Parsing is intentionally single-attempt: a failed PDF needs a fresh
     * upload rather than a silent retry against the same file.
     */
    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(public readonly int $importId) {}

    public function handle(PdfImportService $service): void
    {
        $import = DictionaryImport::query()->find($this->importId);

        if ($import === null) {
            return;
        }

        $import->forceFill([
            'status' => DictionaryImport::STATUS_PROCESSING,
            'started_at' => now(),
            'finished_at' => null,
            'error_message' => null,
        ])->save();

        try {
            if ($import->path === null) {
                throw new \RuntimeException('The uploaded PDF could not be found.');
            }

            $path = Storage::disk($import->disk)->path($import->path);

            if (! is_file($path)) {
                throw new \RuntimeException('The uploaded PDF could not be found.');
            }

            $result = $service->parseFile($path);

            DB::transaction(function () use ($import, $result): void {
                $source = $this->resolveSource($import, $result['metadata']);

                DictionaryImportRow::query()
                    ->where('import_id', $import->id)
                    ->delete();

                $rowNumber = 0;
                $now = now();

                foreach (array_chunk($result['entries'], 500) as $chunk) {
                    $rows = [];

                    foreach ($chunk as $entry) {
                        $rowNumber++;

                        $rows[] = [
                            'import_id' => $import->id,
                            'row_number' => $rowNumber,
                            'page' => $entry['page'],
                            'headword' => mb_substr($entry['headword'], 0, 255),
                            'word_folded' => mb_substr($entry['word_folded'], 0, 255),
                            'part_of_speech' => mb_substr($entry['part_of_speech'], 0, 255),
                            'raw_part_of_speech' => mb_substr($entry['raw_part_of_speech'], 0, 255),
                            'definition' => str_replace("\0", '', $entry['definition']),
                            'status' => DictionaryImportRow::STATUS_PENDING,
                            'message' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    DB::table('dictionary_import_rows')->insert($rows);
                }

                $options = $import->options ?? [];
                $options['source_id'] = $source->id;

                $import->forceFill([
                    'status' => DictionaryImport::STATUS_READY,
                    'pages' => $result['pages'],
                    'total_rows' => count($result['entries']),
                    'parser' => $result['parser'],
                    'options' => $options,
                    'error_message' => null,
                    'finished_at' => now(),
                ])->save();
            });
        } catch (Throwable $e) {
            $import->forceFill([
                'status' => DictionaryImport::STATUS_FAILED,
                'error_message' => Str::limit($e->getMessage(), 2000, ''),
                'finished_at' => now(),
            ])->save();

            report($e);

            throw $e;
        }
    }

    public function failed(?Throwable $exception): void
    {
        DictionaryImport::query()
            ->whereKey($this->importId)
            ->update([
                'status' => DictionaryImport::STATUS_FAILED,
                'error_message' => Str::limit(
                    $exception?->getMessage() ?? 'The import job failed.',
                    2000,
                    ''
                ),
                'finished_at' => now(),
            ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function resolveSource(DictionaryImport $import, array $metadata): Source
    {
        $title = $this->metadataString($metadata, ['Title', 'title'])
            ?? $this->titleFromFilename($import->original_name);

        $author = $this->metadataString($metadata, ['Author', 'author']) ?? '';
        $publisher = $this->metadataString($metadata, ['Publisher', 'publisher']) ?? '';

        return Source::query()->firstOrCreate(
            [
                'title' => $title,
                'author' => $author,
                'publisher' => $publisher,
                'publication_year' => $this->publicationYear($metadata),
            ]
        );
    }

    private function titleFromFilename(string $originalName): string
    {
        $name = pathinfo($originalName, PATHINFO_FILENAME);
        $name = $name !== '' ? $name : $originalName;
        $name = preg_replace('/[_-]+/', ' ', $name) ?? $name;
        $name = trim(preg_replace('/\s+/', ' ', $name) ?? $name);

        return $name !== '' ? $name : 'Untitled dictionary';
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @param  list<string>  $keys
     */
    private function metadataString(array $metadata, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $metadata[$key] ?? null;

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }

            if (is_int($value) || is_float($value)) {
                return (string) $value;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function publicationYear(array $metadata): int
    {
        foreach (['CreationDate', 'ModDate', 'xmp:createdate', 'xmp:modifydate', 'xmp:metadatadate'] as $key) {
            $value = $metadata[$key] ?? null;

            if (is_string($value) && preg_match('/(?:19|20)\d{2}/', $value, $matches) === 1) {
                return (int) $matches[0];
            }
        }

        return 0;
    }
}
