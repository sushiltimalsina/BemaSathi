<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecommendationFeedback extends Model
{
    protected $table = 'recommendation_feedback';

    protected $fillable = [
        'user_id',
        'policy_id',
        'position',
        'match_score',
        'variant',
        'clicked',
        'purchased',
        'time_spent_seconds',
        'shown_at'
    ];

    protected $casts = [
        'clicked' => 'boolean',
        'purchased' => 'boolean',
        'match_score' => 'float',
        'shown_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }
}
