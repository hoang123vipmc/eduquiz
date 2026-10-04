<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::prefix('v1')->group(function () {
    // ── Rate limit: 120 attempts per minute per IP on auth (chịu tải tốt cho phòng thi / mạng dùng chung IP) ──
    Route::middleware('throttle:120,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login',    [AuthController::class, 'login']);
    });

    // OAuth
    Route::get('/auth/redirect/{provider}', [\App\Http\Controllers\SocialiteController::class, 'redirect']);
    Route::get('/auth/callback/{provider}', [\App\Http\Controllers\SocialiteController::class, 'callback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/user', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => $request->user()
            ]);
        });
        
        Route::get('/user/stats', [\App\Http\Controllers\UserController::class, 'stats']);
        Route::get('/user/history', [\App\Http\Controllers\UserController::class, 'history']);
        Route::put('/user/profile', [\App\Http\Controllers\UserController::class, 'updateProfile']);
        Route::put('/user/password', [\App\Http\Controllers\UserController::class, 'changePassword']);

        // Giới hạn tốc độ upload ảnh: 30 lần/phút để chống spam lưu trữ
        Route::middleware('throttle:30,1')->group(function () {
            Route::post('/upload/image', [\App\Http\Controllers\UploadController::class, 'uploadImage']);
        });
        
        Route::get('/bank/questions', [\App\Http\Controllers\QuestionController::class, 'bank']);
        Route::get('/leaderboard', [\App\Http\Controllers\LeaderboardController::class, 'index']);
        
        // Sổ tay câu hỏi khó & Đánh dấu (Bookmarks)
        Route::get('/bookmarks', [\App\Http\Controllers\BookmarkController::class, 'index']);
        Route::get('/bookmarks/ids', [\App\Http\Controllers\BookmarkController::class, 'getBookmarkedIds']);
        Route::post('/bookmarks/toggle', [\App\Http\Controllers\BookmarkController::class, 'toggle']);
        Route::put('/bookmarks/{id}/note', [\App\Http\Controllers\BookmarkController::class, 'updateNote']);
        Route::delete('/bookmarks/{id}', [\App\Http\Controllers\BookmarkController::class, 'destroy']);
        
        // Quản lý danh mục (Admin)
        Route::post('/categories', [\App\Http\Controllers\CategoryController::class, 'store'])->middleware('role:admin');
        
        // Quản lý đề thi
        Route::post('/quizzes', [\App\Http\Controllers\QuizController::class, 'store']);
        Route::put('/quizzes/{id}', [\App\Http\Controllers\QuizController::class, 'update']);
        Route::delete('/quizzes/{id}', [\App\Http\Controllers\QuizController::class, 'destroy']);

        // Giới hạn tốc độ import: 10 lần/phút (tốn nhiều CPU parse text)
        Route::middleware('throttle:10,1')->group(function () {
            Route::post('/quizzes/extract-docx', [\App\Http\Controllers\QuizImportController::class, 'extractDocx']);
            Route::post('/quizzes/import-text', [\App\Http\Controllers\QuizImportController::class, 'importText']);
        });
        
        // Quản lý câu hỏi
        Route::post('/quizzes/{quiz}/questions', [\App\Http\Controllers\QuestionController::class, 'store']);
        Route::put('/questions/{id}', [\App\Http\Controllers\QuestionController::class, 'update']);
        Route::delete('/questions/{id}', [\App\Http\Controllers\QuestionController::class, 'destroy']);
        
        // Thi & Chấm điểm
        Route::post('/attempts/start', [\App\Http\Controllers\AttemptController::class, 'start']);
        Route::get('/attempts/{id}/resume', [\App\Http\Controllers\AttemptController::class, 'resume']);
        // Giới hạn lưu đáp án: 120 lần/phút (mỗi câu hỏi lưu 1 lần - đủ cho bài thi 100 câu)
        Route::middleware('throttle:120,1')->group(function () {
            Route::post('/attempts/{id}/answer', [\App\Http\Controllers\AttemptController::class, 'saveAnswer']);
        });
        Route::post('/attempts/{id}/submit', [\App\Http\Controllers\AttemptController::class, 'submit']);
        Route::post('/attempts/{id}/retry-wrong', [\App\Http\Controllers\AttemptController::class, 'retryWrong']);
        Route::post('/attempts/{id}/clear-wrong', [\App\Http\Controllers\AttemptController::class, 'clearWrong']);
        Route::get('/results/{id}', [\App\Http\Controllers\AttemptController::class, 'result']);

        // ── Admin routes ──────────────────────────────────────────────
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('/overview',                       [\App\Http\Controllers\AdminController::class, 'overview']);
            Route::get('/users',                          [\App\Http\Controllers\AdminController::class, 'users']);
            Route::get('/users/{id}',                     [\App\Http\Controllers\AdminController::class, 'userDetail']);
            Route::patch('/users/{id}/toggle-ban',        [\App\Http\Controllers\AdminController::class, 'toggleBan']);
            Route::patch('/users/{id}/role',              [\App\Http\Controllers\AdminController::class, 'changeRole']);
            Route::post('/users/{id}/reset-password',     [\App\Http\Controllers\AdminController::class, 'resetPassword']);
            Route::delete('/users/{id}',                  [\App\Http\Controllers\AdminController::class, 'deleteUser']);
        });
    });
    
    // API Public (Không cần đăng nhập - Giới hạn 60 req/phút chống cào dữ liệu và DoS)
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
        Route::get('/quizzes', [\App\Http\Controllers\QuizController::class, 'index']);
        Route::get('/quizzes/{slug}', [\App\Http\Controllers\QuizController::class, 'show']);
        Route::get('/quizzes/{quiz}/questions', [\App\Http\Controllers\QuestionController::class, 'index']);
    });

    // Tra cứu lịch thi tới cổng trường HUBT - Giới hạn 20 req/phút chống DoS và chống bị trường chặn IP
    Route::middleware('throttle:20,1')->group(function () {
        Route::get('/exam-schedule/lookup', [\App\Http\Controllers\ExamScheduleController::class, 'lookup']);
    });
});
