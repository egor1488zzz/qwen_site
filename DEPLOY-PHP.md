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
apt install -y nginx php8.3-fpm php8.3-sqlite3 php8.3-mbstring php8.3-curl
systemctl enable --now php8.3-fpm nginx
php -m | grep -E 'sqlite|mbstring|curl'   # должны быть все три модуля
```
(В Ubuntu 24.04 PHP 8.3 доступен из коробки — ничего добавлять не нужно. Если у вас другая версия — посмотрите `php -v` и подставьте её номер везде.)

## Шаг 3. Клонирование сайта
```bash
git clone https://github.com/egor1488zzz/qwen_site.git /var/www/dez
cp /var/www/dez/backend/api.php /var/www/dez/api.php
```

## Шаг 4. Настройка api.php — ✅ УЖЕ СДЕЛАНА ЗА ВАС в репозитории

В файле `backend/api.php` уже проставлен рабочий ADMIN_TOKEN (секретная строка) и все
константы читаются из переменных окружения с приоритетом: env → значение в файле.
**Ничего редактировать в nano не нужно.** Достаточно задать Telegram-переменные (Шаг 4.1):

```bash
# на сервере, один раз:
cat >> /etc/php/8.3/fpm/pool.d/www.conf <<'EOF'
env[DEZ_TG_BOT_TOKEN]=123456789:AA...ваш_токен
env[DEZ_TG_CHAT_ID]=-1001234567890
EOF
systemctl restart php8.3-fpm
```
(или просто впишите значения вместо '' в блоке НАСТРОЙКИ файла backend/api.php перед `cp`)

Старый вариант ручной правки (если хотите через nano):
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

## Шаг 6. Конфиг nginx — пошагово, с проверками

### 6.1 Узнаём точную версию PHP (важно: путь sock должен совпадать!)
```bash
php -v                       # например "PHP 8.3.2-1ubuntu2" → версия 8.3
ls /run/php/                 # должен показать php8.3-fpm.sock — запомните имя файла
```
Если там, скажем, `php8.2-fpm.sock` — везде ниже в конфиге используйте 8.2.

### 6.2 Создаём конфиг сайта
Откройте редактор (одна команда, файл создастся сам):
```bash
nano /etc/nginx/sites-available/dez
```
Вставка текста в nano: правой кнопкой мыши (или Ctrl+Shift+V в терминале).
Аккуратно вставьте ВЕСЬ блок ниже — от `server {` до последнего `}`.
Кавычки должны быть прямыми `"`, не «ёлочками» (не копируйте из мессенджеров!).
Сохранение: **Ctrl+O → Enter**, выход: **Ctrl+X**.

```nginx
server {
    listen 80;
    server_name dez-komfort.ru www.dez-komfort.ru;   # ваш домен; если домена ещё нет — напишите просто: _
    root /var/www/dez;
    index index.html;

    charset utf-8;

    location / {
        try_files $uri $uri/ =404;
    }

    # PHP-бэкенд заявок (версия в пути sock = из шага 6.1)
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    # Защита: база заявок и исходники бэкенда недоступны извне
    location ~ /(\.ht|leads\.db|backend/) { deny all; }

    # Сжатие и кеширование статики
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
    location ~* \.(css|js|svg|woff2)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

### 6.3 Проверяем синтаксис ДО включения
```bash
nginx -t
```
Ожидаем:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```
Если ошибка — nginx укажет файл и строку (например `unknown directive` или `unexpected "}"`). Частые причины: лишняя/недостающая `{ }`, пропущена `;` в конце строки, кириллические кавычки. Исправьте в nano и повторите `nginx -t`.

### 6.4 Включаем сайт (символьная ссылка) и убираем дефолт
```bash
ln -sf /etc/nginx/sites-available/dez /etc/nginx/sites-enabled/dez
rm -f /etc/nginx/sites-enabled/default
ls -l /etc/nginx/sites-enabled/     # должна быть толькоdez -> .../sites-available/dez
systemctl reload nginx
```
Перезагрузка без даунтайма — именно `reload` (не `restart`). Если `reload` не помог после правок — `systemctl restart nginx`.

### 6.5 Быстрая проверка результата
```bash
curl -I http://localhost/                    # ожидаем HTTP/1.1 200 OK
curl -I http://localhost/api.php             # 200 или 405 — значит PHP работает (502 = см. таблицу проблем)
curl -I http://localhost/backend/            # ожидаем 403 Forbidden — защита сработала
```
Если localhost отдаёт 200, а по IP из браузера — нет, это firewall (Шаг 7), а не nginx.

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

## Шаг 9. Переключение сайта на живой приём заявок — ✅ почти не нужен

leadMode='endpoint' и leadEndpoint='/api.php' уже стоят в config.js в репозитории —
на вашем домене заявки работают сразу после деплоя, менять ничего не нужно.

Одна опция по желанию: если хотите, чтобы заявки с GitHub Pages (egor1488zzz.github.io)
тоже падали на серверный api.php, отредактируйте в GitHub файл js/config.js (иконка карандаша):
```js
serverApi: 'https://dez-komfort.ru',   // адрес вашего сервера
siteUrl: 'https://dez-komfort.ru'      // новый домен для canonical/og
```
Затем на сервере: `cd /var/www/dez && git pull`.
Сайт сам проверит доступность бэкенда; если его нет — автоматически переключится
на Telegram (при заполненном botToken) или demo, форма ни у кого не сломается.

⚠ Если правили файлы напрямую на сервере — не делайте `git pull` без `git stash`, иначе локальные изменения конфликтуют. Правильно: коммитьте через GitHub и тяните pull.

## Шаг 10. Финальная проверка
```bash
# заявка через API:
curl -X POST https://dez-komfort.ru/api.php \
  -H 'Content-Type: application/json' \
  -d '{"name":"Тест","phone":"+79990000000","city":"Москва","service":"Клопы"}'
# ожидаем {"ok":true,...} и сообщение в Telegram-группе

# выгрузка заявок CSV в браузере:
https://dez-komfort.ru/api.php?token=3e3c7b9025185287c677aa07e82259c5fb33190fb168eced&export=csv
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
| 502 Bad Gateway при POST /api.php | Не запущен php8.3-fpm: `systemctl status php8.3-fpm`; проверьте путь sock в конфиге |
| «unable to open database file» | Нет прав на запись: `chown -R www-data:www-data /var/www/dez` |
| Заявки идут, Telegram молчит | Ошиблись CHAT_ID (он отрицательный для групп); проверьте getUpdates |
| CORS-ошибка в консоли браузера | api.php уже отдаёт Access-Control-Allow-Origin; убедитесь, что фронт стучится именно на /api.php вашего домена |
| Сертификат не выпускается | Домен ещё не указывает на IP — проверьте `dig ваш-домен` |
