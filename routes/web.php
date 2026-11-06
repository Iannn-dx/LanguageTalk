<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', function () {
        return Inertia::render('admin/dashboard');
    })->name('admin.dashboard');

    Route::get('/dictionary', function () {
        return Inertia::render('admin/Dictionary/index');
    })->name('dictionary');

    Route::get('/import_dictionary', function () {
        return Inertia::render('import_dictionary');
    })->name('import_dictionary');

    Route::get('/language', function () {
        return Inertia::render('admin/Language/index');
    })->name('language');

});

Route::middleware(['auth', 'role:user'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
