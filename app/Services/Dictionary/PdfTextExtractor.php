<?php

declare(strict_types=1);

namespace App\Services\Dictionary;

use Smalot\PdfParser\Parser;
use Throwable;

final class PdfTextExtractor
{
    /**
     * Extract normalized text from a PDF, keeping per-page text for provenance.
     *
     * @return array{text: string, pageTexts: list<string>, pages: int}
     */
    public function extract(string $path): array
    {
        if (! is_file($path) || ! is_readable($path)) {
            throw new \RuntimeException('The PDF file is missing or unreadable.');
        }

        try {
            $pdf = (new Parser)->parseFile($path);

            $pageTexts = [];
            foreach ($pdf->getPages() as $page) {
                $pageTexts[] = self::normalizeText($page->getText());
            }

            $text = self::normalizeText(implode("\n", $pageTexts));
        } catch (Throwable $e) {
            throw new \RuntimeException(
                'Unable to extract text from this PDF. It may be damaged or password-protected.',
                0,
                $e
            );
        }

        return [
            'text' => $text,
            'pageTexts' => $pageTexts,
            'pages' => count($pageTexts),
        ];
    }

    public static function normalizeText(string $text): string
    {
        if (! mb_check_encoding($text, 'UTF-8')) {
            $text = mb_scrub($text, 'UTF-8');
        }

        $text = str_replace(
            ["\r\n", "\r", "\u{2028}", "\u{2029}", "\f"],
            "\n",
            $text
        );

        // PDF fonts often expose ligatures instead of the underlying letters.
        $text = strtr($text, [
            "\u{FB00}" => 'ff',
            "\u{FB01}" => 'fi',
            "\u{FB02}" => 'fl',
            "\u{FB03}" => 'ffi',
            "\u{FB04}" => 'ffl',
            "\u{FB05}" => 'st',
            "\u{FB06}" => 'st',
        ]);

        // Join words that were hyphenated at the end of a line:
        // "inter-\nnational" -> "international".
        $joined = preg_replace(
            '/(?<=\p{L})[\-\x{00AD}\x{2010}\x{2011}][ \t]*\n[ \t]*(?=\p{L})/u',
            '',
            $text
        );
        if ($joined !== null) {
            $text = $joined;
        }

        // Remove any remaining soft hyphens.
        $text = preg_replace('/\x{00AD}/u', '', $text) ?? $text;

        // NFC keeps dictionary and PDF text comparable when Intl is available.
        // The application still works without the extension.
        if (class_exists(\Normalizer::class)) {
            $normalized = \Normalizer::normalize($text, \Normalizer::FORM_C);
            if ($normalized !== false) {
                $text = $normalized;
            }
        }

        return $text;
    }
}
