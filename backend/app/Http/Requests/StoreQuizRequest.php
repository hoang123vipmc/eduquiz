<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() != null;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'nullable|exists:categories,id',
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:quizzes,slug',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:1',
            'total_questions' => 'required|integer|min:1',
            'visibility' => 'nullable|in:public,private',
            'status' => 'nullable|in:draft,published',
            'shuffle_questions' => 'boolean',
            'shuffle_answers' => 'boolean',
            'allow_review' => 'boolean',
            'passing_score' => 'nullable|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Vui lòng nhập tên đề thi.',
            'slug.required' => 'Vui lòng nhập slug.',
            'slug.unique' => 'Slug này đã tồn tại.',
            'duration_minutes.required' => 'Vui lòng nhập thời gian làm bài.',
            'total_questions.required' => 'Vui lòng nhập số lượng câu hỏi.',
        ];
    }
}
