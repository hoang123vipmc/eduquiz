<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Dọn dẹp dữ liệu trùng lặp trong bảng results (nếu có do race condition cũ)
        $duplicateAttempts = DB::table('results')
            ->select('attempt_id')
            ->groupBy('attempt_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('attempt_id');

        foreach ($duplicateAttempts as $attId) {
            $keepId = DB::table('results')->where('attempt_id', $attId)->max('id');
            DB::table('results')->where('attempt_id', $attId)->where('id', '!=', $keepId)->delete();
        }

        // 2. Dọn dẹp câu trả lời trùng lặp trong user_answers
        $duplicateAnswers = DB::table('user_answers')
            ->select('attempt_id', 'question_id')
            ->groupBy('attempt_id', 'question_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicateAnswers as $dup) {
            $keepId = DB::table('user_answers')
                ->where('attempt_id', $dup->attempt_id)
                ->where('question_id', $dup->question_id)
                ->max('id');
            DB::table('user_answers')
                ->where('attempt_id', $dup->attempt_id)
                ->where('question_id', $dup->question_id)
                ->where('id', '!=', $keepId)
                ->delete();
        }

        // 3. Thêm Unique constraint cho results.attempt_id
        Schema::table('results', function (Blueprint $table) {
            $table->unique('attempt_id');
        });

        // 4. Thêm Unique constraint cho user_answers (attempt_id, question_id)
        Schema::table('user_answers', function (Blueprint $table) {
            $table->unique(['attempt_id', 'question_id']);
        });

        // 5. Thêm composite index tối ưu hóa truy vấn danh sách đề thi khi nhiều người cùng duyệt
        Schema::table('quizzes', function (Blueprint $table) {
            $table->index(['status', 'visibility']);
        });

        // 6. Thêm index cho quiz_attempts theo user và status
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {
            $table->dropUnique(['attempt_id']);
        });

        Schema::table('user_answers', function (Blueprint $table) {
            $table->dropUnique(['attempt_id', 'question_id']);
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropIndex(['status', 'visibility']);
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });
    }
};
