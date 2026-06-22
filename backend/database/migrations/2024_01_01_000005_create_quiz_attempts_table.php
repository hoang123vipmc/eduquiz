<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->enum('mode', ['practice', 'exam']);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('remaining_time')->nullable(); // in seconds
            $table->enum('status', ['doing', 'submitted', 'timeout', 'abandoned'])->default('doing');
            $table->timestamps();
            
            $table->index(['user_id', 'quiz_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};
