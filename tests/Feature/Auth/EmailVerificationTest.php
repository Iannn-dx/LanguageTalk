<?php

namespace Tests\Feature\Auth;

use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_redirects_to_the_verification_screen(): void
    {
        Mail::fake();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('verification.notice'));
        $response->assertSessionHas('otp_user_id');

        $user = User::where('email', 'test@example.com')->firstOrFail();

        $this->assertGuest();
        $this->assertNull($user->email_verified_at);
        $this->assertDatabaseHas('email_otps', ['user_id' => $user->id]);

        Mail::assertSent(EmailOtpMail::class);
    }

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this
            ->withSession(['otp_user_id' => $user->id])
            ->get('/verify-email');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('auth/verify-email')
            ->where('email', $user->email));
    }

    public function test_email_can_be_verified_with_a_valid_otp(): void
    {
        $user = User::factory()->unverified()->create();

        EmailOtp::create([
            'user_id' => $user->id,
            'otp_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(5),
            'last_sent_at' => now(),
        ]);

        $response = $this
            ->withSession(['otp_user_id' => $user->id])
            ->post('/verify-email', ['otp' => '123456']);

        $response->assertRedirect(route('dashboard'));
        $response->assertSessionMissing('otp_user_id');

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertDatabaseMissing('email_otps', ['user_id' => $user->id]);
    }

    public function test_email_is_not_verified_with_an_invalid_otp(): void
    {
        $user = User::factory()->unverified()->create();

        EmailOtp::create([
            'user_id' => $user->id,
            'otp_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(5),
            'last_sent_at' => now(),
        ]);

        $response = $this
            ->withSession(['otp_user_id' => $user->id])
            ->post('/verify-email', ['otp' => '654321']);

        $response->assertSessionHasErrors('otp');

        $this->assertGuest();
        $this->assertNull($user->fresh()->email_verified_at);
        $this->assertDatabaseHas('email_otps', ['user_id' => $user->id, 'attempts' => 1]);
    }

    public function test_expired_otp_cannot_be_used(): void
    {
        $user = User::factory()->unverified()->create();

        EmailOtp::create([
            'user_id' => $user->id,
            'otp_hash' => Hash::make('123456'),
            'expires_at' => now()->subMinute(),
            'last_sent_at' => now()->subMinutes(6),
        ]);

        $response = $this
            ->withSession(['otp_user_id' => $user->id])
            ->post('/verify-email', ['otp' => '123456']);

        $response->assertSessionHasErrors('otp');

        $this->assertGuest();
        $this->assertNull($user->fresh()->email_verified_at);
        $this->assertDatabaseMissing('email_otps', ['user_id' => $user->id]);
    }
}
