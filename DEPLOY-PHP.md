# Дез-Комфорт — Вариант A (PHP + nginx) пошагово

Сервер: Ubuntu 22.04 / Debian 12, root-доступ по SSH. Каждый шаг проверяем командой.

## Шаг 0. Подключение к серверу
```bash
ssh root@ВАШ_IP          # пароль от панели облачного провайдера
# или с ключом: ssh -i ~/.ssh/id_ed25519 root@ВАШ_IP
```

## Шаг 1. Обновление системы и базовые утилиты
```bash
apt update && apt upgrade -y
apt install -y curl git unzip ufw
```

## Шаг 2. Установка nginx + PHP-FPM + SQLite
```bash
apt install -y nginx php8.1-fpm php8.1-sqlite3 php8.1-mbstring php8.1-curl
systemctl enable --now php8.1-fpm nginx
php -m | grep -E 'sqlite|mbstring|curl'   # должны быть все три модуля
```
(если PHP 8.1 недоступен в вашем репозитории — `add-apt-repository ppa:ondrej/php`, либо поставьте php8.2 и дальше везде меняйте 8.1 → 8.2)

## Шаг 3. Клонирование сайта
```bash
git clone https://github.com/egor1488zzz/qwen_site.git /var/www/dez
cp /var/www/dez/backend/api.php /var/www/dez/api.php
```

## Шаг 4. Настройка api.php (открыть nano /var/www/dez/api.php, блок «НАСТРОЙТЕ ЭТИ ЗНАЧЕНИЯ»)
```php
define('ADMIN_TOKEN', 'придумайте-длинную-секретную-строку'); // для выгрузки CSV
define('TELEGRAM_BOT_TOKEN', '123456789:AA...');              // см. Шаг 4.1
define('TELEGRAM_CHAT_ID', '-1001234567890');                 // см. Шаг 4.1
define('CRM_WEBHOOK', '');                                    // пусто = выкл
```
Сохранить: Ctrl+O, Enter, Ctrl+X.

### 4.1 Как получить Telegram-токены (5 минут)
1. В Telegram напишите боту @BotFather → `/newbot` → имя и username бота → получите **BOT_TOKEN**.
2. Создайте группу/канал «Заявки Дез-Комфорт», добавьте туда бота.
3. Отправьте в группу любое сообщение, затем откройте в браузере:
   `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
4. В ответе найдите `"chat":{"id":-100XXXXXXXXXX}` — это **CHAT_ID** (для групп всегда отрицательный).

### 4.2 amoCRM/Bitrix24 (опционально)
amoCRM: настройки → вебхуки → создать входящий вебхук на событие «создание сделки», URL вклеить в CRM_WEBHOOK. Пока можно оставить ''.

## Шаг 5. Права доступа (важно: папка должна быть записываема для SQLite)
```bash
chown -R www-data:www-data /var/www/dez
chmod -R 755 /var/www/dez
chmod 775 /var/www/dez        # чтобы PHP создал leads.db в корне сайта
```

## Шаг 6. Конфиг nginx
Создайте файл `nano /etc/nginx/sites-available/dez`:
```nginx
server {
    listen 80;
    server_name dez-komfort.ru www.dez-komfort.ru;   # домен А-записью на IP, или просто _ для IP
    root /var/www/dez;
    index index.html;

    charset utf-8;

    location / {
        try_files $uri $uri/ =404;
    }

    # PHP-бэкенд заявок
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
    }

    # Защита: база заявок и скрытые файлы недоступны извне
    location ~ /(\.ht|leads\.db|backend/) { deny all; }

    # Сжатие и кеши статики
    gzip on; gzip_types text/css application/javascript image/svg+xml;
    location ~* \.(css|js|svg|woff2)$ { expires 7d; add_header Cache-Control "public"; }
}
```
Включить сайт:
```bash
ln -s /etc/nginx/sites-available/dez /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## Шаг 7. firewall + проверка в браузере
```bash
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
curl -I http://ВАШ_IP/            # HTTP/1.1 200 OK
```

## Шаг 8. Домен и бесплатный HTTPS
1. У регистратора (reg.ru и т.п.) поставьте **А-запись** домена на IP сервера (и www → тот же IP). Подождите 10–30 мин: `ping ваш-домен` должен показать IP сервера.
2. ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d dez-komfort.ru -d www.dez-komfort.ru
   # выбрать Redirect — чтобы всё вело на https
   ```
3. Автопродление работает само; проверка: `certbot renew --dry-run`.

## Шаг 9. Переключение сайта на живой приём заявок
Отредактируйте на сервере `nano /var/www/dez/js/config.js`:
```js
leadMode: 'endpoint',
leadEndpoint: '/api.php',
siteUrl: 'https://dez-komfort.ru'     // новый домен для canonical/og
```
(или правьте в GitHub и делайте `cd /var/www/dez && git pull`)

⚠ Если правили напрямую на сервере — не делайте `git pull` без `git stash`, иначе локальные изменения конфликтуют. Правильно: коммитьте config.js в репозиторий после переключения.

## Шаг 10. Финальная проверка
```bash
# заявка через API:
curl -X POST https://dez-komfort.ru/api.php \
  -H 'Content-Type: application/json' \
  -d '{"name":"Тест","phone":"+79990000000","city":"Москва","service":"Клопы"}'
# ожидаем {"ok":true,...} и сообщение в Telegram-группе

# выгрузка заявок CSV в браузере:
https://dez-komfort.ru/api.php?token=ВАШ_ADMIN_TOKEN&export=csv
```
Затем откройте сайт, отправьте форму заявки — должно прийти уведомление в Telegram, запись появиться в leads.db.

## Обновление сайта в будущем
```bash
cd /var/www/dez && git pull
```
(api.php лежит в корне прод-копии отдельной копией — после pull обновляйте его: `cp backend/api.php api.php`, если менялся.)

## Типичные проблемы
| Симптом | Причина / решение |
|---|---|
| 502 Bad Gateway при POST /api.php | Не запущен php8.1-fpm: `systemctl status php8.1-fpm`; проверьте путь sock в конфиге |
| «unable to open database file» | Нет прав на запись: `chown -R www-data:www-data /var/www/dez` |
| Заявки идут, Telegram молчит | Ошиблись CHAT_ID (он отрицательный для групп); проверьте getUpdates |
| CORS-ошибка в консоли браузера | api.php уже отдаёт Access-Control-Allow-Origin; убедитесь, что фронт стучится именно на /api.php вашего домена |
| Сертификат не выпускается | Домен ещё не указывает на IP — проверьте `dig ваш-домен` |
