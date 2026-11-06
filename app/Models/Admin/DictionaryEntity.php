<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DictionaryEntity extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'language_id',
        'word',
        'word_folded',
        'definition',
        'part_of_speech',
        'source_page',
        'import_id',
    ];

    protected function casts(): array
    {
        return [
            'source_page' => 'integer',
        ];
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function import(): BelongsTo
    {
        return $this->belongsTo(DictionaryImport::class, 'import_id');
    }

    public function sources(): BelongsToMany
    {
        return $this->belongsToMany(Source::class, 'entry_sources', 'entry_id', 'source_id')
            ->withTimestamps();
    }
}
