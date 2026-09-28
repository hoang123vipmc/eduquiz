<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->longText('avatar')->nullable()->change();
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->longText('cover_image')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar', 2048)->nullable()->change();
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->string('cover_image', 2048)->nullable()->change();
        });
    }
};
