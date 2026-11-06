<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Source extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'author',
        'publisher',
        'publication_year',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'publication_year' => 'integer',
        ];
    }

    public function entries(): BelongsToMany
    {
        return $this->belongsToMany(DictionaryEntity::class, 'entry_sources', 'source_id', 'entry_id')
            ->withTimestamps();
    }
}
