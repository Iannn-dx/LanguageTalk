<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DictionaryImportRow extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_IMPORTED = 'imported';

    public const STATUS_SKIPPED = 'skipped';

    public const STATUS_FAILED = 'failed';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'import_id',
        'row_number',
        'page',
        'headword',
        'word_folded',
        'part_of_speech',
        'raw_part_of_speech',
        'definition',
        'status',
        'message',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'row_number' => 'integer',
            'page' => 'integer',
        ];
    }

    public function import(): BelongsTo
    {
        return $this->belongsTo(DictionaryImport::class, 'import_id');
    }
}
