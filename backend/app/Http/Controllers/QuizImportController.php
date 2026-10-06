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
            'file' => [
                'required',
                'file',
                'max:10240', // max 10MB
                function ($attribute, $value, $fail) {
                    // ── Security: Strict MIME type check, not trusting client Content-Type ──
                    $realMime = mime_content_type($value->getRealPath());
                    $allowed  = [
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/zip', // .docx is a zip
                        'application/octet-stream',
                    ];
                    if (!in_array($realMime, $allowed)) {
                        $fail('File phải là định dạng Word (.docx).');
                    }
                    // Also check extension
                    if (strtolower($value->getClientOriginalExtension()) !== 'docx') {
                        $fail('Chỉ chấp nhận file .docx.');
                    }
                },
            ],
        ]);

        $file = $request->file('file');
        
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) !== true) {
            return response()->json(['success' => false, 'message' => 'Không thể mở file.'], 400);
        }

        $docIndex = $zip->locateName('word/document.xml');
        if ($docIndex === false) {
            $zip->close();
            return response()->json(['success' => false, 'message' => 'File không đúng định dạng Word.'], 400);
        }
        $xml = $zip->getFromIndex($docIndex);

        // ── 1. Đọc relationships để tìm ánh xạ hình ảnh (rId => path trong zip) ──
        $rels = [];
        $relsXml = $zip->getFromName('word/_rels/document.xml.rels');
        if ($relsXml) {
            if (preg_match_all('/<Relationship\s+[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/i', $relsXml, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $m) {
                    $rels[$m[1]] = $m[2];
                }
            }
        }

        // ── 2. Trích xuất hình ảnh ra thư mục public/uploads ──
        $destinationPath = public_path('uploads');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $baseUrl = rtrim(config('app.url'), '/');
        if (str_contains($baseUrl, 'localhost') && $request->getSchemeAndHttpHost()) {
            $baseUrl = $request->getSchemeAndHttpHost();
        }

        $allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        $extractedImages = []; // rId => public_url

        foreach ($rels as $rId => $target) {
            $zipTarget = ltrim($target, '/');
            if (!str_starts_with($zipTarget, 'word/')) {
                $zipTarget = 'word/' . ltrim($zipTarget, './');
            }

            $ext = strtolower(pathinfo($zipTarget, PATHINFO_EXTENSION));
            if (in_array($ext, $allowedExtensions)) {
                $imgContent = $zip->getFromName($zipTarget);
                if ($imgContent !== false && strlen($imgContent) > 0 && strlen($imgContent) <= 10 * 1024 * 1024) {
                    $uniqueName = 'docx_img_' . Str::random(20) . '_' . time() . '.' . $ext;
                    file_put_contents($destinationPath . '/' . $uniqueName, $imgContent);
                    $extractedImages[$rId] = $baseUrl . '/uploads/' . $uniqueName;
                }
            }
        }

        $zip->close();

        // ── 3. Thay thế các thẻ hình ảnh trong document.xml bằng marker [IMAGE: url] ──
        $xml = preg_replace_callback(
            '/<(?:a:blip|v:imagedata)[^>]*(?:r:embed|r:id|o:relid)="([^"]+)"[^>]*\/?>/i',
            function ($m) use ($extractedImages) {
                $rId = $m[1];
                if (isset($extractedImages[$rId])) {
                    return "\n[IMAGE: " . $extractedImages[$rId] . "]\n";
                }
                return '';
            },
            $xml
        );

        // Thay thẻ </w:p> và </w:tr> bằng \n để giữ xuống dòng
        $xml = str_replace(['</w:p>', '</w:tr>'], "\n", $xml);
        $text = strip_tags($xml);
        
        return response()->json([
            'success' => true,
            'text' => $text
        ]);
    }

    public function importText(Request $request)
    {
        $request->validate([
            'title'         => 'required|string|max:255',
            'text'          => 'required|string|max:200000', // max ~200KB text
            'category_id'   => 'nullable|integer|exists:categories,id',
            'category_name' => 'nullable|string|max:255',
            'cover_image'   => 'nullable|string',
            'description'   => 'nullable|string|max:1000',
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

            // Nhận diện dòng độc lập chứa ảnh: [IMAGE: url] hoặc [Ảnh: url] hoặc ![...](url)
            if (preg_match('/^\[(?:IMAGE|Ảnh|image)\s*[:：]\s*(https?:\/\/[^\]\s]+)\]/iu', $line, $imgMatch)
                || preg_match('/^!\[.*?\]\((https?:\/\/[^\)\s]+)\)/iu', $line, $imgMatch)) {
                if ($currentQuestion) {
                    $currentQuestion['image'] = $imgMatch[1];
                }
                continue;
            }

            // Nhận diện ảnh inline trong dòng: Câu 1: Sơ đồ lớp [IMAGE: url]
            if (preg_match('/\[(?:IMAGE|Ảnh|image)\s*[:：]\s*(https?:\/\/[^\]\s]+)\]/iu', $line, $inlineImgMatch)) {
                if ($currentQuestion) {
                    $currentQuestion['image'] = $inlineImgMatch[1];
                }
                $line = trim(preg_replace('/\[(?:IMAGE|Ảnh|image)\s*[:：]\s*https?:\/\/[^\]\s]+\]/iu', '', $line));
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
                    'options' => [],
                    'image' => null
                ];
                $expectingNewQuestion = false;
                continue;
            }

            // Kiểm tra xem có phải option không
            $isCorrectOption = str_starts_with($line, '*');
            $isOption = $isCorrectOption 
                || preg_match('/^[A-Za-z]\s*[\.\:\)\-]/i', $line) 
                || preg_match('/^[1-6]\s*[\:\)\-]/', $line)
                || preg_match('/^[1-6]\.\s+/', $line);

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

        $baseSlug = Str::slug($request->title);
        if (empty($baseSlug)) {
            $baseSlug = 'quiz';
        }
        $slug = $baseSlug . '-' . Str::lower(Str::random(6)) . '-' . substr(uniqid(), -5);
        while (Quiz::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . Str::lower(Str::random(8)) . '-' . (int)(microtime(true) * 1000);
        }

        $categoryId = $request->category_id;
        if (empty($categoryId) && $request->filled('category_name')) {
            $catName = trim($request->category_name);
            $category = \App\Models\Category::whereRaw('LOWER(name) = ?', [mb_strtolower($catName)])->first();
            if (!$category) {
                $slug = Str::slug($catName);
                if (empty($slug)) $slug = 'danh-muc-' . time();
                $originalSlug = $slug;
                $count = 1;
                while (\App\Models\Category::where('slug', $slug)->exists()) {
                    $slug = $originalSlug . '-' . $count++;
                }
                $category = \App\Models\Category::create([
                    'name' => $catName,
                    'slug' => $slug,
                    'icon' => 'folder',
                    'description' => "Danh mục đề thi {$catName}",
                ]);
                \Illuminate\Support\Facades\Cache::forget('all_categories_list');
            }
            $categoryId = $category->id;
        }

        DB::beginTransaction();
        try {
            $quiz = Quiz::create([
                'user_id' => $request->user()->id,
                'category_id' => $categoryId,
                'title' => $request->title,
                'slug' => $slug,
                'description' => $request->description ?: 'Được tạo từ văn bản nhập nhanh.',
                'cover_image' => $request->cover_image,
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
                    'question_image' => $qData['image'] ?? null,
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

            \Illuminate\Support\Facades\Cache::forget('public_quizzes_default_v1');
            \Illuminate\Support\Facades\Cache::forget("my_quizzes_user_{$request->user()->id}_v1");
            \Illuminate\Support\Facades\Cache::forget('admin_all_quizzes_v1');
            \Illuminate\Support\Facades\Cache::forget('all_categories_list');

            return response()->json([
                'success' => true,
                'message' => 'Tạo đề thi thành công',
                'data' => $quiz->load(['user', 'category'])
            ]);
        } catch (\Throwable $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            Log::error('QuizImportController Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'Lỗi máy chủ. Vui lòng thử lại.'], 500);
        }
    }
}
