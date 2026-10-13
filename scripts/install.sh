#!/bin/bash
cd /backend
apt-get update
apt-get install -y git zip unzip libsqlite3-dev
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php composer.phar require laravel/sanctum laravel/socialite
php artisan migrate
