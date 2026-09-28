#!/bin/bash
php artisan migrate --force
php artisan storage:link || true
php artisan admin:sync-env
php artisan config:cache

php artisan route:cache
php artisan view:cache
apache2-foreground
