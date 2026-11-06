<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorelanguageRequest;
use App\Models\Admin\Language;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\View;
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

    // public function create(): View{
    //     return view('admin/language/index');
    // }

    public function store(Request $request): RedirectResponse{
        Language::create($request->validated());

        return redirect()
        ->route('')
        ->with('success', 'Language created successfully.');
    }
}
