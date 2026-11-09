<?php

namespace Tests\Feature;

use App\Models\Admin\DictionaryEntity;
use App\Models\Admin\Language;
use App\Models\User;
use App\Services\Dictionary\IbanagDictionaryParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DictionaryEntriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_dictionary_page_lists_entries_ordered_by_folded_headword(): void
    {
        $language = Language::factory()->create(['name' => 'Ibanag', 'code' => 'ibg']);

        $this->entry($language, 'abaka', 'n', 'The banana-like plant that yields fiber.', 12);
        $this->entry($language, 'Ababba', 'adj', 'Short (used for length but not height).', 1);

        $this->actingAs($this->admin())
            ->get(route('dictionary'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dictionary/index')
                ->has('entries.data', 2)
                ->where('entries.data.0.word', 'Ababba')
                ->where('entries.data.0.part_of_speech', 'adj')
                ->where('entries.data.0.definition', 'Short (used for length but not height).')
                ->where('entries.data.0.source_page', 1)
                ->where('entries.data.0.language.code', 'ibg')
                ->where('entries.data.1.word', 'abaka')
                ->where('entries.per_page', 25)
                ->where('entries.total', 2)
                ->where('filters.search', '')
                ->where('filters.language_id', null)
            );
    }

    public function test_entries_can_be_filtered_by_language(): void
    {
        $ibanag = Language::factory()->create(['name' => 'Ibanag', 'code' => 'ibg']);
        $ilocano = Language::factory()->create(['name' => 'Ilocano', 'code' => 'ilk']);

        $this->entry($ibanag, 'abaka');
        $this->entry($ilocano, 'abakada');

        $this->actingAs($this->admin())
            ->get(route('dictionary', ['language_id' => $ibanag->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('entries.data', 1)
                ->where('entries.data.0.word', 'abaka')
                ->where('entries.total', 1)
                ->where('filters.language_id', $ibanag->id)
            );
    }

    public function test_entries_can_be_searched_by_folded_headword(): void
    {
        $language = Language::factory()->create(['name' => 'Ibanag', 'code' => 'ibg']);

        $this->entry($language, 'Abaka');
        $this->entry($language, 'Bangka');

        $this->actingAs($this->admin())
            ->get(route('dictionary', ['search' => 'ABAKA']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('entries.data', 1)
                ->where('entries.data.0.word', 'Abaka')
                ->where('entries.total', 1)
                ->where('filters.search', 'ABAKA')
            );
    }

    public function test_entries_are_paginated(): void
    {
        $language = Language::factory()->create();

        foreach (range(1, 26) as $index) {
            $this->entry($language, sprintf('word-%02d', $index));
        }

        $this->actingAs($this->admin())
            ->get(route('dictionary', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('entries.data', 1)
                ->where('entries.current_page', 2)
                ->where('entries.last_page', 2)
                ->where('entries.total', 26)
                ->where('entries.data.0.word', 'word-26')
            );
    }

    public function test_unknown_language_filters_are_ignored(): void
    {
        $language = Language::factory()->create();

        $this->entry($language, 'abaka');

        $this->actingAs($this->admin())
            ->get(route('dictionary', ['language_id' => 9999]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('entries.data', 1)
                ->where('filters.language_id', null)
            );
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function entry(
        Language $language,
        string $word,
        string $partOfSpeech = 'n',
        ?string $definition = null,
        ?int $page = null
    ): DictionaryEntity {
        return DictionaryEntity::query()->create([
            'language_id' => $language->id,
            'word' => $word,
            'word_folded' => IbanagDictionaryParser::fold($word),
            'definition' => $definition ?? "Definition for {$word}.",
            'part_of_speech' => $partOfSpeech,
            'source_page' => $page,
        ]);
    }
}
