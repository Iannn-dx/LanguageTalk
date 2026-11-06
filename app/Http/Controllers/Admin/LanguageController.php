<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Language;
use Inertia\Inertia;
use Inertia\Response;

class LanguageController extends Controller
{
    /**
     * Display a paginated listing of the languages.
     */
    public function index(): Response
    {
        $languages = Language::query()
            ->withCount('dictionaryEntities')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/Language/index', [
            'languages' => $languages,
        ]);
    }
}
