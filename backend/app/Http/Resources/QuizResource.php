<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'cover_image' => $this->cover_image,
            'duration_minutes' => $this->duration_minutes,
            'total_questions' => $this->total_questions,
            'total_attempts' => $this->total_attempts,
            'total_likes' => $this->total_likes,
            'visibility' => $this->visibility,
            'status' => $this->status,
            'shuffle_questions' => $this->shuffle_questions,
            'shuffle_answers' => $this->shuffle_answers,
            'allow_review' => $this->allow_review,
            'passing_score' => $this->passing_score,
            'author' => [
                'id' => $this->user->id ?? null,
                'name' => $this->user->name ?? null,
                'avatar' => $this->user->avatar ?? null,
            ],
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
