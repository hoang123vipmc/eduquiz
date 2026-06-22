<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('quiz_attempts')->cascadeOnDelete();
            $table->decimal('score', 8, 2);
            $table->integer('correct_answers');
            $table->integer('wrong_answers');
            $table->integer('skipped_answers')->default(0);
            $table->decimal('accuracy', 5, 2); // percentage
            $table->integer('time_taken_seconds');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
