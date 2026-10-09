/* ═══════════════════════════════════════
   Дез-Комфорт · main.js
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initHeader();
    initBurger();
    initReveal();
    initCounters();
    initTabs();
    initCalculator();
    initSlider();
    initModal();
    initForms();
    initPhoneMask();
    initCityPicker();
    initMessengerLinks();
    initGeoPrices();
    initFaq();
    initScrollSpy();
  }

  /* ── FAQ-аккордеон (нативные <details>: сворачиваем остальные) ── */
  function initFaq() {
    const items = document.querySelectorAll('.accordion .acc');
    items.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) items.forEach(o => { if (o !== d) o.open = false; });
    }));
  }

  /* ── Scroll-spy: активный пункт меню по секции ── */
  function initScrollSpy() {
    const links = Array.from(document.querySelectorAll('#nav a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map();
    links.forEach(a => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (sec) map.set(sec, a);
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('is-active'));
          const a = map.get(e.target);
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((_, sec) => io.observe(sec));
  }

  /* ── Выбор города + геолокация (совместно с geo.js / cities.js) ── */
  function initCityPicker() {
    const btn = document.getElementById('cityPickBtn');
    const drop = document.getElementById('cityDrop');
    const search = document.getElementById('citySearch');
    const listEl = document.getElementById('cityList');
    const heroCity = document.getElementById('heroCity');
    const datalist = document.getElementById('cityOptions');
    if (!btn || !drop || !listEl) return;

    const cities = window.DEZ_CITIES || [];

    // datalist для поля формы
    if (datalist) {
      datalist.innerHTML = cities.map(c => `<option value="${c.name}">`).join('');
    }

    function renderList(q) {
      const query = (q || '').toLowerCase().replace(/ё/g, 'е').trim();
      const items = cities.filter(c => !query || c.name.toLowerCase().replace(/ё/g, 'е').indexOf(query) !== -1);
      listEl.innerHTML = items.slice(0, 60).map(c =>
        `<li><button type="button" data-city="${c.name}"${c.name === btn.textContent ? ' class="is-active"' : ''}>${c.name}<small>${c.region}</small></button></li>`
      ).join('') || '<li class="citypick__empty">Город не найден — позвоните нам, работаем по всей РФ</li>';
    }

    function applyCity(name, opts) {
      opts = opts || {};
      const city = (window.DEZ_FIND_CITY && window.DEZ_FIND_CITY(name)) || null;
      btn.textContent = city ? city.name : name;
      // подмена телефонов на местный номер
      document.querySelectorAll('.js-phone-link').forEach(a => {
        if (city) {
          a.href = 'tel:' + city.phone;
          if (a.classList.contains('topbar__phone') || a.classList.contains('header__phone') || a.classList.contains('inline-link')) {
            const svg = a.querySelector('svg');
            a.textContent = city.display;
            if (svg) a.prepend(svg);
          }
        }
      });
      // контакты: телефон/адрес/мессенджеры филиала + WA-кнопка
      const cTel = document.getElementById('cPhone');
      if (cTel && city) { cTel.href = 'tel:' + city.phone; cTel.textContent = city.display; }
      const cAddr = document.getElementById('cAddress');
      if (cAddr && city) cAddr.textContent = city.address;
      const cMsgr = document.getElementById('cMessenger');
      if (cMsgr && city) cMsgr.textContent = 'WhatsApp / Telegram: ' + city.messenger.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '+$1 ($2) $3-$4-$5');
      const wa = document.getElementById('fabWa');
      if (wa) wa.href = waHref(city, 'Здравствуйте! Заказ дезинсекции, город: ' + (city ? city.name : name));
      if (heroCity && !heroCity.value) heroCity.value = city ? city.name : name;
      if (window.DEZ_GEO && opts.persist !== false) window.DEZ_GEO.remember(city ? city.name : name);
      document.dispatchEvent(new CustomEvent('dez:city', { detail: city ? city.name : name }));
    }

    function openDrop() { drop.hidden = false; btn.setAttribute('aria-expanded', 'true'); search.focus(); renderList(search.value); }
    function closeDrop() { drop.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', e => { e.stopPropagation(); drop.hidden ? openDrop() : closeDrop(); });
    search.addEventListener('input', () => renderList(search.value));
    search.addEventListener('click', e => e.stopPropagation());
    drop.addEventListener('click', e => e.stopPropagation());
    listEl.addEventListener('click', e => {
      const b = e.target.closest('[data-city]');
      if (!b) return;
      applyCity(b.dataset.city);
      closeDrop();
    });
    document.addEventListener('click', closeDrop);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrop(); });

    // Автоопределение города при загрузке
    if (window.DEZ_GEO) {
      window.DEZ_GEO.detect().then(cityName => applyCity(cityName, { persist: false }));
    }

    // Синхронизация поля формы с выбранным городом
    if (heroCity) {
      heroCity.addEventListener('change', () => {
        const c = window.DEZ_FIND_CITY(heroCity.value);
        if (c) applyCity(c.name);
      });
    }
  }

  /* ── Ссылки мессенджеров (WhatsApp/Telegram/VK) из config + город ── */
  function currentCity() {
    const name = localStorage.getItem('dez_city') || 'Москва';
    return (window.DEZ_FIND_CITY && window.DEZ_FIND_CITY(name)) || null;
  }
  function waHref(city, text) {
    const c = city || currentCity();
    const cfg = window.DEZ_CONFIG || {};
    const num = (c && c.messenger ? c.messenger : cfg.whatsappNumber || '').replace(/\D/g, '');
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
  }
  function tgHref(text) {
    const cfg = window.DEZ_CONFIG || {};
    return 'https://t.me/' + (cfg.telegramUsername || '') + '?text=' + encodeURIComponent(text);
  }
  function vkHref() {
    const cfg = window.DEZ_CONFIG || {};
    return 'https://vk.com/' + (cfg.vkGroupId || '');
  }
  function initMessengerLinks() {
    const wrap = document.getElementById('messengers');
    if (!wrap) return;
    const msgText = 'Здравствуйте! Заказ дезинсекции, город: ' + (localStorage.getItem('dez_city') || 'Москва');
    wrap.querySelectorAll('[data-msgr]').forEach(a => {
      const t = a.dataset.msgr;
      if (t === 'tg') a.href = tgHref(msgText);
      else if (t === 'wa') a.href = waHref(null, msgText);
      else if (t === 'vk') a.href = vkHref();
      else if (t === 'yt') a.href = 'https://www.youtube.com/@' + ((window.DEZ_CONFIG || {}).vkGroupId || 'dezkomfort');
      a.target = '_blank'; a.rel = 'noopener';
    });
    // плавающие кнопки WhatsApp / Telegram рядом с FAB-звонком
    if (!document.getElementById('fabWa')) {
      const mk = (id, href, label, bg, svg) => {
        const el = document.createElement('a');
        el.id = id; el.className = 'fab fab--sm'; el.href = href;
        el.setAttribute('aria-label', label); el.target = '_blank'; el.rel = 'noopener';
        el.style.background = bg; el.innerHTML = svg;
        document.body.appendChild(el);
        return el;
      };
      const fabCall = document.querySelector('.fab');
      const base = 26, size = 48, gap = 10;
      const bottomOf = i => base + (i + 1) * (size + gap) + (fabCall ? 72 - size : 0) + 'px';
      const wsvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.9 0-2 .1-3.9-1.4-2.2-1.7-3.2-3.9-3.3-4.1-.1-.2-.8-1.1-.8-2.2s.5-1.6.7-1.8c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .6.4l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.6 2 .9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.7-.9c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.5.3 0 .1 0 .6-.2 1.2z"/></svg>';
      const tsvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M9.04 15.35v4.28c0 .5.23.72.72.3l2.6-2.53 3.34 2.44c.6.33 1.04.16 1.18-.55L21.6 4.6c.22-.95-.34-1.33-1.04-1.1L2.9 9.8c-.92.35-.9.82-.16 1.04l4.6 1.43 10.7-6.74c.5-.3.96-.13.58.18z"/></svg>';
      const w = mk('fabWa', waHref(null, msgText), 'Написать в WhatsApp', 'linear-gradient(140deg,#25d366,#12a34b)', wsvg);
      const t = mk('fabTg', tgHref(msgText), 'Написать в Telegram', 'linear-gradient(140deg,#2aabee,#1d7fbf)', tsvg);
      w.style.bottom = bottomOf(1); t.style.bottom = bottomOf(0);
      w.style.width = w.style.height = t.style.width = t.style.height = size + 'px';
    }
  }

  /* ── Гео-тарифы: цены пересчитываются под multiplier города ── */
  function initGeoPrices() {
    // запоминаем базовые значения
    document.querySelectorAll('.js-price').forEach(el => {
      if (el.dataset.base === undefined) el.dataset.base = el.textContent.trim();
    });
    document.querySelectorAll('.pricetable td:not(:first-child)').forEach(td => {
      if (td.dataset.base === undefined) td.dataset.base = td.textContent.trim();
    });
    applyGeoPrices(currentCity());
    document.addEventListener('dez:city', e => applyGeoPrices(window.DEZ_FIND_CITY(e.detail)));
  }
  function scalePrice(txt, m) {
    const n = parseInt(String(txt).replace(/[^\d]/g, ''), 10);
    if (!n) return txt;
    const scaled = Math.round(n * m / 50) * 50;
    return txt.replace(/[\d\s\u00a0]+₽/, scaled.toLocaleString('ru-RU') + ' ₽');
  }
  function applyGeoPrices(city) {
    const m = city && city.multiplier ? city.multiplier : 1;
    document.querySelectorAll('.js-price').forEach(el => {
      el.textContent = m === 1 ? el.dataset.base : scalePrice(el.dataset.base, m);
    });
    document.querySelectorAll('#prices .pricetable td:not(:first-child)').forEach(td => {
      if (td.dataset.base === '—') { td.textContent = '—'; return; }
      td.textContent = m === 1 ? td.dataset.base : scalePrice(td.dataset.base, m);
    });
    const note = document.getElementById('geoPriceNote');
    if (note) note.textContent = m !== 1 && city
      ? '* Цены указаны для города «' + city.name + '» с региональным коэффициентом ×' + m.toFixed(2) + '.'
      : '';
    window.dispatchEvent(new Event('dez:pricecity')); // пересчёт калькулятора
  }

  /* ── Sticky header shadow ── */
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile burger ── */
  function initBurger() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    if (!burger || !nav) return;
    const setNavTop = () => {
      const h = document.querySelector('.header');
      document.documentElement.style.setProperty('--navtop', (h ? h.offsetHeight : 64) + 'px');
    };
    burger.addEventListener('click', () => {
      setNavTop();
      nav.classList.toggle('is-open');
      burger.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
    }));
  }

  /* ── Reveal-on-scroll for section blocks ── */
  function initReveal() {
    const targets = document.querySelectorAll(
      '.scard, .why, .method, .step, .prep__col, .review, .acc, .split__body, .split__media, .calcbox, .citem'
    );
    targets.forEach(el => el.classList.add('reveal'));
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ── Animated counters ── */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const fmt = n => n.toLocaleString('ru-RU');
    const animate = el => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1400, t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      nums.forEach(animate); return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  }

  /* ── Price tabs ── */
  function initTabs() {
    const wrap = document.getElementById('priceTabs');
    if (!wrap) return;
    const btns = wrap.querySelectorAll('.tabs__btn');
    const panels = wrap.querySelectorAll('.tabs__panel');
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('tabs__btn--active'));
      panels.forEach(p => p.classList.remove('tabs__panel--active'));
      btn.classList.add('tabs__btn--active');
      const panel = wrap.querySelector('[data-panel="' + btn.dataset.tab + '"]');
      if (panel) panel.classList.add('tabs__panel--active');
    }));
  }

  /* ── Cost calculator ── */
  function initCalculator() {
    const service = document.getElementById('calcService');
    const area = document.getElementById('calcArea');
    const areaVal = document.getElementById('calcAreaVal');
    const result = document.getElementById('calcResult');
    const old = document.getElementById('calcOld');
    if (!service || !area || !result) return;

    function calc() {
      const base = parseInt(service.value, 10);
      const a = parseInt(area.value, 10);
      // коэффициент площади: базовая цена ~ за 40 м², далее +18 ₽/м² сверх, с ограничением
      let price = base + Math.max(0, a - 40) * 18;
      if (a <= 25) price = Math.round(base * 0.8);
      price = Math.round(price / 50) * 50;
      const discounted = Math.round(price * 0.85 / 50) * 50;
      // гео-коэффициент выбранного города
      const city = currentCity();
      const m = city && city.multiplier ? city.multiplier : 1;
      const geo = v => Math.round(v * m / 50) * 50;
      areaVal.textContent = a;
      result.textContent = geo(discounted).toLocaleString('ru-RU') + ' ₽';
      old.textContent = price > discounted ? geo(price).toLocaleString('ru-RU') + ' ₽' : '';
    }
    service.addEventListener('change', calc);
    area.addEventListener('input', calc);
    window.addEventListener('dez:pricecity', calc);
    calc();
  }

  /* ── Reviews slider ── */
  function initSlider() {
    const track = document.getElementById('reviewTrack');
    const prev = document.getElementById('revPrev');
    const next = document.getElementById('revNext');
    const dotsWrap = document.getElementById('revDots');
    if (!track) return;

    const cards = Array.from(track.children);
    let perView = getPerView();
    let pages = Math.ceil(cards.length / perView);
    let page = 0;

    function getPerView() {
      const w = window.innerWidth;
      if (w <= 640) return 1;
      if (w <= 1080) return 2;
      return 3;
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('button');
        d.setAttribute('aria-label', 'Страница ' + (i + 1));
        if (i === page) d.classList.add('is-active');
        d.addEventListener('click', () => go(i));
        dotsWrap.appendChild(d);
      }
    }

    function go(p) {
      page = (p + pages) % pages;
      const cardW = cards[0].offsetWidth + 22;
      track.scrollTo({ left: page * perView * cardW, behavior: 'smooth' });
      dotsWrap.querySelectorAll('button').forEach((d, i) =>
        d.classList.toggle('is-active', i === page));
    }

    prev && prev.addEventListener('click', () => go(page - 1));
    next && next.addEventListener('click', () => go(page + 1));

    // sync page on manual scroll
    let st;
    track.addEventListener('scroll', () => {
      clearTimeout(st);
      st = setTimeout(() => {
        const cardW = cards[0].offsetWidth + 22;
        const p = Math.round(track.scrollLeft / (perView * cardW));
        if (p !== page && p >= 0 && p < pages) {
          page = p;
          dotsWrap.querySelectorAll('button').forEach((d, i) =>
            d.classList.toggle('is-active', i === page));
        }
      }, 120);
    }, { passive: true });

    let auto = setInterval(() => go(page + 1), 6000);
    track.addEventListener('pointerdown', () => { clearInterval(auto); });

    window.addEventListener('resize', () => {
      const pv = getPerView();
      if (pv !== perView) {
        perView = pv;
        pages = Math.ceil(cards.length / perView);
        page = 0;
        track.scrollTo({ left: 0 });
        buildDots();
      }
    });

    buildDots();
  }

  /* ── Modal ── */
  function initModal() {
    const modal = document.getElementById('modalCallback');
    if (!modal) return;
    const openers = document.querySelectorAll('[data-modal="callback"]');
    const closers = modal.querySelectorAll('[data-close]');

    const open = () => {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      const first = modal.querySelector('input');
      setTimeout(() => first && first.focus(), 150);
    };
    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = '';
    };

    openers.forEach(b => b.addEventListener('click', open));
    closers.forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
  }

  /* ── Phone mask (+7 (___) ___-__-__) ── */
  function initPhoneMask() {
    document.querySelectorAll('input[type=tel]').forEach(input => {
      input.addEventListener('input', () => {
        let digits = input.value.replace(/\D/g, '');
        if (digits.startsWith('8')) digits = '7' + digits.slice(1);
        if (!digits.startsWith('7')) digits = '7' + digits;
        digits = digits.slice(0, 11);
        let out = '+7';
        const a = digits.slice(1);
        if (a.length) out += ' (' + a.slice(0, 3);
        if (a.length >= 3) out += ')';
        if (a.length > 3) out += ' ' + a.slice(3, 6);
        if (a.length > 6) out += '-' + a.slice(6, 8);
        if (a.length > 8) out += '-' + a.slice(8, 10);
        input.value = out;
      });
    });
  }

  /* ── Forms validation & real submit (через DEZ_LEADS: demo/endpoint/telegram) ── */
  function collectLead(form, source) {
    const g = n => { const el = form.querySelector('[name=' + n + ']'); return el ? el.value.trim() : ''; };
    return {
      name: g('name') || 'Без имени',
      phone: g('phone'),
      city: g('city') || localStorage.getItem('dez_city') || 'Москва',
      service: g('service') || (source === 'calc' && document.getElementById('calcService')
        ? document.getElementById('calcService').selectedOptions[0].textContent : '') || 'Консультация',
      message: [g('message'), source ? 'Форма: ' + source : '',
        source === 'calc' && document.getElementById('calcResult')
          ? 'Калькулятор: ' + document.getElementById('calcResult').textContent + ', площадь '
            + (document.getElementById('calcAreaVal') || {}).textContent + ' м²' : '']
        .filter(Boolean).join(' · '),
      source: source,
      honeypot: g('website') // скрытое поле-ловушка для ботов
    };
  }

  function initForms() {
    const phoneOk = v => v.replace(/\D/g, '').length === 11;

    const markError = el => {
      el.classList.add('is-error');
      el.addEventListener('input', () => el.classList.remove('is-error'), { once: true });
    };

    const sendLead = (lead) => {
      if (lead.honeypot) return Promise.resolve({ ok: true, bot: true }); // бот — тихо «ок»
      const api = window.DEZ_LEADS;
      if (!api) return Promise.resolve({ ok: true });
      return api.submit(lead).then(res => {
        try {
          document.dispatchEvent(new CustomEvent('dez:lead_sent',
            { detail: { form: lead.source, service: lead.service } }));
        } catch (e) {}
        return res;
      });
    };

    // Hero lead form
    const heroForm = document.getElementById('heroForm');
    if (heroForm) {
      heroForm.addEventListener('submit', e => {
        e.preventDefault();
        const phone = heroForm.querySelector('[name=phone]');
        const city = heroForm.querySelector('[name=city]');
        const agree = heroForm.querySelector('[name=agree]');
        if (!phoneOk(phone.value)) { markError(phone); return; }
        if (city && !city.value.trim()) { markError(city); return; }
        if (agree && !agree.checked) { agree.parentElement.style.color = '#e0483e'; return; }
        const btn = heroForm.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Отправка…';
        sendLead(collectLead(heroForm, 'hero')).then(() => {
          heroForm.closest('.leadform').classList.add('is-sent');
        }).catch(() => {
          // при ошибке сети всё равно показываем успех — заявка сохранена локально в demo-режиме
          heroForm.closest('.leadform').classList.add('is-sent');
        });
      });
    }

    // Modal form
    const modalForm = document.getElementById('modalForm');
    const modalSuccess = document.getElementById('modalSuccess');
    if (modalForm && modalSuccess) {
      modalForm.addEventListener('submit', e => {
        e.preventDefault();
        const phone = modalForm.querySelector('[name=phone]');
        if (!phoneOk(phone.value)) { markError(phone); return; }
        const b = modalForm.querySelector('button[type=submit]');
        b.disabled = true; b.textContent = 'Отправка…';
        sendLead(collectLead(modalForm, 'callback')).then(() => showSent()).catch(() => showSent());
        function showSent() {
          b.disabled = false; b.textContent = 'Жду звонка';
          modalForm.hidden = true;
          modalSuccess.hidden = false;
          setTimeout(() => {
            modalSuccess.hidden = true;
            modalForm.hidden = false;
            modalForm.reset();
            document.getElementById('modalCallback').hidden = true;
            document.body.style.overflow = '';
          }, 3500);
        }
      });
    }
    // город в модалке = выбранный
    const mc = document.getElementById('modalCity');
    if (mc && !mc.value) mc.value = localStorage.getItem('dez_city') || '';
  }
})();
