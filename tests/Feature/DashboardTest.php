<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/admin/dashboard')->assertRedirect('/login');
    }

    public function test_users_can_visit_the_user_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_users_cannot_visit_the_admin_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/admin/dashboard')->assertForbidden();
    }

    public function test_admins_can_visit_the_admin_dashboard()
    {
        $this->actingAs($admin = User::factory()->create(['role' => 'admin']));

        $this->get('/admin/dashboard')->assertOk();
    }

    public function test_admins_cannot_visit_the_user_dashboard()
    {
        $this->actingAs($admin = User::factory()->create(['role' => 'admin']));

        $this->get('/dashboard')->assertForbidden();
    }

    public function test_admins_can_visit_the_dictionary_pages()
    {
        $this->actingAs($admin = User::factory()->create(['role' => 'admin']));

        $this->get('/dictionary')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Dictionary/index'));

        $this->get('/import_dictionary')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('import_dictionary'));
    }

    public function test_users_cannot_visit_the_dictionary_pages()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dictionary')->assertForbidden();
        $this->get('/import_dictionary')->assertForbidden();
    }
}
