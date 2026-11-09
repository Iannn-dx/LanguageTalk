<?php

use App\Http\Controllers\Admin\DictionaryImportController;
use App\Http\Controllers\Admin\LanguageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', function () {
        return Inertia::render('admin/dashboard');
    })->name('admin.dashboard');

    Route::get('/dictionary', [DictionaryImportController::class, 'index'])->name('dictionary');

    Route::get('/import_dictionary', function () {
        return Inertia::render('import_dictionary');
    })->name('import_dictionary');

    Route::get('/languages', [LanguageController::class, 'index'])->name('languages.index');
    Route::post('/languages', [LanguageController::class, 'store'])->name('languages.store');

    Route::post('/dictionary/imports', [DictionaryImportController::class, 'store'])->name('dictionary.imports.store');
    Route::get('/dictionary/imports/{import}', [DictionaryImportController::class, 'show'])->name('dictionary.imports.show');
    Route::post('/dictionary/imports/{import}/confirm', [DictionaryImportController::class, 'confirm'])->name('dictionary.imports.confirm');
    Route::delete('/dictionary/imports/{import}', [DictionaryImportController::class, 'destroy'])->name('dictionary.imports.destroy');
});

Route::middleware(['auth', 'role:user'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
