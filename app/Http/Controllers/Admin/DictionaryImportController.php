<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDictionaryImportRequest;
use App\Jobs\ParseDictionaryPdfJob;
use App\Models\Admin\DictionaryImport;
use App\Models\Admin\DictionaryImportRow;
use App\Models\Admin\Source;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class DictionaryImportController extends Controller
{
    /**
     * Store an uploaded PDF and queue it for parsing.
     */
    public function store(StoreDictionaryImportRequest $request): RedirectResponse|JsonResponse
    {
        $file = $request->file('file');
        $directory = 'imports/'.Str::uuid()->toString();
        $path = $file->storeAs($directory, 'source.pdf', 'local');

        if ($path === false) {
            abort(500, 'The PDF could not be stored. Please try again.');
        }

        $import = DictionaryImport::query()->create([
            'user_id' => $request->user()?->id,
            'language_id' => $request->integer('language_id'),
            'original_name' => $this->safeOriginalName($file->getClientOriginalName()),
            'disk' => 'local',
            'path' => $path,
            'mime_type' => $file->getMimeType() ?? 'application/pdf',
            'size' => (int) $file->getSize(),
            'status' => DictionaryImport::STATUS_UPLOADED,
        ]);

        ParseDictionaryPdfJob::dispatch($import->id);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Dictionary upload queued for parsing.',
                'import' => $this->importPayload($import->fresh()),
            ], 201);
        }

        return back()
            ->with('status', 'Dictionary upload queued for parsing.')
            ->with('dictionary_import_id', $import->id);
    }

    /**
     * Return the import status and a read-only preview of staged rows.
     */
    public function show(DictionaryImport $import): JsonResponse
    {
        return response()->json([
            'import' => $this->importPayload($import),
            'preview' => $this->previewPayload($import),
        ]);
    }

    /**
     * Commit the staged rows that do not already exist in the language.
     */
    public function confirm(Request $request, DictionaryImport $import): RedirectResponse|JsonResponse
    {
        if ($import->status !== DictionaryImport::STATUS_READY) {
            abort(422, 'This import is not ready to be confirmed.');
        }

        if ($import->language_id === null) {
            abort(422, 'The language for this import no longer exists.');
        }

        $counts = DB::transaction(function () use ($import): array {
            $locked = DictionaryImport::query()
                ->whereKey($import->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status !== DictionaryImport::STATUS_READY) {
                abort(422, 'This import is not ready to be confirmed.');
            }

            $locked->forceFill([
                'status' => DictionaryImport::STATUS_IMPORTING,
                'started_at' => $locked->started_at ?? now(),
                'error_message' => null,
            ])->save();

            $counts = $this->importRows($locked);

            $locked->forceFill([
                'status' => DictionaryImport::STATUS_COMPLETED,
                'imported_rows' => $counts['imported'],
                'skipped_rows' => $counts['skipped'],
                'failed_rows' => 0,
                'finished_at' => now(),
                'error_message' => null,
            ])->save();

            return $counts;
        });

        $import = $this->deleteStoredPdf($import->fresh());

        $message = sprintf(
            'Import completed: %d imported, %d skipped.',
            $counts['imported'],
            $counts['skipped']
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'imported' => $counts['imported'],
                'skipped' => $counts['skipped'],
                'failed' => 0,
                'import' => $this->importPayload($import),
            ]);
        }

        return to_route('dictionary')->with('status', $message);
    }

    /**
     * Discard an import, its staging rows, and its stored PDF.
     */
    public function destroy(Request $request, DictionaryImport $import): RedirectResponse|JsonResponse
    {
        if (in_array($import->status, [DictionaryImport::STATUS_PROCESSING, DictionaryImport::STATUS_IMPORTING], true)) {
            abort(422, 'This import cannot be discarded while it is being processed.');
        }

        if ($import->path !== null) {
            Storage::disk($import->disk)->delete($import->path);
        }

        $import->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Import discarded.']);
        }

        return back()->with('status', 'Import discarded.');
    }

    /**
     * @return array{imported: int, skipped: int}
     */
    private function importRows(DictionaryImport $import): array
    {
        $languageId = $import->language_id;
        $sourceId = $import->options['source_id'] ?? null;
        $imported = 0;
        $skipped = 0;
        $now = now();

        DictionaryImportRow::query()
            ->where('import_id', $import->id)
            ->where('status', DictionaryImportRow::STATUS_PENDING)
            ->orderBy('id')
            ->chunkById(500, function ($rows) use ($import, $languageId, $sourceId, &$imported, &$skipped, $now): void {
                $folds = $rows->pluck('word_folded')->unique()->values()->all();

                $existing = DB::table('dictionary_entities')
                    ->where('language_id', $languageId)
                    ->whereIn('word_folded', $folds)
                    ->get(['id', 'word_folded', 'part_of_speech'])
                    ->mapWithKeys(fn ($entry) => [
                        $this->entryKey($entry->word_folded, $entry->part_of_speech) => (int) $entry->id,
                    ])
                    ->all();

                $reserved = [];
                $inserts = [];
                $existingIds = [];
                $repeatedIds = [];

                foreach ($rows as $row) {
                    $key = $this->entryKey($row->word_folded, $row->part_of_speech);

                    if (isset($existing[$key]) || isset($reserved[$key])) {
                        if (isset($existing[$key])) {
                            $existingIds[] = $row->id;
                        } else {
                            $repeatedIds[] = $row->id;
                        }

                        continue;
                    }

                    // Reserve the key so later rows in this chunk that repeat it
                    // are skipped instead of silently dropped by the unique index.
                    $reserved[$key] = true;

                    $inserts[] = [
                        'language_id' => $languageId,
                        'word' => $row->headword,
                        'word_folded' => $row->word_folded,
                        'definition' => $row->definition,
                        'part_of_speech' => $row->part_of_speech,
                        'source_page' => $row->page,
                        'import_id' => $import->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if ($inserts !== []) {
                    DB::table('dictionary_entities')->insertOrIgnore($inserts);
                }

                $entries = DB::table('dictionary_entities')
                    ->where('language_id', $languageId)
                    ->whereIn('word_folded', $folds)
                    ->get(['id', 'word_folded', 'part_of_speech'])
                    ->mapWithKeys(fn ($entry) => [
                        $this->entryKey($entry->word_folded, $entry->part_of_speech) => (int) $entry->id,
                    ])
                    ->all();

                $skippedLookup = array_flip(array_merge($existingIds, $repeatedIds));
                $importedIds = [];
                $pivots = [];

                foreach ($rows as $row) {
                    if (isset($skippedLookup[$row->id])) {
                        continue;
                    }

                    $key = $this->entryKey($row->word_folded, $row->part_of_speech);
                    $importedIds[] = $row->id;
                    $entityId = $entries[$key] ?? null;

                    if ($sourceId !== null && $entityId !== null) {
                        $pivots[] = [
                            'entry_id' => $entityId,
                            'source_id' => $sourceId,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                if ($pivots !== []) {
                    DB::table('entry_sources')->insertOrIgnore($pivots);
                }

                if ($importedIds !== []) {
                    DictionaryImportRow::query()
                        ->whereIn('id', $importedIds)
                        ->update([
                            'status' => DictionaryImportRow::STATUS_IMPORTED,
                            'message' => null,
                            'updated_at' => $now,
                        ]);
                }

                if ($existingIds !== []) {
                    DictionaryImportRow::query()
                        ->whereIn('id', $existingIds)
                        ->update([
                            'status' => DictionaryImportRow::STATUS_SKIPPED,
                            'message' => 'Already exists in this language.',
                            'updated_at' => $now,
                        ]);
                }

                if ($repeatedIds !== []) {
                    DictionaryImportRow::query()
                        ->whereIn('id', $repeatedIds)
                        ->update([
                            'status' => DictionaryImportRow::STATUS_SKIPPED,
                            'message' => 'Duplicate entry within this import.',
                            'updated_at' => $now,
                        ]);
                }

                $imported += count($importedIds);
                $skipped += count($existingIds) + count($repeatedIds);
            });

        return [
            'imported' => $imported,
            'skipped' => $skipped,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function importPayload(DictionaryImport $import): array
    {
        $import->loadMissing('language');

        $options = $import->options ?? [];
        $source = isset($options['source_id'])
            ? Source::query()->find($options['source_id'])
            : null;

        return [
            'id' => $import->id,
            'status' => $import->status,
            'language' => $import->language === null ? null : [
                'id' => $import->language->id,
                'name' => $import->language->name,
                'code' => $import->language->code,
            ],
            'original_name' => $import->original_name,
            'size' => $import->size,
            'pages' => $import->pages,
            'total_rows' => $import->total_rows,
            'imported_rows' => $import->imported_rows,
            'skipped_rows' => $import->skipped_rows,
            'failed_rows' => $import->failed_rows,
            'parser' => $import->parser,
            'error_message' => $import->error_message,
            'source' => $source === null ? null : [
                'id' => $source->id,
                'title' => $source->title,
                'author' => $source->author,
                'publisher' => $source->publisher,
                'publication_year' => $source->publication_year,
            ],
            'created_at' => $import->created_at?->toIso8601String(),
            'started_at' => $import->started_at?->toIso8601String(),
            'finished_at' => $import->finished_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function previewPayload(DictionaryImport $import): ?array
    {
        $rowQuery = DictionaryImportRow::query()->where('import_id', $import->id);

        if (! (clone $rowQuery)->exists()) {
            return null;
        }

        $breakdown = (clone $rowQuery)
            ->select('part_of_speech')
            ->selectRaw('count(*) as aggregate')
            ->groupBy('part_of_speech')
            ->orderByDesc('aggregate')
            ->get()
            ->map(fn ($row) => [
                'part_of_speech' => $row->part_of_speech,
                'count' => (int) $row->aggregate,
            ])
            ->all();

        $sample = (clone $rowQuery)
            ->orderBy('row_number')
            ->limit(50)
            ->get([
                'row_number',
                'page',
                'headword',
                'part_of_speech',
                'raw_part_of_speech',
                'definition',
                'status',
            ])
            ->map(fn (DictionaryImportRow $row) => [
                'row_number' => $row->row_number,
                'page' => $row->page,
                'headword' => $row->headword,
                'part_of_speech' => $row->part_of_speech,
                'raw_part_of_speech' => $row->raw_part_of_speech,
                'definition' => $row->definition,
                'status' => $row->status,
            ])
            ->all();

        return [
            'pos_breakdown' => $breakdown,
            'duplicate_count' => $import->status === DictionaryImport::STATUS_READY
                ? $this->duplicateCount($import)
                : 0,
            'sample' => $sample,
        ];
    }

    private function duplicateCount(DictionaryImport $import): int
    {
        if ($import->language_id === null) {
            return 0;
        }

        return DB::table('dictionary_import_rows as rows')
            ->join('dictionary_entities as entries', function ($join) use ($import): void {
                $join->on('entries.word_folded', '=', 'rows.word_folded')
                    ->on('entries.part_of_speech', '=', 'rows.part_of_speech')
                    ->where('entries.language_id', '=', $import->language_id);
            })
            ->where('rows.import_id', $import->id)
            ->count();
    }

    private function deleteStoredPdf(DictionaryImport $import): DictionaryImport
    {
        if ($import->path === null) {
            return $import;
        }

        try {
            Storage::disk($import->disk)->delete($import->path);
            $import->forceFill(['path' => null])->save();
        } catch (Throwable $e) {
            report($e);
        }

        return $import;
    }

    private function entryKey(?string $wordFolded, ?string $partOfSpeech): string
    {
        return ($wordFolded ?? '')."\x1F".($partOfSpeech ?? '');
    }

    private function safeOriginalName(string $name): string
    {
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? $name;
        $name = trim($name);

        if ($name === '') {
            $name = 'dictionary.pdf';
        }

        return mb_substr($name, 0, 255);
    }
}
