<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$attempts = \App\Models\QuizAttempt::where('status', 'doing')->get(['id', 'mode']);
echo "Modes:\n";
foreach ($attempts as $a) {
    echo "ID: {$a->id}, Mode: {$a->mode}\n";
}
