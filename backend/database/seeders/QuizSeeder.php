<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\Option;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tạo Danh mục
        $itCategory = Category::create([
            'name' => 'Công nghệ thông tin',
            'slug' => 'cong-nghe-thong-tin',
            'description' => 'Các đề thi chuyên ngành IT',
            'icon' => 'laptop'
        ]);

        $englishCategory = Category::create([
            'name' => 'Tiếng Anh',
            'slug' => 'tieng-anh',
            'description' => 'Kiểm tra trình độ tiếng Anh',
            'icon' => 'globe'
        ]);

        // 2. Tạo Đề thi ReactJS
        $reactQuiz = Quiz::create([
            'user_id' => 1,
            'category_id' => $itCategory->id,
            'title' => 'Đề thi trắc nghiệm ReactJS cơ bản',
            'slug' => 'de-thi-trac-nghiem-reactjs-co-ban',
            'description' => 'Kiểm tra kiến thức cơ bản về ReactJS, Hooks và Components.',
            'duration_minutes' => 15,
            'total_questions' => 5,
            'passing_score' => 50,
            'status' => 'published',
            'visibility' => 'public',
        ]);

        $reactQuestions = [
            [
                'q' => 'ReactJS là gì?',
                'options' => [
                    ['text' => 'Một framework CSS', 'is_correct' => false],
                    ['text' => 'Một thư viện JavaScript để xây dựng giao diện người dùng', 'is_correct' => true],
                    ['text' => 'Một ngôn ngữ lập trình', 'is_correct' => false],
                    ['text' => 'Một cơ sở dữ liệu', 'is_correct' => false],
                ]
            ],
            [
                'q' => 'Hook nào được sử dụng để quản lý state trong functional component?',
                'options' => [
                    ['text' => 'useEffect', 'is_correct' => false],
                    ['text' => 'useContext', 'is_correct' => false],
                    ['text' => 'useState', 'is_correct' => true],
                    ['text' => 'useReducer', 'is_correct' => false],
                ]
            ],
            [
                'q' => 'Thuộc tính "key" trong danh sách React dùng để làm gì?',
                'options' => [
                    ['text' => 'Tạo kiểu CSS cho các phần tử', 'is_correct' => false],
                    ['text' => 'Định danh duy nhất giúp React cập nhật DOM hiệu quả', 'is_correct' => true],
                    ['text' => 'Truyền dữ liệu giữa các component', 'is_correct' => false],
                    ['text' => 'Bảo mật dữ liệu danh sách', 'is_correct' => false],
                ]
            ],
            [
                'q' => 'JSX trong React có nghĩa là gì?',
                'options' => [
                    ['text' => 'JavaScript XML', 'is_correct' => true],
                    ['text' => 'Java Standard XML', 'is_correct' => false],
                    ['text' => 'JavaScript Extension', 'is_correct' => false],
                    ['text' => 'JSON Syntax Extension', 'is_correct' => false],
                ]
            ],
            [
                'q' => 'Làm thế nào để truyền dữ liệu từ Component cha xuống Component con?',
                'options' => [
                    ['text' => 'Sử dụng State', 'is_correct' => false],
                    ['text' => 'Sử dụng Props', 'is_correct' => true],
                    ['text' => 'Sử dụng Redux', 'is_correct' => false],
                    ['text' => 'Sử dụng Context API', 'is_correct' => false],
                ]
            ]
        ];

        foreach ($reactQuestions as $index => $item) {
            $question = Question::create([
                'quiz_id' => $reactQuiz->id,
                'question_text' => $item['q'],
                'type' => 'single_choice',
                'points' => 20, // 5 câu, mỗi câu 20 điểm
                'order' => $index + 1
            ]);

            foreach ($item['options'] as $optIdx => $opt) {
                Option::create([
                    'question_id' => $question->id,
                    'option_text' => $opt['text'],
                    'is_correct' => $opt['is_correct'],
                    'order' => $optIdx + 1
                ]);
            }
        }

        // 3. Tạo Đề thi Tiếng Anh
        $englishQuiz = Quiz::create([
            'user_id' => 1,
            'category_id' => $englishCategory->id,
            'title' => 'Kiểm tra từ vựng Tiếng Anh - Level A2',
            'slug' => 'kiem-tra-tu-vung-tieng-anh-level-a2',
            'description' => 'Bài test nhanh từ vựng trình độ A2.',
            'duration_minutes' => 10,
            'total_questions' => 3,
            'passing_score' => 60,
            'status' => 'published',
            'visibility' => 'public',
        ]);

        $englishQuestions = [
            [
                'q' => 'What is the synonym of "Happy"?',
                'options' => [
                    ['text' => 'Sad', 'is_correct' => false],
                    ['text' => 'Angry', 'is_correct' => false],
                    ['text' => 'Joyful', 'is_correct' => true],
                    ['text' => 'Tired', 'is_correct' => false],
                ]
            ],
            [
                'q' => 'She ___ to the market yesterday.',
                'options' => [
                    ['text' => 'go', 'is_correct' => false],
                    ['text' => 'goes', 'is_correct' => false],
                    ['text' => 'went', 'is_correct' => true],
                    ['text' => 'going', 'is_correct' => false],
                ]
            ],
            [
                'q' => 'Translate to Vietnamese: "Beautiful"',
                'options' => [
                    ['text' => 'Xấu xí', 'is_correct' => false],
                    ['text' => 'Tuyệt vời', 'is_correct' => false],
                    ['text' => 'Thông minh', 'is_correct' => false],
                    ['text' => 'Xinh đẹp', 'is_correct' => true],
                ]
            ]
        ];

        foreach ($englishQuestions as $index => $item) {
            $question = Question::create([
                'quiz_id' => $englishQuiz->id,
                'question_text' => $item['q'],
                'type' => 'single_choice',
                'points' => 33.33,
                'order' => $index + 1
            ]);

            foreach ($item['options'] as $optIdx => $opt) {
                Option::create([
                    'question_id' => $question->id,
                    'option_text' => $opt['text'],
                    'is_correct' => $opt['is_correct'],
                    'order' => $optIdx + 1
                ]);
            }
        }
    }
}
