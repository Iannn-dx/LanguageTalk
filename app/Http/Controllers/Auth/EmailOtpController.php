<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Models\User;
use App\Services\EmailOtpServices;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class EmailOtpController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $this->pendingUser($request);

        if (! $user) {
            return $this->redirectWithoutPendingUser($request);
        }

        return Inertia::render('auth/verify-email', ['email' => $user->email]);
    }

    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $user = $this->pendingUser($request);

        if (! $user) {
            return $this->redirectWithoutPendingUser($request);
        }

        $record = EmailOtp::where('user_id', $user->id)->first();

        if (! $record) {
            return back()->withErrors([
                'otp' => 'Verification code has expired',
            ]);
        }

        if ($record->expires_at->isPast()) {
            $record->delete();

            return back()->withErrors([
                'otp' => 'Verification code has expired',
            ]);
        }

        if ($record->attempts >= 5) {
            return back()->withErrors([
                'otp' => 'Too many incorrect attempts. Request a new code',
            ]);
        }

        if (! Hash::check($request->otp, $record->otp_hash)) {
            $record->increment('attempts');

            return back()->withErrors([
                'otp' => 'Incorrect verification code',
            ]);
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        $record->delete();
        $request->session()->forget('otp_user_id');

        Auth::login($user);
        $request->session()->regenerate();

        return match($user->role){
            'admin' => to_route('admin.dashboard'),
            default => to_route('dashboard'),
        };
    }

    public function resend(Request $request, EmailOtpServices $otpService): RedirectResponse
    {
        $user = $this->pendingUser($request);

        if (! $user) {
            return $this->redirectWithoutPendingUser($request);
        }

        $record = EmailOtp::where('user_id', $user->id)->first();

        if ($record && $record->last_sent_at && $record->last_sent_at->addSeconds(60)->isFuture()) {
            return back()->withErrors([
                'otp' => 'Please wait before requesting another code',
            ]);
        }

        $otpService->send($user);

        return back()->with('status', 'A new verification code was sent to your email.');
    }

    private function pendingUser(Request $request): ?User
    {
        $userId = $request->session()->get('otp_user_id');

        return $userId ? User::find($userId) : null;
    }

    private function redirectWithoutPendingUser(Request $request): RedirectResponse
    {
        return $request->user()
            ? to_route('dashboard')
            : to_route('register');
    }
}
