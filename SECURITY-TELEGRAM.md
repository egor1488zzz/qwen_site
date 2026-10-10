# 🔒 Безопасность сервера + 📲 Telegram-уведомления (Ubuntu 24.04, PHP 8.3)

IP сервера: **2.26.10.224**. Выполнять от root (web-консоль my.serv.host или SSH).

---

## Часть 1. Обновление бэкенда на сервере (обязательно, в начале и после каждого пуша)

```bash
cd /var/www/dez && git pull
cp backend/api.php api.php
chown -R www-data:www-data /var/www/dez && chmod 775 /var/www/dez
```

---

## Часть 2. Безопасность сервера

### 2.1 Firewall (ufw): закрываем всё, кроме нужных портов
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'      # 80 + 443
ufw --force enable
ufw status verbose
```

### 2.2 Fail2Ban — банит перебор паролей SSH и nginx
```bash
apt install -y fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
EOF
systemctl enable --now fail2ban
fail2ban-client status sshd
```

### 2.3 SSH: запрещаем вход под root и пустые пароли
⚠️ Сначала создайте своего пользователя с паролем, иначе потеряете доступ!
```bash
adduser admin
usermod -aG sudo admin
nano /etc/ssh/sshd_config.d/hardening.conf
```
В файл вписать:
```
PermitRootLogin no
PasswordAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
```
Проверить и применить: `sshd -t && systemctl restart ssh`
(веб-консоль хостинга работает даже после запрета root-SSH — там отдельный доступ; для обычного SSH дальше логиньтесь как `admin@2.26.10.224`, команды через `sudo`).

Идеальный вариант — войти ключом и затем поставить `PasswordAuthentication no`.

### 2.4 Автоматические обновления безопасности
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades   # выбрать «Да»
```

### 2.5 Защита nginx: закрыть лишнее, спрятать версии
```bash
cat > /etc/nginx/conf.d/hardening.conf << 'EOF'
server_tokens off;
map $http_user_agent $bad_bot { default 0; ~*(sqlmap|nikto|masscan|zgrab) 1; }
EOF
```
Добавьте внутрь `server { ... }` в `/etc/nginx/sites-available/dez` (перед `location ~ \.php$`):
```nginx
    if ($bad_bot) { return 403; }
    location ~ /\.(git|env) { deny all; }
    client_body_buffer_size 16k;
```
Затем: `nginx -t && systemctl reload nginx`

### 2.6 HTTPS на IP недоступен → привяжите домен (быстро и бесплатно)
Let's Encrypt не выдаёт сертификаты на голый IP. Купите домен (или возьмите бесплатный), направьте A-запись на 2.26.10.224:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d вашдомен.ru -d www.вашдомен.ru
```
После этого:
1. В `js/config.js` замените `serverApi: 'http://2.26.10.224'` → `'https://вашдомен.ru'` (push в GitHub).
2. Если используете env-переменные — обновите `DEZ_CORS_ALLOW` (см. часть 3).

### 2.7 Что уже сделано в коде бэкенда (git pull применит)
- SQLite-rate-limit: не более 6 заявок/минуту с одного IP (без Cookie);
- honeypot-поле `website` — боты тихо игнорируются;
- строгая валидация всех полей (длина телефона/имени/города/сообщения);
- CORS — белый список источников вместо «разрешить всем»;
- сравнение токенов через `hash_equals` (защита от timing-атак);
- база `leads.db` закрыта от скачивания директивой nginx;
- админская страница заявок `/api.php?admin=1` с паролем.

### 2.8 Полезно включить сразу после настройки
- Бэкап базы заявок: `crontab -e` → строка
  `0 3 * * * cp /var/www/dez/backend/leads.db /root/backups/leads_$(date +\%F).db && find /root/backups -mtime +14 -delete`
  (сначала `mkdir -p /root/backups`)
- Логи атак смотреть: `tail -f /var/log/auth.log`, `fail2ban-client status`.

---

## Часть 3. Telegram-уведомления о заявках (5–10 минут)

### Шаг 1. Создать бота
1. В Telegram найдите **@BotFather** → отправьте `/newbot`
2. Имя: `Дез-Комфорт Заявки` → username: например `dez_komfort_leads_bot`
3. BotFather пришлёт **токен** вида `8123456789:AAGbH...xyz` — сохраните.

### Шаг 2. Создать группу и получить chat_id
1. Создайте группу «♻ Заявки Дез-Комфорт», добавьте туда бота, дайте ему права (обычный участник ок).
2. Напишите в группу любое сообщение (например «тест»).
3. Откройте в браузере:
   `https://api.telegram.org/botВАШ_ТОКЕН/getUpdates`
4. Найдите `"chat":{"id":-100XXXXXXXXXX,...}` — это и есть **CHAT_ID** (для групп всегда отрицательный, начинается с -100). Скопируйте целиком со знаком минус.

### Шаг 3. Прописать переменные на сервере
```bash
cat >> /etc/php/8.3/fpm/pool.d/www.conf << 'EOF'
env[DEZ_TG_BOT_TOKEN] = ВСТАВЬТЕ_ТОКЕН_БОТА
env[DEZ_TG_CHAT_ID]   = ВСТАВЬТЕ_CHAT_ID
env[DEZ_ADMIN_TOKEN]  = 3e3c7b9025185287c677aa07e82259c5fb33190fb168eced
EOF
systemctl restart php8.3-fpm
```
(лучше сгенерировать СВОЙ ADMIN_TOKEN: `openssl rand -hex 24` — старый засвечен в репозитории.)

### Шаг 4. Проверка
```bash
curl -X POST http://localhost/api.php -H 'Content-Type: application/json' \
  -d '{"name":"Тест","phone":"79990000000","city":"Москва","service":"Клопы"}'
```
Ожидаем `{"ok":true,"id":N}` и сообщение в группе Telegram.

### Просмотр заявок без Telegram
- Таблица в браузере: `http://2.26.10.224/api.php?admin=1` → пароль = ADMIN_TOKEN
- CSV-выгрузка: `http://2.26.10.224/api.php?token=ADMIN_TOKEN&export=csv`
