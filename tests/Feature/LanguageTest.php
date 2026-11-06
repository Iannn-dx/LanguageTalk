<?php

namespace Tests\Feature;

use App\Models\Admin\DictionaryEntity;
use App\Models\Admin\Language;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LanguageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/languages')->assertRedirect('/login');
    }

    public function test_non_admin_users_cannot_visit_the_languages_page(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/languages')
            ->assertForbidden();
    }

    public function test_admins_can_visit_the_languages_page(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/languages')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Language/index')
                ->has('languages.data', 0)
                ->where('languages.total', 0));
    }

    public function test_languages_are_paginated(): void
    {
        Language::factory()->count(20)->create();

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/languages')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('languages.data', 15)
                ->where('languages.current_page', 1)
                ->where('languages.last_page', 2)
                ->where('languages.per_page', 15)
                ->where('languages.total', 20)
                ->where('languages.from', 1)
                ->where('languages.to', 15));

        $this->actingAs($admin)
            ->get('/languages?page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('languages.data', 5)
                ->where('languages.current_page', 2)
                ->where('languages.from', 16)
                ->where('languages.to', 20));
    }

    public function test_languages_are_ordered_by_name_with_entry_counts(): void
    {
        $zulu = Language::factory()->create(['name' => 'Zulu', 'code' => 'zul']);
        $arabic = Language::factory()->create(['name' => 'Arabic', 'code' => 'ara']);

        DictionaryEntity::create([
            'language_id' => $arabic->id,
            'word' => 'kitab',
            'definition' => 'book',
            'part_of_speech' => 'noun',
        ]);

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/languages')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('languages.data', 2)
                ->where('languages.data.0.name', 'Arabic')
                ->where('languages.data.0.dictionary_entities_count', 1)
                ->where('languages.data.1.name', 'Zulu')
                ->where('languages.data.1.id', $zulu->id)
                ->where('languages.data.1.dictionary_entities_count', 0));
    }

    public function test_admins_can_create_a_language(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->post('/languages', ['name' => '  Yoruba  ', 'code' => ' YOR '])
            ->assertRedirect(route('languages.index'))
            ->assertSessionHas('status', 'Language created successfully.');

        $this->assertDatabaseHas('languages', [
            'name' => 'Yoruba',
            'code' => 'yor',
        ]);
    }

    public function test_guests_cannot_create_languages(): void
    {
        $this->post('/languages', ['name' => 'Yoruba', 'code' => 'yor'])
            ->assertRedirect('/login');
    }

    public function test_non_admin_users_cannot_create_languages(): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/languages', ['name' => 'Yoruba', 'code' => 'yor'])
            ->assertForbidden();
    }

    public function test_language_creation_requires_a_name_and_code(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->from('/languages')
            ->post('/languages', [])
            ->assertRedirect('/languages')
            ->assertSessionHasErrors(['name', 'code']);
    }

    public function test_language_name_and_code_must_be_unique(): void
    {
        Language::factory()->create(['name' => 'Yoruba', 'code' => 'yor']);

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->from('/languages')
            ->post('/languages', ['name' => 'Yoruba', 'code' => 'YOR'])
            ->assertRedirect('/languages')
            ->assertSessionHasErrors(['name', 'code']);

        $this->assertDatabaseCount('languages', 1);
    }

    public function test_language_code_must_only_contain_letters_numbers_dashes_and_underscores(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->from('/languages')
            ->post('/languages', ['name' => 'Yoruba', 'code' => 'not a code'])
            ->assertRedirect('/languages')
            ->assertSessionHasErrors('code');
    }
}
