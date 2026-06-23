<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\Option;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use ZipArchive;

class QuizImportController extends Controller
{
    public function extractDocx(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
        ]);

        $file = $request->file('file');
        
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) === true) {
            $index = $zip->locateName('word/document.xml');
            if ($index !== false) {
                $xml = $zip->getFromIndex($index);
                $zip->close();
            } else {
                $zip->close();
                return response()->json(['success' => false, 'message' => 'File không đúng định dạng Word.'], 400);
            }
        } else {
            return response()->json(['success' => false, 'message' => 'Không thể mở file.'], 400);
        }

        // Thay thẻ </w:p> bằng \n để giữ xuống dòng
        $xml = str_replace('</w:p>', "\n", $xml);
        $text = strip_tags($xml);
        
        // Loại bỏ các khoảng trắng thừa ở mỗi dòng
        $lines = explode("\n", $text);
        $cleanText = collect($lines)->map(fn($l) => trim($l))->filter(fn($l) => $l !== '')->implode("\n\n");
        
        return response()->json([
            'success' => true,
            'text' => $text // Trả về text gốc nhưng giữ dòng trống để chỉnh sửa
        ]);
    }

    public function importText(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'text' => 'required|string',
            'category_id' => 'nullable|integer|exists:categories,id'
        ]);

        $text = $request->text;
        $lines = explode("\n", $text);
        
        $questionsData = [];
        $currentQuestion = null;
        $expectingNewQuestion = true;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                if ($currentQuestion && count($currentQuestion['options']) > 0) {
                    $questionsData[] = $currentQuestion;
                    $currentQuestion = null;
                }
                $expectingNewQuestion = true;
                continue;
            }

            if ($expectingNewQuestion) {
                // Đây chắc chắn là câu hỏi
                if ($currentQuestion && count($currentQuestion['options']) > 0) {
                    $questionsData[] = $currentQuestion;
                }
                $currentQuestion = [
                    'q' => $line,
                    'options' => []
                ];
                $expectingNewQuestion = false;
                continue;
            }

            // Nếu không phải là dòng đầu tiên của câu hỏi mới, kiểm tra xem có phải option không
            $isCorrectOption = str_starts_with($line, '*');
            // Regex mới: Hỗ trợ " E .INT" (khoảng trắng giữa chữ cái và dấu chấm)
            $isOption = $isCorrectOption || preg_match('/^[A-E]\s*[\.\)\-]/i', $line) || preg_match('/^[1-4]\s*[\.\)\-]/', $line);

            if ($isOption) {
                $optText = $line;
                if ($isCorrectOption) {
                    $optText = trim(substr($line, 1));
                }
                
                // Đôi khi đáp án đúng có chữ (Đáp án đúng) ở cuối, ta có thể tự động xoá đi cho đẹp nếu muốn, 
                // nhưng tạm thời cứ giữ nguyên text người dùng nhập.
                $currentQuestion['options'][] = [
                    'text' => $optText,
                    'is_correct' => $isCorrectOption
                ];
            } else {
                // Nếu chưa có option nào, thì đây vẫn là phần mở rộng của nội dung câu hỏi
                if (count($currentQuestion['options']) === 0) {
                    $currentQuestion['q'] .= "\n" . $line;
                } else {
                    // Nếu đã có option mà gặp dòng không phải option (trong cùng 1 block chưa có dòng trống)
                    // Đây có thể là đáp án dài bị xuống dòng hoặc lỗi đánh máy thiếu A. B. C.
                    // => Nối nó vào đáp án cuối cùng thay vì tách thành câu hỏi mới!
                    $lastIdx = count($currentQuestion['options']) - 1;
                    $currentQuestion['options'][$lastIdx]['text'] .= "\n" . $line;
                }
            }
        }
        
        if ($currentQuestion && count($currentQuestion['options']) > 0) {
            $questionsData[] = $currentQuestion;
        }

        if (empty($questionsData)) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy câu hỏi nào hợp lệ.'], 400);
        }

        DB::beginTransaction();
        try {
            $quiz = Quiz::create([
                'user_id' => $request->user()->id,
                'category_id' => $request->category_id,
                'title' => $request->title,
                'slug' => Str::slug($request->title) . '-' . time(),
                'description' => 'Được tạo từ văn bản nhập nhanh.',
                'duration_minutes' => 60,
                'total_questions' => count($questionsData),
                'passing_score' => 50,
                'status' => 'published',
                'visibility' => 'public',
            ]);

            foreach ($questionsData as $qIdx => $qData) {
                $question = Question::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $qData['q'],
                    'type' => 'single_choice',
                    'points' => 1,
                    'order' => $qIdx + 1
                ]);

                foreach ($qData['options'] as $oIdx => $opt) {
                    Option::create([
                        'question_id' => $question->id,
                        'option_text' => $opt['text'],
                        'is_correct' => $opt['is_correct'],
                        'order' => $oIdx + 1
                    ]);
                }
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo đề thi thành công',
                'data' => $quiz
            ]);
        } catch (\Throwable $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            Log::error("QuizImportController Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }
}
