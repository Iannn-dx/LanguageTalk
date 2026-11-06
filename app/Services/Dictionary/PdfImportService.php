<?php

declare(strict_types=1);

namespace App\Services\Dictionary;

final class PdfImportService
{
    public function __construct(
        private readonly PdfTextExtractor $extractor,
        private readonly IbanagDictionaryParser $parser,
    ) {}

    /**
     * Extract and parse a PDF into staged-entry payloads.
     *
     * Persisting these entries is handled by the import job so this service
     * stays free of database concerns.
     *
     * @return array{
     *     pages: int,
     *     entries: list<array{
     *         headword: string,
     *         word_folded: string,
     *         part_of_speech: string,
     *         raw_part_of_speech: string,
     *         definition: string,
     *         page: int
     *     }>,
     *     truncated: bool,
     *     parser: string
     * }
     */
    public function parseFile(string $path, int $maxEntries = IbanagDictionaryParser::DEFAULT_MAX_ENTRIES): array
    {
        $extracted = $this->extractor->extract($path);

        if (trim($extracted['text']) === '') {
            throw new \RuntimeException(
                'No extractable text found. This PDF may be scanned or image-only.'
            );
        }

        $parsed = $this->parser->parse($extracted['pageTexts'], $maxEntries);

        return [
            'pages' => $extracted['pages'],
            'entries' => $parsed['entries'],
            'truncated' => $parsed['truncated'],
            'parser' => IbanagDictionaryParser::PARSER_NAME,
        ];
    }
}
