<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['attempt_id', 'score', 'correct_answers', 'wrong_answers', 'skipped_answers', 'accuracy', 'time_taken_seconds'])]
class Result extends Model
{
    public $timestamps = false;
    
    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'attempt_id');
    }
}
