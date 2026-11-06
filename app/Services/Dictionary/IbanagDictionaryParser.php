<?php

declare(strict_types=1);

namespace App\Services\Dictionary;

final class IbanagDictionaryParser
{
    public const PARSER_NAME = 'ibanag-v1';

    public const DEFAULT_MAX_ENTRIES = 20000;

    private const PAGE_HEADER = 'Kontemporaryu nga Diksyunaryu na Ibanag-Ingles';

    private const END_MARKER = 'Appendices';

    private const MAX_DEFINITION_CHARS = 20000;

    private const ENTRY_PATTERN = '/^([\p{L}][\p{L}\p{M}\'’\-]*(?:[ \t]+[\p{L}][\p{L}\p{M}\'’\-]*){0,3})\s+(?:(\d+)\s*[.)]?\s*)?\(([^)]{1,40})\)\s*[:.]\s*(.*)$/u';

    private const SENSE_PATTERN = '/^(\d{1,2})\s*(?:[.)]\s*|\s*\(([^)]{1,40})\)\s*)[:.]?\s*(.*)$/u';

    /**
     * Canonical parts of speech accepted from this dictionary layout.
     *
     * @var array<string, true>
     */
    private const ALLOWED_POS = [
        'n' => true,
        'v' => true,
        'adj' => true,
        'adv' => true,
        'prefix' => true,
        'pron' => true,
        'interj' => true,
        'prep' => true,
        'adv+pron' => true,
        'conj' => true,
        'n/adj' => true,
        'v+pron' => true,
        'idiomaticexpression' => true,
        'sentence' => true,
        'idiom' => true,
        'lig' => true,
        'phrase' => true,
        'art' => true,
        'infix' => true,
        'ordinalno' => true,
        's' => true,
    ];

    /**
     * Variants that appear in the PDF but mean the same thing as a canonical
     * value above. These must be merged before the unique key is applied.
     *
     * @var array<string, string>
     */
    private const POS_SYNONYMS = [
        'no' => 'n',
        'ad' => 'adj',
        'int' => 'interj',
        'article' => 'art',
        'phase' => 'phrase',
    ];

    /**
     * Parse page texts into normalized dictionary entries ready for staging.
     *
     * @param  list<string>  $pageTexts
     * @return array{
     *     entries: list<array{
     *         headword: string,
     *         word_folded: string,
     *         part_of_speech: string,
     *         raw_part_of_speech: string,
     *         definition: string,
     *         page: int
     *     }>,
     *     truncated: bool,
     *     pages: int
     * }
     */
    public function parse(array $pageTexts, int $maxEntries = self::DEFAULT_MAX_ENTRIES): array
    {
        [$entries, $truncated] = $this->parseEntries($pageTexts, $maxEntries);

        return [
            'entries' => $entries,
            'truncated' => $truncated,
            'pages' => count($pageTexts),
        ];
    }

    /**
     * Fold a headword for case-insensitive matching.
     */
    public static function fold(string $word): string
    {
        $word = trim($word);
        $word = preg_replace('/\s+/u', ' ', $word) ?? $word;
        $word = mb_convert_case($word, MB_CASE_FOLD, 'UTF-8');

        if (class_exists(\Normalizer::class)) {
            $normalized = \Normalizer::normalize($word, \Normalizer::FORM_C);
            if ($normalized !== false) {
                $word = $normalized;
            }
        }

        return $word;
    }

    /**
     * Normalize a raw part of speech to its canonical value.
     *
     * Returns null when the value is not in the dictionary's POS whitelist,
     * which prevents stray prose from being treated as an entry.
     */
    public static function normalizePartOfSpeech(string $pos): ?string
    {
        $normalized = mb_strtolower(trim($pos), 'UTF-8');
        $normalized = str_replace(['.', "\u{00A0}"], '', $normalized);
        $normalized = preg_replace('/\s+/u', '', $normalized) ?? $normalized;

        if (str_starts_with($normalized, 'prefix')) {
            return 'prefix';
        }

        $normalized = self::POS_SYNONYMS[$normalized] ?? $normalized;

        return isset(self::ALLOWED_POS[$normalized]) ? $normalized : null;
    }

    /**
     * @param  list<string>  $pageTexts
     * @return array{0: list<array{
     *     headword: string,
     *     word_folded: string,
     *     part_of_speech: string,
     *     raw_part_of_speech: string,
     *     definition: string,
     *     page: int
     * }>, 1: bool}
     */
    private function parseEntries(array $pageTexts, int $maxEntries): array
    {
        $entries = [];
        $current = null;
        $truncated = false;

        foreach ($pageTexts as $pageIndex => $pageText) {
            foreach (explode("\n", $pageText) as $rawLine) {
                $line = trim(str_replace(["\t", "\u{00A0}"], ' ', $rawLine));

                if ($line === self::END_MARKER) {
                    break 2;
                }

                if ($this->isNoiseLine($line)) {
                    continue;
                }

                if (preg_match(self::ENTRY_PATTERN, $line, $match)) {
                    $rawPos = trim($match[3]);
                    $pos = self::normalizePartOfSpeech($rawPos);

                    if ($pos !== null) {
                        if ($current !== null) {
                            $entries[] = $current;
                        }

                        if (count($entries) >= $maxEntries) {
                            $truncated = true;
                            $current = null;
                            break 2;
                        }

                        $headword = preg_replace('/\s+/u', ' ', trim($match[1])) ?? trim($match[1]);

                        $current = [
                            'headword' => $headword,
                            'word_folded' => self::fold($headword),
                            'part_of_speech' => $pos,
                            'raw_part_of_speech' => $rawPos,
                            'definition' => trim($match[4] ?? ''),
                            'page' => $pageIndex + 1,
                        ];

                        continue;
                    }
                }

                if ($current === null) {
                    continue;
                }

                if (preg_match(self::SENSE_PATTERN, $line, $senseMatch)) {
                    $sense = trim($senseMatch[3] ?? '');
                    if ($sense !== '') {
                        $sensePos = trim($senseMatch[2] ?? '');
                        $prefix = $senseMatch[1].'. ';
                        if ($sensePos !== '') {
                            $prefix .= '('.$sensePos.') ';
                        }
                        $this->appendLine($current, $prefix.$sense);
                    }

                    continue;
                }

                $this->appendLine($current, $line);
            }
        }

        if ($current !== null) {
            $entries[] = $current;
        }

        $clean = [];
        foreach ($entries as $entry) {
            $definition = preg_replace('/[ \t]+/u', ' ', $entry['definition']) ?? $entry['definition'];
            $definition = preg_replace("/\n{3,}/u", "\n\n", $definition) ?? $definition;
            $definition = trim($definition);

            if ($definition === '') {
                continue;
            }

            $entry['definition'] = $definition;
            $clean[] = $entry;
        }

        return [$clean, $truncated];
    }

    private function isNoiseLine(string $line): bool
    {
        if ($line === '' || $line === self::PAGE_HEADER) {
            return true;
        }

        if (preg_match('/^\d{1,4}$/u', $line)) {
            return true;
        }

        if (preg_match('/^\p{L}$/u', $line)) {
            return true;
        }

        return ! preg_match('/\p{L}/u', $line);
    }

    /**
     * @param  array{definition: string}  $entry
     */
    private function appendLine(array &$entry, string $line): void
    {
        if (mb_strlen($entry['definition'], 'UTF-8') >= self::MAX_DEFINITION_CHARS) {
            return;
        }

        $entry['definition'] .= "\n".$line;
    }
}
