<?php
/**
 * Дез-Комфорт · backend/api.php — реальный приём заявок (пункт 1 плана)
 *
 * Разверните на вашем облачном сервере (PHP 7.4+, SQLite включён по умолчанию).
 *   nginx: location ~ \.php$ { fastcgi_pass unix:/run/php/php8.2-fpm.sock; }
 *   затем в js/config.js: leadMode:'endpoint', leadEndpoint:'/api.php'
 *
 * Что делает:
 *  - принимает POST JSON {name, phone, city, service, message, source}
 *  - сохраняет заявку в SQLite (backend/leads.db)
 *  - шлёт уведомление менеджеру в Telegram (если заданы константы)
 *  - опционально дублирует в amoCRM/Bitrix24 webhook (CRM_WEBHOOK)
 *  - GET ?token=SECRET&export=csv — выгрузка всех заявок CSV
 */

// ══ НАСТРОЙКИ ══════════════════════════════════════════════════
// Всё можно задавать через переменные окружения (nginx fastcgi_param / pm2 env),
// либо вписать значения прямо сюда. Значение по умолчанию ниже — рабочий секрет.
define('ADMIN_TOKEN', getenv('DEZ_ADMIN_TOKEN') ?: '3e3c7b9025185287c677aa07e82259c5fb33190fb168eced'); // токен для просмотра/выгрузки CSV
define('TELEGRAM_BOT_TOKEN', getenv('DEZ_TG_BOT_TOKEN') ?: '');  // '123:AA...' — пусто = не слать в Telegram
define('TELEGRAM_CHAT_ID', getenv('DEZ_TG_CHAT_ID') ?: '');      // '-100...' (id чата/группы)
define('CRM_WEBHOOK', getenv('DEZ_CRM_WEBHOOK') ?: '');          // URL вебхука amoCRM/Битрикс24, '' = выкл
define('DB_FILE', getenv('DEZ_DB_FILE') ?: (__DIR__ . '/leads.db'));
// ═══════════════════════════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');

/* CORS — строгий белый список разрешённых источников */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$corsAllowed = array_filter(explode(',', getenv('DEZ_CORS_ALLOW') ?: 'https://egor1488zzz.github.io,http://2.26.10.224,https://2.26.10.224'));
if ($origin && in_array($origin, $corsAllowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$method = $_SERVER['REQUEST_METHOD'];

/* ── Хранилище ─────────────────────────────────────────────── */
function db() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DB_FILE);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created TEXT NOT NULL,
            name TEXT, phone TEXT, city TEXT, service TEXT,
            message TEXT, source TEXT, status TEXT DEFAULT "new",
            ip TEXT, ua TEXT
        )');
    }
    return $pdo;
}

/* ── Простейший rate-limit по IP в SQLite (работает без сессий/Cookie) ── */
function rl_check(int $limitPerMinute) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
    $rlFile = preg_replace('/\.db$/', '', DB_FILE) . '_rate.db';
    $rl = new PDO('sqlite:' . $rlFile);
    $rl->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $rl->exec('CREATE TABLE IF NOT EXISTS hits (ip TEXT, ts INTEGER)');
    $now = time();
    $rl->prepare('DELETE FROM hits WHERE ts < ?')->execute([$now - 60]);
    $q = $rl->prepare('SELECT COUNT(*) FROM hits WHERE ip = ?');
    $q->execute([$ip]);
    if ((int)$q->fetchColumn() >= $limitPerMinute) {
        http_response_code(429);
        echo json_encode(['ok' => false, 'error' => 'too many requests']); exit;
    }
    $rl->prepare('INSERT INTO hits (ip, ts) VALUES (?, ?)')->execute([$ip, $now]);
}

/* ── Админ: страница просмотра заявок (пароль = ADMIN_TOKEN) ───── */
if ($method === 'GET' && isset($_GET['admin'])) {
    header('Content-Type: text/html; charset=utf-8');
    $pass = $_GET['pass'] ?? '';
    if (!hash_equals(ADMIN_TOKEN, $pass)) {
        echo '<form method="get"><input type="hidden" name="admin" value="1">'
           . '<input type="password" name="pass" placeholder="Пароль администратора">'
           . '<button>Войти</button></form>'; exit;
    }
    $rows = db()->query('SELECT * FROM leads ORDER BY id DESC LIMIT 500')->fetchAll(PDO::FETCH_ASSOC);
    echo '<meta charset="utf-8"><title>Заявки Дез-Комфорт</title>'
       . '<style>body{font-family:sans-serif}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px;font-size:13px}</style>'
       . '<h2>Заявки (' . count($rows) . ') · <a href="?token=' . htmlspecialchars(ADMIN_TOKEN) . '&export=csv">Выгрузить CSV</a></h2><table><tr><th>ID</th><th>Дата</th><th>Имя</th><th>Телефон</th><th>Город</th><th>Услуга</th><th>Сообщение</th><th>Источник</th><th>Статус</th></tr>';
    foreach ($rows as $r) {
        echo '<tr>';
        foreach (['id','created','name','phone','city','service','message','source','status'] as $k)
            echo '<td>' . htmlspecialchars((string)($r[$k] ?? '')) . '</td>';
        echo '</tr>';
    }
    echo '</table>'; exit;
}

/* ── Выгрузка заявок (GET ?token=...&export=csv) ───────────── */
if ($method === 'GET') {
    if (!hash_equals(ADMIN_TOKEN, $_GET['token'] ?? '')) {
        http_response_code(403);
        echo json_encode(['error' => 'forbidden']); exit;
    }
    $rows = db()->query('SELECT * FROM leads ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
    if (($_GET['export'] ?? '') === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="leads.csv"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['ID','Дата','Имя','Телефон','Город','Услуга','Сообщение','Источник','Статус'], ';');
        foreach ($rows as $r) fputcsv($out, array_values($r), ';');
        fclose($out); exit;
    }
    echo json_encode(['count' => count($rows), 'leads' => $rows], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method']); exit; }

/* ── Приём заявки ──────────────────────────────────────────── */
$in = json_decode(file_get_contents('php://input'), true) ?: [];

$name    = trim($in['name']    ?? '');
$phone   = preg_replace('/\D+/', '', $in['phone'] ?? '');
$city    = trim($in['city']    ?? '');
$service = trim($in['service'] ?? 'Не указана');
$message = trim($in['message'] ?? '');
$source  = trim($in['source']  ?? 'site');

if (strlen($phone) !== 11 || strlen($phone) < 10 || mb_strlen($city) > 60 || mb_strlen($message) > 1000 || mb_strlen($name) > 100 || mb_strlen($service) > 100) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'invalid data']); exit;
}
/* Анти-спам: honeypot + частота с одного IP (SQLite-счётчик, работает без Cookie) */
if (!empty($in['website'])) { echo json_encode(['ok' => true]); exit; } // боты — тихо игнор
rl_check(6); // не более 6 заявок с одного IP в минуту

$stmt = db()->prepare('INSERT INTO leads (created,name,phone,city,service,message,source,ip,ua)
    VALUES (:c,:n,:p,:ci,:s,:m,:so,:ip,:ua)');
$stmt->execute([
    ':c' => date('Y-m-d H:i:s'), ':n' => mb_substr($name, 0, 100), ':p' => $phone, ':ci' => $city,
    ':s' => mb_substr($service, 0, 100), ':m' => $message, ':so' => $source,
    ':ip' => $_SERVER['REMOTE_ADDR'] ?? '', ':ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200),
]);
$id = (int)db()->lastInsertId();

/* ── Уведомления (не блокируем ответ при ошибках сети) ─────── */
try {
    $tgStatus = 'skipped'; // не настроен
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        $tgStatus = tg("🔔 Новая заявка #$id\n👤 $name\n📞 +$phone\n📍 $city\n🛠 $service" . ($message ? "\n💬 $message" : ''));
    } elseif (getenv('DEZ_DEBUG') === '1') {
        error_log('[DEZ] Telegram НЕ настроен: BOT=' . (TELEGRAM_BOT_TOKEN ? 'OK' : 'ПУСТО') . ' CHAT=' . (TELEGRAM_CHAT_ID ? 'OK' : 'ПУСТО'));
    }
    if (CRM_WEBHOOK) {
        crm($id, $name, $phone, $city, $service, $message);
    }
} catch (Throwable $e) { error_log('dez notify: ' . $e->getMessage()); }

echo json_encode(array_merge(['ok' => true, 'id' => $id], getenv('DEZ_DEBUG') === '1' ? ['telegram' => $tgStatus ?? 'n/a'] : []), JSON_UNESCAPED_UNICODE);

/* ── Служебные функции ─────────────────────────────────────── */

// Отправка в Telegram через cURL. Возвращает 'sent' | текст ошибки.
function tg(string $text): string {
    $ch = curl_init('https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'chat_id' => TELEGRAM_CHAT_ID, 'text' => $text, 'disable_web_page_preview' => 'true',
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
    ]);
    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($resp === false) { error_log('[DEZ TG] cURL error: ' . $err); return 'curl_error: ' . $err; }
    $json = json_decode($resp, true);
    if (!empty($json['ok'])) return 'sent';
    error_log('[DEZ TG] HTTP ' . $code . ' ответ: ' . substr($resp, 0, 300));
    return 'tg_error HTTP ' . $code . ': ' . ($json['description'] ?? substr($resp, 0, 120));
}

/* Универсальный CRM-webhook: amoCRM _webhooks или Битрикс24 incoming REST */
function crm(int $id, string $name, string $phone, string $city, string $service, string $message) {
    $payload = json_encode([
        'id' => $id, 'name' => $name, 'phones' => [['value' => "+$phone", 'primary' => true]],
        'custom_fields' => ['CITY' => $city, 'SERVICE' => $service], 'description' => $message,
    ], JSON_UNESCAPED_UNICODE);
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $payload,
        'timeout' => 5,
    ]]);
    @file_get_contents(CRM_WEBHOOK, false, $ctx);
}
