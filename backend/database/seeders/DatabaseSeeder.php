<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\User::factory()->create([
            'id' => 1,
            'name' => 'Admin User',
            'email' => 'admin@eduquiz.com',
            'password' => bcrypt('password'),
            'role' => 'admin'
        ]);

        $this->call([
            QuizSeeder::class,
        ]);
    }
}
