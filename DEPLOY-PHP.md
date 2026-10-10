# Вариант A — PHP + nginx (пошагово)

Шаги 0–3 (подключение, установка пакетов, git clone) см. выше в этом файле.
Ниже — подробные шаги 4–10.

## Шаг 4. Настройка бэкенда (api.php)

### 4.1 Скопируйте файл в корень сайта и откройте редактор
```bash
cp /var/www/dez/backend/api.php /var/www/dez/api.php
nano /var/www/dez/api.php
```
(в nano: Ctrl+W — поиск, Ctrl+O + Enter — сохранить, Ctrl+X — выход)

### 4.2 Найдите блок «НАСТРОЙТЕ ЭТИ ЗНАЧЕНИЯ» (строки ~18–21) и заполните 4 константы:

```php
define('ADMIN_TOKEN', 'change-me-strong-token');  // → замените на свой длинный секрет
define('TELEGRAM_BOT_TOKEN', '');                 // → '123456789:AA...' из @BotFather
define('TELEGRAM_CHAT_ID', '');                   // → '-1001234567890' вашей группы
define('CRM_WEBHOOK', '');                        // пока оставьте ''
```

**ADMIN_TOKEN** — придумайте сами, 30+ символов без пробелов. Пример генерации:
```bash
openssl rand -hex 24
```
Скопируйте вывод и вставьте между кавычками. Это пароль от выгрузки заявок:
`https://ваш-домен/api.php?token=ЭТОТ_ТОКЕН&export=csv`

**TELEGRAM_BOT_TOKEN — как получить (5 минут):**
1. В Telegram найдите **@BotFather** → отправьте `/newbot` → введите имя («Дез-Комфорт Заявки») и username («dez_komfort_leads_bot»).
2. BotFather пришлёт токен вида `123456789:AAH4x...` — скопируйте целиком, вставьте в кавычки.

**TELEGRAM_CHAT_ID — как получить:**
1. Создайте группу (можно из одного себя), назовите «Заявки Дез-Комфорт».
2. Добавьте в группу бота из шага выше (через «Добавить участника» → username бота).
3. Отправьте в группу любое сообщение, например «тест».
4. В браузере откройте (подставив свой токен):
   `https://api.telegram.org/bot123456789:AAH4x.../getUpdates`
5. В JSON найдите фрагмент `"chat":{"id":-1001234567890,...}` — число после "id" и есть CHAT_ID. У групп оно ВСЕГДА отрицательное, начинается с -100. Вставьте его в кавычки вместе с минусом.
6. Если getUpdates пустой: удалите вебхук командой
   `curl "https://api.telegram.org/bot<ТОКЕН>/deleteWebhook"` и отправьте сообщение заново.

**CRM_WEBHOOK** — если уже пользуетесь amoCRM/Битрикс24, впишите URL входящего вебхука; иначе ''.

### 4.3 Проверьте синтаксис после правки:
```bash
php -l /var/www/dez/api.php        # должно быть "No syntax errors detected"
```

## Шаг 5. Права доступа (иначе SQLite не сможет создать базу)
```bash
chown -R www-data:www-data /var/www/dez
chmod 775 /var/www/dez
# база leads.db создастся сама при первой заявке — это нормально
```

## Шаг 6. Конфиг nginx
```bash
nano /etc/nginx/sites-available/dez
```
```nginx
server {
    listen 80;
    server_name dez-komfort.ru www.dez-komfort.ru;   # до теста домена можно _
    root /var/www/dez;
    index index.html;
    charset utf-8;

    location / { try_files $uri $uri/ =404; }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;   # версия php как установлена
    }

    # защита базы заявок и исходников бэкенда
    location ~ /(\.ht|leads\.db|backend/) { deny all; }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;
}
```
Активация:
```bash
ln -sf /etc/nginx/sites-available/dez /etc/nginx/sites-enabled/dez
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## Шаг 7. Firewall + первая проверка
```bash
ufw allow OpenSSH; ufw allow 'Nginx Full'; ufw --force enable
curl -I http://localhost/                # ждём HTTP/1.1 200 OK
curl -I http://ВАШ_IP/                   # с вашего компьютера тоже 200
```

## Шаг 8. Домен и бесплатный HTTPS
1. У регистратора: А-запись `@` и `www` → IP сервера. Подождите 10–30 мин, проверьте: `dig +short dez-komfort.ru`.
2. ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d dez-komfort.ru -d www.dez-komfort.ru
   ```
   На вопрос про редирект выберите **2 (Redirect)** — сайт всегда по https.
3. Автопродление работает через systemd-таймер (проверка: `certbot renew --dry-run`).

## Шаг 9. Переключить сайт на живой приём заявок
В репозитории в файле `js/config.js` уже прописан правильный адрес эндпоинта (`/api.php`). Осталось поменять режим:
```bash
sed -i "s/leadMode: 'demo'/leadMode: 'endpoint'/" /var/www/dez/js/config.js
```
Правильнее делать это через GitHub (commit + push), а на сервере:
```bash
cd /var/www/dez && git pull
```
Если правили файлы прямо на сервере и pull ругается: `git stash && git pull`.

Заодно обновите `siteUrl: 'https://dez-komfort.ru'` в config.js (нужно для canonical/шеров).

## Шаг 10. Финальная проверка
```bash
curl -X POST https://dez-komfort.ru/api.php \
  -H 'Content-Type: application/json' \
  -d '{"name":"Тест","phone":"+79990000000","city":"Москва","service":"Клопы"}'
```
Ожидаемый ответ: `{"ok":true,...}`, а в Telegram-группу падает сообщение о заявке.
Заявка также появилась в базе:
```bash
ls -la /var/www/dez/backend/leads.db
```
Выгрузка Excel/CSV: откройте в браузере
`https://dez-komfort.ru/api.php?token=ВАШ_ADMIN_TOKEN&export=csv`

Затем откройте сам сайт, отправьте форму «Заказать звонок» — заявка должна прийти в Telegram.

---
## Типовые проблемы
| Симптом | Причина / решение |
|---|---|
| 502 Bad Gateway | php-fpm не запущен или сокет другой версии: `systemctl status php8.1-fpm`, проверьте путь сокета в /etc/php/8.1/fpm/pool.d/www.conf |
| «Unable to open database» в ответе API | права: `chown -R www-data:www-data /var/www/dez` |
| Telegram не шлёт | неверный CHAT_ID (должен быть с минусом) или бот не добавлен в группу; проверьте `curl "https://api.telegram.org/bot<Т>/sendMessage?chat_id=<ID>&text=test"` |
| 403 на /api.php | правило deny перекрывает php-location — убедитесь, что `location ~ \.php$` идёт раньше правила с leads.db и что api.php не лежит в /backend/ |
| CORS ошибка в браузере | api.php сам отдаёт Access-Control-Allow-Origin — проверяйте, что запрос идёт на тот же домен, что и сайт |
| Заявки уходят, но на сайте «демо» | в config.js всё ещё leadMode:'demo' — см. шаг 9 |
