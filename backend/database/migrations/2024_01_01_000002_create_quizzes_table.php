<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('cover_image')->nullable();
            $table->integer('duration_minutes');
            $table->integer('total_questions');
            $table->integer('total_attempts')->default(0);
            $table->integer('total_likes')->default(0);
            $table->enum('visibility', ['public', 'private'])->default('private');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('shuffle_answers')->default(false);
            $table->boolean('allow_review')->default(true);
            $table->integer('passing_score')->nullable();
            $table->softDeletes();
            $table->timestamps();
            
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
