<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailOtp extends Model
{
    //
    protected $fillable = [
        'user_id',
        'otp_hash',
        'expires_at',
        'last_sent_at',
        'attempts'
    ];

    protected function casts(): array{
        return [
            'expires_at' => 'datetime',
            'last_sent_at' => 'datetime'
        ];
    }
}
