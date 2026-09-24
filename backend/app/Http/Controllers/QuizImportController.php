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

            // Bỏ qua các đường kẻ phân cách dạng --- hoặc ===
            if (preg_match('/^[-=_*]{3,}$/', $line)) {
                continue;
            }

            // Nhận diện dòng chỉ định đáp án đúng (ví dụ: "=> Đáp án đúng: C", "Đáp án: A", "Answer: B")
            if (preg_match('/^(?:=>\s*)?(?:Đáp án(?:\s*đúng)?|Đ\/a|Answer|Key)\s*[:：]\s*([A-Fa-f1-6])/iu', $line, $ansMatch)) {
                if ($currentQuestion && !empty($currentQuestion['options'])) {
                    $letter = strtoupper($ansMatch[1]);
                    $targetIdx = is_numeric($letter) ? ((int)$letter - 1) : (ord($letter) - ord('A'));
                    if (isset($currentQuestion['options'][$targetIdx])) {
                        // Bỏ tick tất cả trước
                        foreach ($currentQuestion['options'] as &$opt) {
                            $opt['is_correct'] = false;
                        }
                        $currentQuestion['options'][$targetIdx]['is_correct'] = true;
                    }
                }
                continue;
            }

            // Kiểm tra xem có phải bắt đầu câu hỏi mới không (Ví dụ: "Câu 1:", "Question 1:", hoặc đang chờ câu mới)
            $isExplicitQuestionHeader = preg_match('/^(?:Câu|Question)\s*\d+\s*[:：\.\)]/iu', $line);

            if ($expectingNewQuestion || ($isExplicitQuestionHeader && $currentQuestion && count($currentQuestion['options']) > 0)) {
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

            // Kiểm tra xem có phải option không
            $isCorrectOption = str_starts_with($line, '*');
            $isOption = $isCorrectOption || preg_match('/^[A-F]\s*[\.\)\-]/i', $line) || preg_match('/^[1-6]\s*[\.\)\-]/', $line);

            if ($isOption) {
                $optText = $line;
                if ($isCorrectOption) {
                    $optText = trim(substr($line, 1));
                }
                
                // Nếu có dấu * nằm sau chữ cái: "A. *Đáp án"
                if (preg_match('/^[A-F1-6]\s*[\.\)\-]\s*\*/i', $optText)) {
                    $isCorrectOption = true;
                    $optText = preg_replace('/^([A-F1-6]\s*[\.\)\-])\s*\*/i', '$1 ', $optText);
                }

                $currentQuestion['options'][] = [
                    'text' => $optText,
                    'is_correct' => $isCorrectOption
                ];
            } else {
                // Nếu chưa có option nào, thì đây vẫn là phần mở rộng của nội dung câu hỏi
                if (count($currentQuestion['options']) === 0) {
                    $currentQuestion['q'] .= "\n" . $line;
                } else {
                    // Nối vào đáp án cuối cùng
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

            $optionsToInsert = [];
            foreach ($questionsData as $qIdx => $qData) {
                $question = Question::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $qData['q'],
                    'type' => 'single_choice',
                    'points' => 1,
                    'order' => $qIdx + 1
                ]);

                foreach ($qData['options'] as $oIdx => $opt) {
                    $optionsToInsert[] = [
                        'question_id' => $question->id,
                        'option_text' => $opt['text'],
                        'is_correct' => $opt['is_correct'] ? true : false,
                        'order' => $oIdx + 1,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }
            }
            
            // Bulk insert Options
            foreach (array_chunk($optionsToInsert, 200) as $chunk) {
                Option::insert($chunk);
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
