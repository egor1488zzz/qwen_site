#!/usr/bin/env bash
# Обновление сайта DezComfort на сервере: /var/www/dez
set -e

DIR=/var/www/dez

[ "$(id -u)" = "0" ] || { echo "Запустите через sudo: sudo bash UPDATE.sh"; exit 1; }

git config --global --add safe.directory "$DIR"

cd "$DIR"
git fetch origin main
git reset --hard origin/main   # локальные файлы всегда = свежая версия с GitHub

# api.php лежит в корне сайта (копия из backend/)
cp -f "$DIR/backend/api.php" "$DIR/api.php"

# Права: владелец www-data, каталоги 755, файлы 644, базы заявок writable
chown -R www-data:www-data "$DIR"
find "$DIR" -type d -exec chmod 755 {} \;
find "$DIR" -type f -exec chmod 644 {} \;
chmod 664 "$DIR/leads.db" "$DIR/leads_rate.db" 2>/dev/null || true

# PHP-FPM — найти установленную версию и перезапустить нужную
FPM=$(systemctl list-units --type=service --all | grep -oP 'php[0-9.]+-fpm' | head -1)
if [ -n "$FPM" ]; then
  systemctl restart "$FPM"
  echo "Перезапущен $FPM"
else
  echo "ВНИМАНИЕ: php*-fpm не найден"
fi

if nginx -t; then systemctl reload nginx && echo "nginx перезапущен"; else echo "!! nginx -t: ошибка конфигурации, reload пропущен (чините /etc/nginx)"; fi

echo "OK. Проверка:"
curl -s -X POST http://localhost/api.php -H 'Content-Type: application/json' \
  -d '{"name":"тест-обновление","phone":"000","city":"х","service":"х"}' | head -c 200; echo
