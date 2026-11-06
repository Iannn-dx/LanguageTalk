<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Dictionary\IbanagDictionaryParser;
use App\Services\Dictionary\PdfTextExtractor;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class IbanagDictionaryParserTest extends TestCase
{
    public function test_it_parses_entries_and_normalizes_parts_of_speech(): void
    {
        $result = (new IbanagDictionaryParser)->parse([<<<'TEXT'
Kontemporaryu nga Diksyunaryu na Ibanag-Ingles
12
a (interj.): used to express delight.
ababba (adj.): short (used for length but not for height).
abaka (no.): the banana-like plant that yields fiber;
also, the fiber.
dakal (phase): a phrase.
TEXT]);

        $this->assertSame(4, count($result['entries']));
        $this->assertFalse($result['truncated']);
        $this->assertSame(1, $result['pages']);

        $this->assertSame('a', $result['entries'][0]['headword']);
        $this->assertSame('interj', $result['entries'][0]['part_of_speech']);
        $this->assertSame('interj.', $result['entries'][0]['raw_part_of_speech']);

        $this->assertSame('adj', $result['entries'][1]['part_of_speech']);
        $this->assertSame('n', $result['entries'][2]['part_of_speech']);
        $this->assertSame("the banana-like plant that yields fiber;\nalso, the fiber.", $result['entries'][2]['definition']);
        $this->assertSame('phrase', $result['entries'][3]['part_of_speech']);
        $this->assertSame(1, $result['entries'][3]['page']);
    }

    public function test_senses_are_kept_and_lines_are_joined(): void
    {
        $result = (new IbanagDictionaryParser)->parse([<<<'TEXT'
word (n): first sense
1. second sense
2. (fig.) third sense
TEXT]);

        $this->assertCount(1, $result['entries']);
        $this->assertSame(
            "first sense\n1. second sense\n2. (fig.) third sense",
            $result['entries'][0]['definition']
        );
    }

    public function test_unknown_parts_of_speech_and_noise_are_ignored(): void
    {
        $result = (new IbanagDictionaryParser)->parse([<<<'TEXT'
stray prose that is not an entry
word (unknown): must not start an entry
valid (v): still parses
1
B
TEXT]);

        $this->assertCount(1, $result['entries']);
        $this->assertSame('valid', $result['entries'][0]['headword']);
        $this->assertSame('v', $result['entries'][0]['part_of_speech']);
    }

    public function test_entries_without_a_definition_are_dropped(): void
    {
        $result = (new IbanagDictionaryParser)->parse([<<<'TEXT'
empty (n):
filled (n): has a definition
TEXT]);

        $this->assertCount(1, $result['entries']);
        $this->assertSame('filled', $result['entries'][0]['headword']);
    }

    public function test_max_entries_marks_the_result_as_truncated(): void
    {
        $result = (new IbanagDictionaryParser)->parse([<<<'TEXT'
one (n): first
two (n): second
three (n): third
TEXT], 2);

        $this->assertCount(2, $result['entries']);
        $this->assertTrue($result['truncated']);
    }

    public function test_fold_is_case_insensitive_and_collapses_whitespace(): void
    {
        $this->assertSame('abaka', IbanagDictionaryParser::fold('  ABAKA  '));
        $this->assertSame('two words', IbanagDictionaryParser::fold("Two\t  Words"));
    }

    #[DataProvider('partOfSpeechProvider')]
    public function test_parts_of_speech_are_normalized(string $raw, ?string $expected): void
    {
        $this->assertSame($expected, IbanagDictionaryParser::normalizePartOfSpeech($raw));
    }

    /**
     * @return array<string, array{0: string, 1: string|null}>
     */
    public static function partOfSpeechProvider(): array
    {
        return [
            'noun with period' => ['n.', 'n'],
            'no means noun' => ['no.', 'n'],
            'ad means adjective' => ['ad', 'adj'],
            'spaced adjective' => ['n/ adj.', 'n/adj'],
            'interjection' => ['i nterj.', 'interj'],
            'int means interjection' => ['int.', 'interj'],
            'article' => ['article', 'art'],
            'phase means phrase' => ['phase', 'phrase'],
            'prefix phrase' => ['prefix for ordinal numbers', 'prefix'],
            'ordinal noun' => ['ordinal no.', 'ordinalno'],
            'joined verb pronoun' => ['v + pron', 'v+pron'],
            'idiomatic expression' => ['idiomatic expression', 'idiomaticexpression'],
            'unknown' => ['adverb of time', null],
        ];
    }

    public function test_parsing_stops_at_the_appendices_section(): void
    {
        $result = (new IbanagDictionaryParser)->parse([<<<'TEXT'
zumozzozzog (v): blazing
Zumozzozog i afi na kalan.
Appendices
Appendix 1: Anatomy of the Human Body
TEXT]);

        $this->assertCount(1, $result['entries']);
        $this->assertSame(
            "blazing\nZumozzozog i afi na kalan.",
            $result['entries'][0]['definition']
        );
    }

    public function test_text_normalization_repairs_ligatures_and_hyphenation(): void
    {
        $text = "inter-\nnational \u{FB01}ber and soft\u{00AD}hyphen";

        $this->assertSame('international fiber and softhyphen', PdfTextExtractor::normalizeText($text));
    }
}
