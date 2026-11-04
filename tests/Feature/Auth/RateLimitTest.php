<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    // public function test_example(): void
    // {
    //     $response = $this->get('/');

    //     $response->assertStatus(200);
    // }

    public function test_registration_is_rate_limited(){
        for($i = 0; $i < 3; $i++){
            $this->post('/register', []);
        }

        $response = $this->post('register', []);
        $response->assertTooManyRequests();
    }
}
