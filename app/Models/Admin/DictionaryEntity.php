<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'definition',
        'part_of_speech',
    ];

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
