<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['name', 'slug', 'icon', 'description'])]
class Category extends Model
{
    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }
}
