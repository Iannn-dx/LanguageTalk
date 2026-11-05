<?php

namespace App\Services;

use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class EmailOtpServices
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function send(User $user){
        $otp = (string) random_int(100000, 999999);

        EmailOtp::updateOrCreate(
            ['user_id' => $user->id],
            [
                'otp_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes(5),
                'last_sent_at' => now(),
                'attempts' => 0,
            ]
        );

        Mail::to($user->email)->send(new EmailOtpMail($otp));
    }
}
