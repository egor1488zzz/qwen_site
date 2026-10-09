# Дез-Комфорт — деплой на облачный сервер (Ubuntu 22.04)

## Вариант A: PHP (рекомендуется, минимум ресурсов)
```bash
ssh root@ВАШ_IP
apt update && apt install -y nginx php8.1-fpm php8.1-sqlite3 git certbot python3-certbot-nginx
git clone https://github.com/egor1488zzz/qwen_site.git /var/www/dez
cp /var/www/dez/backend/api.php /var/www/dez/api.php
chown -R www-data:www-data /var/www/dez && chmod 664 /var/www/dez   # папке нужна запись для leads.db
```

`/etc/nginx/sites-available/dez`:
```nginx
server {
    listen 80;
    server_name dez-komfort.ru www.dez-komfort.ru;   # ваш домен или IP
    root /var/www/dez;
    index index.html;
    location ~ \.php$ { include snippets/fastcgi-php.conf; fastcgi_pass unix:/run/php/php8.1-fpm.sock; }
    location ~ /\.ht|leads\.db { deny all; }
}
```
```bash
ln -s /etc/nginx/sites-available/dez /etc/nginx/sites-enabled && rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d dez-komfort.ru          # бесплатный HTTPS
```

Настройка бэкенда — в начале файла `api.php` заполните константы:
`ADMIN_TOKEN` (любая длинная секретная строка), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRM_WEBHOOK`.

В `js/config.js` переключите приём заявок на сервер:
```js
leadMode: 'endpoint',
leadEndpoint: '/api.php'
```
Сделайте коммит и pull на сервере: `cd /var/www/dez && git pull`.

Проверка: `curl -X POST http://ВАШ_IP/api.php -H 'Content-Type: application/json' -d '{"name":"Тест","phone":"+79990000000","city":"Москва","service":"Клопы"}'` → `{"ok":true}`.
Выгрузка заявок CSV: `http://ВАШ_IP/api.php?token=ВАШ_ADMIN_TOKEN&export=csv`

## Вариант B: Node.js
```bash
apt install -y nodejs npm
cd /var/www/dez/backend && npm install express better-sqlite3
DEZ_ADMIN_TOKEN='секрет' TG_BOT_TOKEN='...' TG_CHAT_ID='-100...' pm2 start server.js --name dez-api
```
(для pm2: `npm i -g pm2`). В config.js: `leadMode:'endpoint', leadEndpoint:'http://localhost:3000/api/lead'` — либо проксируйте /api через nginx на порт 3000.

## Быстрые интеграции без сервера
В `js/config.js` можно поставить `leadMode:'telegram'` + токен бота — заявки будут приходить вам в Telegram напрямую с GitHub Pages, сервер не нужен.
