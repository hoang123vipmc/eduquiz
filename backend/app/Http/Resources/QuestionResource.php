<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        try {
            return [
                'id' => $this->id,
                'quiz_id' => $this->quiz_id,
                'question_text' => $this->question_text,
                'question_image' => $this->question_image,
                'explanation' => $this->when($request->routeIs('*.edit') || $request->user()?->role === 'admin' || $request->user()?->id === $this->quiz->user_id || $request->attributes->get('is_practice_mode') === true, $this->explanation),
                'type' => $this->type,
                'difficulty' => $this->difficulty,
                'points' => $this->points,
                'order' => $this->order,
                'options' => OptionResource::collection($this->whenLoaded('options')),
            ];
        } catch (\Throwable $e) {
            \Log::error("QuestionResource error: " . $e->getMessage() . " | Class of this: " . get_class($this) . " | Class of resource: " . (is_object($this->resource) ? get_class($this->resource) : gettype($this->resource)));
            throw $e;
        }
    }
}
