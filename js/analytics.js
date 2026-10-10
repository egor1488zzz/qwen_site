/* ═══════════════════════════════════════
   Дез-Комфорт · analytics.js — сквозная аналитика (пункт 5)
   Яндекс.Метрика + Google Analytics (gtag) + Calltouch, всё из config.js.
   Все интеграции отключаются сами, если ключи не заданы.
   Отслеживаются: клики по телефону/мессенджерам, отправка форм,
   выбор города, калькулятор, прокрутка до контактов, звонки FAB.
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  var cfg = window.DEZ_CONFIG || {};

  /* ── Загрузка счётчиков ── */
  function initYaMetrika() {
    var id = cfg.yaMetrikaId;
    if (!id || id === 0) return;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
      m[i].l = 1 * new Date();
      k = e.createElement(t), a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  function initGtag() {
    var gaid = cfg.gtagId;
    if (!gaid) return;
    var s = document.createElement('script');
    s.async = 1; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaid;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments) };
    gtag('js', new Date());
    gtag('config', gaid, { send_page_view: true });
  }

  function initCalltouch() {
    if (!cfg.calltouchKey) return;
    var s = document.createElement('script');
    s.async = 1;
    s.src = 'https://cdn.calltouch.ru/calltouch.js';
    s.onload = function () { try { window.ct && window.ct.init && window.ct.init(cfg.calltouchKey); } catch (e) {} };
    document.head.appendChild(s);
  }

  /* ── Единый отправитель целей ── */
  function goal(name, params) {
    params = params || {};
    params.city = window.DEZ_PAGE_CITY || (localStorage.getItem('dez_city') || '');
    try { if (window.ym) ym(cfg.yaMetrikaId, 'reachGoal', name, params); } catch (e) {}
    try { if (window.gtag) gtag('event', name, params); } catch (e) {}
    try { if (window.dataLayer) dataLayer.push({ event: name, dez: params }); } catch (e) {}
  }
  window.DEZ_GOAL = goal; // доступен из main.js и страниц городов

  /* ── Отслеживание событий страницы ── */
  function trackEvents() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"], .fab');
      if (a) { goal('phone_click', { href: a.getAttribute('href') || '' }); return; }

      var w = e.target.closest && e.target.closest('a[href*="t.me"], a[href*="max.ru"], a[aria-label="Telegram"], a[aria-label="MAX"]');
      if (w) { goal('messenger_click', { href: w.getAttribute('href') || '' }); return; }

      var calc = e.target.closest && e.target.closest('#calcOrder');
      if (calc) goal('calc_order');

      var cityBtn = e.target.closest && e.target.closest('[data-city]');
      if (cityBtn) goal('city_pick', { city: cityBtn.dataset.city });
    }, true);

    document.addEventListener('dez:city', function (e) { goal('city_changed', { city: e.detail }); });

    /* заявка отправлена — main.js вызывает DEZ_LEADS.submit, цель ставим здесь через событие */
    document.addEventListener('dez:lead_sent', function (e) {
      goal('lead_sent', { form: e.detail && e.detail.form, service: e.detail && e.detail.service });
    });

    /* скролл до секции контактов = микро-конверсия */
    var contactsSeen = false;
    var c = document.getElementById('contacts');
    if (c && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !contactsSeen) { contactsSeen = true; goal('view_contacts'); }
      }, { threshold: 0.3 }).observe(c);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

  function boot() {
    initYaMetrika();
    initGtag();
    initCalltouch();
    trackEvents();
    goal('page_viewed', { page: location.pathname });
  }
})();
