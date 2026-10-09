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
    burger.addEventListener('click', () => {
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
      areaVal.textContent = a;
      result.textContent = discounted.toLocaleString('ru-RU') + ' ₽';
      old.textContent = price > discounted ? price.toLocaleString('ru-RU') + ' ₽' : '';
    }
    service.addEventListener('change', calc);
    area.addEventListener('input', calc);
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

  /* ── Forms validation & fake submit ── */
  function initForms() {
    const phoneOk = v => v.replace(/\D/g, '').length === 11;

    const markError = el => {
      el.classList.add('is-error');
      el.addEventListener('input', () => el.classList.remove('is-error'), { once: true });
    };

    // Hero lead form
    const heroForm = document.getElementById('heroForm');
    if (heroForm) {
      heroForm.addEventListener('submit', e => {
        e.preventDefault();
        const phone = heroForm.querySelector('[name=phone]');
        const agree = heroForm.querySelector('[name=agree]');
        if (!phoneOk(phone.value)) { markError(phone); return; }
        if (agree && !agree.checked) { agree.parentElement.style.color = '#e0483e'; return; }
        // success state
        heroForm.closest('.leadform').classList.add('is-sent');
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
        modalForm.hidden = true;
        modalSuccess.hidden = false;
        setTimeout(() => {
          modalSuccess.hidden = true;
          modalForm.hidden = false;
          modalForm.reset();
          document.getElementById('modalCallback').hidden = true;
          document.body.style.overflow = '';
        }, 3500);
      });
    }
  }
})();
