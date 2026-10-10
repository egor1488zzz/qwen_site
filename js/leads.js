/* ═══════════════════════════════════════
   Дез-Комфорт · leads.js — реальный приём заявок (пункт 1)
   Режимы из config.js: demo | endpoint | telegram.
   В demo-режиме заявки хранятся в localStorage и доступны
   через window.DEZ_LEADS.all() (для страницы admin.html).
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'dez_leads';
  var cfg = window.DEZ_CONFIG || {};

  /* Авто-режим: на статическом хостинге (GitHub Pages) PHP недоступен,
     поэтому при leadMode='endpoint' ищем реальный бэкенд:
       - ?api=https://... в URL;
       - window.DEZ_API_URL или config.serverApi — прод-адрес сервера.
     Если endpoint недоступен, а telegram настроен — шлём заявки прямо в Telegram.
     Иначе — demo. На собственном домене (не github.io) endpoint работает сразу. */
  var autoResolved = null;
  function resolveEndpoint() {
    if (cfg.serverApi) return cfg.serverApi.replace(/\/?$/, '/api.php');
    if (window.DEZ_API_URL) return String(window.DEZ_API_URL).replace(/\/?$/, '/api.php');
    try {
      var q = new URLSearchParams(location.search).get('api');
      if (q) return q;
    } catch (e) {}
    return null;
  }
  function tgReady() { var t = cfg.telegram || {}; return !!(t.botToken && t.chatId); }

  function detectBackend(url) {
    return fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"ping":1}'
    }).then(function (r) { return r.status < 500; }).catch(function () { return false; });
  }

  function resolveMode() {
    if (autoResolved) return Promise.resolve(autoResolved);
    if (location.hostname === 'localhost' || location.hostname === '' || /\.ipaddr\.pages\.dev$/.test(location.hostname)) {
      autoResolved = 'demo'; return Promise.resolve('demo');
    }
    if (!/github\.io$/.test(location.hostname)) { autoResolved = cfg.leadMode || 'demo'; return Promise.resolve(autoResolved); }
    /* GitHub Pages: пробуем найти живой api.php */
    var url = resolveEndpoint();
    if (url) {
      return detectBackend(url).then(function (ok) {
        if (ok) { cfg.leadEndpoint = url; autoResolved = 'endpoint'; return 'endpoint'; }
        autoResolved = tgReady() ? 'telegram' : 'demo';
        return autoResolved;
      });
    }
    autoResolved = tgReady() ? 'telegram' : 'demo';
    return Promise.resolve(autoResolved);
  }

  function store(lead) {
    try {
      var arr = JSON.parse(localStorage.getItem(KEY) || '[]');
      lead.id = arr.length + 1;
      lead.created = new Date().toISOString();
      arr.unshift(lead);
      if (arr.length > 200) arr.pop();
      localStorage.setItem(KEY, JSON.stringify(arr));
      return lead.id;
    } catch (e) { return 0; }
  }

  function allLeads() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }

  /* Отправка в Telegram напрямую с фронта (leadMode='telegram') */
  function toTelegram(lead) {
    var t = cfg.telegram || {};
    if (!t.botToken || !t.chatId) return Promise.resolve({ ok: false, error: 'no telegram config' });
    var text = '🔔 Заявка с сайта\n👤 ' + (lead.name || '—') + '\n📞 ' + lead.phone +
      '\n📍 ' + (lead.city || '—') + '\n🛠 ' + (lead.service || '—') +
      (lead.message ? '\n💬 ' + lead.message : '');
    return fetch('https://api.telegram.org/bot' + t.botToken + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: t.chatId, text: text })
    }).then(function (r) { return r.json(); }).then(function (d) { return { ok: !!d.ok }; })
      .catch(function (e) { return { ok: false, error: String(e) }; });
  }

  /* POST на бэкенд (endpoint) + дубль в CRM-webhook */
  function toEndpoint(lead) {
    var url = cfg.leadEndpoint;
    if (!url) return Promise.resolve({ ok: false, error: 'no endpoint' });
    return fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(function (r) { return r.json(); })
      .catch(function (e) { return { ok: false, error: String(e) }; });
  }

  function toCrm(lead) {
    if (!cfg.crmWebhook) return;
    try {
      fetch(cfg.crmWebhook, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lead.name, phone: lead.phone, city: lead.city, service: lead.service })
      }).catch(function () {});
    } catch (e) {}
  }

  /* Публичный API */
  window.DEZ_LEADS = {
    /* submit(lead) -> Promise<{ok, id?, error?}>; lead: {name,phone,city,service,message,source} */
    submit: function (lead) {
      lead.sentAt = Date.now();
      return resolveMode().then(function (mode) {
        var p;
        if (mode === 'endpoint') p = toEndpoint(lead);
        else if (mode === 'telegram') p = toTelegram(lead);
        else p = Promise.resolve({ ok: true, id: 0 });
        toCrm(lead); // параллельно в CRM, не блокируем
        return p.then(function (res) {
          if (!res || !res.ok) { store(lead); } /* при сбое — хотя бы локально */
          else { var id = store(lead); res.id = res.id || id; }
          return res;
        });
      });
    },
    all: allLeads,
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    mode: function () { return autoResolved || cfg.leadMode || 'demo'; },
    detect: resolveMode
  };
})();
