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
      var mode = cfg.leadMode || 'demo';
      var p;
      if (mode === 'endpoint') p = toEndpoint(lead);
      else if (mode === 'telegram') p = toTelegram(lead);
      else p = Promise.resolve({ ok: true, id: 0 });
      toCrm(lead); // параллельно в CRM, не блокируем
      return p.then(function (res) {
        if (res && res.ok) { var id = store(lead); res.id = res.id || id; }
        return res;
      });
    },
    all: allLeads,
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    mode: function () { return cfg.leadMode || 'demo'; }
  };
})();
