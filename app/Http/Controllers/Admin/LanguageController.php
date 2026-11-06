<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLanguageRequest;
use App\Models\Admin\Language;
use Illuminate\Http\RedirectResponse;
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

    /**
     * Store a newly created language.
     */
    public function store(StoreLanguageRequest $request): RedirectResponse
    {
        Language::create($request->validated());

        return to_route('languages.index')->with('status', 'Language created successfully.');
    }
}
