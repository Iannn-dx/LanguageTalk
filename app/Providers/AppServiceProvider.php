<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //rate limiting so per 5 attempts with ip
        RateLimiter::for('login', function(Request $request){
            return limit::perMinute(5)->by(strtolower($request->input('email')).'|'.$request->ip());
        });

        // ratelimiting in registration per minute and ip
        RateLimiter::for('register', function(Request $request){
            return limit::perMinute(3)->by($request->ip());
        });
    }
}
