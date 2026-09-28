<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('admin:sync-env', function () {
    $adminEmail = env('ADMIN_EMAIL');
    if (!$adminEmail) {
        $this->info("No ADMIN_EMAIL environment variable set. Skipping.");
        return;
    }

    $user = \App\Models\User::where('email', $adminEmail)->first();
    if ($user) {
        $user->role = 'admin';
        $user->is_banned = false;
        $user->save();
        $this->info("User {$adminEmail} promoted to Admin from ADMIN_EMAIL.");
    } else {
        $this->warn("User with email {$adminEmail} not yet registered in database. It will become Admin automatically upon registration.");
    }
})->purpose('Promote user specified in ADMIN_EMAIL environment variable to Admin');

