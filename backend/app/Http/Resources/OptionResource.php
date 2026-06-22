<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'option_text' => $this->option_text,
            // Only expose 'is_correct' if the request requires it (e.g. for owner or practice mode)
            'is_correct' => $this->when($request->routeIs('*.edit') || $request->user()?->role === 'admin' || $request->user()?->id === $this->question->quiz->user_id || $request->attributes->get('is_practice_mode') === true, $this->is_correct),
            'order' => $this->order,
        ];
    }
}
