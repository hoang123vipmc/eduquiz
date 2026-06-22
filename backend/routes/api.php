<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

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
        
        // Quản lý danh mục (Admin)
        Route::post('/categories', [\App\Http\Controllers\CategoryController::class, 'store'])->middleware('role:admin');
        
        // Quản lý đề thi
        Route::post('/quizzes', [\App\Http\Controllers\QuizController::class, 'store']);
        Route::delete('/quizzes/{id}', [\App\Http\Controllers\QuizController::class, 'destroy']);
        Route::post('/quizzes/extract-docx', [\App\Http\Controllers\QuizImportController::class, 'extractDocx']);
        Route::post('/quizzes/import-text', [\App\Http\Controllers\QuizImportController::class, 'importText']);
        
        // Quản lý câu hỏi
        Route::post('/quizzes/{quiz}/questions', [\App\Http\Controllers\QuestionController::class, 'store']);
        
        // Thi & Chấm điểm
        Route::post('/attempts/start', [\App\Http\Controllers\AttemptController::class, 'start']);
        Route::get('/attempts/{id}/resume', [\App\Http\Controllers\AttemptController::class, 'resume']);
        Route::post('/attempts/{id}/answer', [\App\Http\Controllers\AttemptController::class, 'saveAnswer']);
        Route::post('/attempts/{id}/submit', [\App\Http\Controllers\AttemptController::class, 'submit']);
        Route::post('/attempts/{id}/retry-wrong', [\App\Http\Controllers\AttemptController::class, 'retryWrong']);
        Route::post('/attempts/{id}/clear-wrong', [\App\Http\Controllers\AttemptController::class, 'clearWrong']);
        Route::get('/results/{id}', [\App\Http\Controllers\AttemptController::class, 'result']);
    });
    
    // API Public (Không cần đăng nhập)
    Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
    Route::get('/quizzes', [\App\Http\Controllers\QuizController::class, 'index']);
    Route::get('/quizzes/{slug}', [\App\Http\Controllers\QuizController::class, 'show']);
    Route::get('/quizzes/{quiz}/questions', [\App\Http\Controllers\QuestionController::class, 'index']);
});
