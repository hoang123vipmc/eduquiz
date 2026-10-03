<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Quiz;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quiz = Quiz::find($this->route('quiz'));
        return $this->user() && ($this->user()->role === 'admin' || ($quiz && $quiz->user_id === $this->user()->id));
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if (!$this->has('type') && $this->has('question_type')) {
            $merge['type'] = $this->question_type;
        }
        if (!$this->has('type')) {
            $merge['type'] = 'single_choice';
        }
        if (!$this->has('difficulty')) {
            $merge['difficulty'] = 'medium';
        }
        if (!$this->has('points')) {
            $merge['points'] = 1;
        }
        if ($this->has('options') && is_array($this->options)) {
            $opts = $this->options;
            foreach ($opts as &$opt) {
                if (is_array($opt) && isset($opt['text']) && !isset($opt['option_text'])) {
                    $opt['option_text'] = $opt['text'];
                }
            }
            $merge['options'] = $opts;
        }
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'question_text' => 'required|string',
            'question_image' => 'nullable|string',
            'explanation' => 'nullable|string',
            'type' => 'required|in:single_choice,multiple_choice',
            'difficulty' => 'required|in:easy,medium,hard',
            'points' => 'required|integer|min:1',
            'order' => 'integer|min:0',
            'options' => 'required|array|min:2',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
            'options.*.order' => 'integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'question_text.required' => 'Vui lòng nhập nội dung câu hỏi.',
            'options.min' => 'Câu hỏi phải có ít nhất 2 đáp án.',
            'options.*.option_text.required' => 'Nội dung đáp án không được để trống.',
        ];
    }
}
