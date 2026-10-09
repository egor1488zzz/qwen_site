#!/usr/bin/env node
/**
 * Дез-Комфорт · backend/server.js — Node-альтернатива api.php (пункт 1 плана)
 * Если на сервере удобнее Node, чем PHP:
 *   npm install express better-sqlite3 && node server.js
 * В config.js: leadMode:'endpoint', leadEndpoint:'http://ВАШ_ХОСТ:3000/api/lead'
 */
const express = require('express');
const Database = require('better-sqlite3');

// ══ НАСТРОЙКИ ══
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.DEZ_ADMIN_TOKEN || 'change-me-strong-token';
const TG_TOKEN = process.env.TG_BOT_TOKEN || '';   // например '123:AA...'
const TG_CHAT = process.env.TG_CHAT_ID || '';      // например '-100...'
const CRM_WEBHOOK = process.env.CRM_WEBHOOK || '';
// ══════════════

const app = express();
app.use(express.json());

// CORS для GitHub Pages / любого домена компании
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const db = new Database(__dirname + '/leads.db');
db.exec(`CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT, name TEXT, phone TEXT,
  city TEXT, service TEXT, message TEXT, source TEXT, status TEXT DEFAULT 'new',
  ip TEXT, ua TEXT)`);
const insert = db.prepare(`INSERT INTO leads (created,name,phone,city,service,message,source,ip,ua)
  VALUES (@created,@name,@phone,@city,@service,@message,@source,@ip,@ua)`);

/* Анти-спам по IP: не более 6/мин */
const rate = new Map();
function tooMany(ip) {
  const now = Date.now();
  const arr = (rate.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= 6) { rate.set(ip, arr); return true; }
  arr.push(now); rate.set(ip, arr); return false;
}

app.post('/api/lead', async (req, res) => {
  const b = req.body || {};
  const phone = String(b.phone || '').replace(/\D+/g, '');
  if (b.website) return res.json({ ok: true });            // honeypot
  if (phone.length !== 11) return res.status(422).json({ ok: false, error: 'invalid phone' });
  if (tooMany(req.ip)) return res.status(429).json({ ok: false, error: 'too many' });

  const info = insert.run({
    created: new Date().toISOString(),
    name: String(b.name || '').slice(0, 100),
    phone, city: String(b.city || '').slice(0, 60),
    service: String(b.service || 'Не указана').slice(0, 100),
    message: String(b.message || '').slice(0, 1000),
    source: String(b.source || 'site'),
    ip: req.ip, ua: String(req.headers['user-agent'] || '').slice(0, 200),
  });
  const id = info.lastInsertRowid;

  // Уведомления — не блокируем ответ
  if (TG_TOKEN && TG_CHAT) {
    fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text:
        `🔔 Заявка #${id}\n👤 ${b.name}\n📞 +${phone}\n📍 ${b.city}\n🛠 ${b.service}${b.message ? '\n💬 ' + b.message : ''}` }),
    }).catch(() => {});
  }
  if (CRM_WEBHOOK) {
    fetch(CRM_WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: b.name, phones: [{ value: '+' + phone, primary: true }],
        custom_fields: { CITY: b.city, SERVICE: b.service }, description: b.message }),
    }).catch(() => {});
  }
  res.json({ ok: true, id });
});

// Выгрузка заявок: GET /api/leads?token=...&export=csv
app.get('/api/leads', (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden' });
  const rows = db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
  if (req.query.export === 'csv') {
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="leads.csv"');
    const head = 'ID;Дата;Имя;Телефон;Город;Услуга;Сообщение;Источник;Статус\n';
    const body = rows.map(r => [r.id, r.created, r.name, r.phone, r.city, r.service,
      (r.message || '').replace(/[;\n]/g, ' '), r.source, r.status].join(';')).join('\n');
    return res.send('\uFEFF' + head + body);
  }
  res.json({ count: rows.length, leads: rows });
});

app.listen(PORT, () => console.log(`Дез-Комфорт API: http://localhost:${PORT}/api/lead`));
