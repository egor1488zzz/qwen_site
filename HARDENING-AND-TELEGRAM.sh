#!/bin/bash
# ============================================================
# Дез-Комфорт: безопасность сервера + подготовка Telegram
# Ubuntu 24.04 / PHP 8.3. Запускать от root на сервере:
#   bash HARDENING-AND-TELEGRAM.sh
# ============================================================
set -e

echo "==> 1. Применяем обновления сайта (новый api.php, config.js)"
cd /var/www/dez
git pull
cp backend/api.php api.php
chown -R www-data:www-data /var/www/dez
chmod 775 /var/www/dez

echo "==> 2. Firewall (ufw): закрываем всё, кроме SSH/HTTP/HTTPS"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose

echo "==> 3. Fail2Ban: бан перебора паролей SSH"
DEBIAN_FRONTEND=noninteractive apt install -y fail2ban
cat > /etc/fail2ban/jail.local << 'JAIL'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
JAIL
systemctl enable --now fail2ban
systemctl restart fail2ban
fail2ban-client status sshd || true

echo "==> 4. Создаём пользователя admin (ОБЯЗАТЕЛЬНО до запрета root!)"
if ! id admin >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" admin
    echo 'admin:СМЕНИТЕ_ЭТОТ_ПАРОЛЬ_123' | chpasswd
    usermod -aG sudo admin
    echo "   Пользователь admin создан. СМЕНИТЕ ЕГО ПАРОЛЬ: passwd admin"
else
    usermod -aG sudo admin
fi

echo "==> 5. Автоматические обновления безопасности"
DEBIAN_FRONTEND=noninteractive apt install -y unattended-upgrades
systemctl enable --now unattended-upgrades 2>/dev/null || dpkg-reconfigure -plow unattended-upgrades

echo "==> 6. Hardening nginx"
cat > /etc/nginx/conf.d/hardening.conf << 'NGX'
server_tokens off;
map $http_user_agent $bad_bot { default 0; ~*(sqlmap|nikto|masscan|zgrab) 1; }
NGX
# Вставляем антибот + закрытие .git внутрь server-блока dez (перед location php), если ещё не вставлено
if ! grep -q 'bad_bot' /etc/nginx/sites-available/dez; then
    sed -i '/location ~ \\\.php\$/i \    if ($bad_bot) { return 403; }\n    location ~ /\\.(git|env) { deny all; }\n    client_body_buffer_size 16k;\n' /etc/nginx/sites-available/dez
fi
nginx -t && systemctl reload nginx

echo "==> 7. Бэкап базы заявок каждые сутки в 03:00"
mkdir -p /root/backups
crontab -l 2>/dev/null | grep -v 'leads_' | grep -v 'leads.db' > /tmp/cron.new || true
echo '0 3 * * * cp /var/www/dez/backend/leads.db /root/backups/leads_$(date +\%F).db 2>/dev/null; find /root/backups -mtime +14 -delete' >> /tmp/cron.new
crontab /tmp/cron.new && rm /tmp/cron.new
echo "   cron установлен: crontab -l"

echo "==> 8. Генерируем личный ADMIN_TOKEN"
NEWTOKEN=$(openssl rand -hex 24)
echo "   Ваш новый ADMIN_TOKEN: $NEWTOKEN"
echo "   (запишите его — пароль для http://2.26.10.224/api.php?admin=1 и CSV)"

echo ""
echo "############################################################"
echo "# ГОТОВО. Осталось вручную (Telegram):                      #"
echo "# 1. @BotFather -> /newbot -> скопируйте токен бота         #"
echo "# 2. Создайте группу, добавьте бота, напишите «тест»        #"
echo "# 3. Откройте https://api.telegram.org/bot<ТОКЕН>/getUpdates#"
echo "#    найдите \"chat\":{\"id\":-100...}  <- это CHAT_ID          #"
echo "# 4. Заполните ТОКЕН, CHAT_ID и ADMIN_TOKEN из п.8 ниже     #"
echo "#    и выполните блок команд «ШАГ TELEGRAM»                 #"
echo "############################################################"

cat << 'TG'
# ===== ШАГ TELEGRAM (после получения токена и chat_id) =====
cat >> /etc/php/8.3/fpm/pool.d/www.conf << 'ENVBLOCK'
env[DEZ_TG_BOT_TOKEN] = ВСТАВЬТЕ_ТОКЕН_БОТА
env[DEZ_TG_CHAT_ID]   = ВСТАВЬТЕ_CHAT_ID
env[DEZ_ADMIN_TOKEN]  = ВСТАВЬТЕ_ADMIN_TOKEN_из_пункта_8
ENVBLOCK
systemctl restart php8.3-fpm
# Проверка:
curl -X POST http://localhost/api.php -H 'Content-Type: application/json' -d '{"name":"Тест","phone":"79990000000","city":"Москва","service":"Клопы"}'
# ожидаем {"ok":true,...} и сообщение в группе Telegram
# ===== ЗАПРЕТ ROOT-SSH (только когда admin работает и вы под него зашли!) =====
# ssh admin@2.26.10.224   <- проверьте вход
# sudo tee /etc/ssh/sshd_config.d/hardening.conf > /dev/null << 'SSHBLOCK'
# PermitRootLogin no
# MaxAuthTries 3
# SSHBLOCK
# sudo sshd -t && sudo systemctl restart ssh
TG
