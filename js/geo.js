/* ═══════════════════════════════════════
   Дез-Комфорт · geo.js — определение города
   Порядок: сохранённый выбор → ?city= в URL → GeoIP по IP → геолокация браузера → Москва.
   Открытый API (без ключей): ip-api.com (HTTP) + BigDataCloud (HTTPS-safe).
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  var STORE_KEY = 'dez_city';
  var MANUAL_KEY = 'dez_city_manual'; // город выбран вручную — не перекрывать автоопределением
  var DEFAULT_CITY = 'Москва';

  function getSaved() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function save(name) {
    try { localStorage.setItem(STORE_KEY, name); } catch (e) {}
  }
  /* Сохранить город как выбранный вручную (город больше не меняется автоматически) */
  function saveManual(name) {
    save(name);
    try { localStorage.setItem(MANUAL_KEY, '1'); } catch (e) {}
  }
  /* Сохранить город как определённый автоматически (можно перезаписать при следующем заходе) */
  function saveAuto(name) {
    save(name);
    try { localStorage.removeItem(MANUAL_KEY); } catch (e) {}
  }
  function isManual() {
    try { return localStorage.getItem(MANUAL_KEY) === '1'; } catch (e) { return false; }
  }
  function cityFromUrl() {
    try {
      var p = new URLSearchParams(location.search);
      return p.get('city') || p.get('gorod') || null;
    } catch (e) { return null; }
  }

  /* Приводим название от GeoIP к городу из справочника ("Химки"→"Химки", "Kazan"→"Казань") */
  function normalize(raw) {
    if (!raw) return null;
    var s = String(raw).trim();
    // транслит базовый для популярных случаев
    var translit = {
      moscow: 'Москва', spb: 'Санкт-Петербург', saintpetersburg: 'Санкт-Петербург',
      kazan: 'Казань', ekaterinburg: 'Екатеринбург', samara: 'Самара',ufa: 'Уфа',
      novosibirsk: 'Новосибирск', krasnodar: 'Краснодар', rostov: 'Ростов-на-Дону',
      nizhny: 'Нижний Новгород', voronezh: 'Воронеж', perm: 'Пермь', sochi: 'Сочи'
    };
    var low = s.toLowerCase().replace(/[^a-zа-яё -]/gi, '');
    for (var k in translit) if (low.indexOf(k) === 0) return translit[k];
    var found = window.DEZ_FIND_CITY(s);
    return found ? found.name : s; // если не нашли — вернём как есть
  }

  function fetchJson(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var ctrl = ('AbortController' in window) ? new AbortController() : null;
      var t = setTimeout(function () { if (ctrl) ctrl.abort(); reject(new Error('timeout')); }, timeoutMs || 3500);
      fetch(url, { signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { clearTimeout(t); resolve(d); })
        .catch(function (e) { clearTimeout(t); reject(e); });
    });
  }

  function detectByIp() {
    // HTTPS-безопасный вариант: BigDataCloud (бесплатно, без ключа)
    return fetchJson('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=ru', 3500)
      .then(function (d) { return d && (d.city || d.locality) ? d.city || d.locality : null; });
  }

  /* Кэш результата геолокации браузера (запрашиваем только при явном согласии пользователя) */
  var BROWSE_GEO_KEY = 'dez_geo_cache';

  function geoCacheGet() {
    try {
      var raw = JSON.parse(localStorage.getItem(BROWSE_GEO_KEY) || 'null');
      if (raw && raw.city && Date.now() - raw.ts < 24 * 3600 * 1000) return raw.city;
    } catch (e) {}
    return null;
  }
  function geoCacheSet(city) {
    try { localStorage.setItem(BROWSE_GEO_KEY, JSON.stringify({ city: city, ts: Date.now() })); } catch (e) {}
  }

  function reverseGeocode(lat, lon) {
    var la = Number(lat).toFixed(4), lo = Number(lon).toFixed(4);
    return fetchJson('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + la + '&longitude=' + lo + '&localityLanguage=ru', 3500)
      .then(function (d) { return (d && (d.city || d.locality)) || null; })
      .catch(function () { return null; });
  }

  /* Разрешение на геолокацию: запрашиваем ТОЛЬКО если пользователь уже дал согласие
     (сохранено в localStorage после разрешённого запроса). Иначе — сразу GeoIP по IP,
     чтобы браузер не показывал окно разрешения и автоопределение не «скачело» городами. */
  function detectByBrowserGeo(usePrompt) {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) return resolve(null);
      // если уже спрашивали ранее — не переспрашиваем каждый раз
      if (!usePrompt && localStorage.getItem('dez_geo_allowed') !== '1') return resolve(null);
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          try { localStorage.setItem('dez_geo_allowed', '1'); } catch (e) {}
          reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(resolve);
        },
        function () { resolve(null); },
        { timeout: 5000, maximumAge: 600000, enableHighAccuracy: false }
      );
    });
  }

  /* Публичное событие: сайт готов принять город */
  window.DEZ_GEO = {
    /* вернуть определённый город (Promise<string>) — ОДИН финальный результат, без «скачка»:
       1) ручной выбор пользователя (dez_city_manual) — не трогаем;
       2) кэш геолокации браузера (< 24 ч);
       3) ?city= из URL;
       4) геолокация браузера (только если разрешение уже дано ранее);
       5) GeoIP по IP;
       6) Москва.
       applyCity вызывается ровно один раз — город на экране не меняется после загрузки. */
    detect: function () {
      // город выбран вручную человеком — не трогаем
      if (isManual()) {
        var m = getSaved();
        if (m) return Promise.resolve(m);
      }
      // сохранённый авто-город с прошлого захода — показываем сразу (без скачка Москва→город)
      var savedAuto = getSaved();
      var urlCity = cityFromUrl();
      if (urlCity) { var n1 = normalize(urlCity); if (n1) { saveAuto(n1); return Promise.resolve(n1); } }

      var cachedGeo = geoCacheGet();
      if (cachedGeo) {
        var nc = normalize(cachedGeo);
        if (nc && window.DEZ_FIND_CITY(nc)) { saveAuto(nc); return Promise.resolve(nc); }
      }

      var base = savedAuto || DEFAULT_CITY; // мгновенный показ, пока идёт сетевой запрос
      var p = detectByBrowserGeo(false).then(function (raw) {
        var n = normalize(raw);
        if (n && window.DEZ_FIND_CITY(n)) { geoCacheSet(n); return n; }
        return detectByIp().then(function (raw2) {
          var n2 = normalize(raw2);
          if (n2 && window.DEZ_FIND_CITY(n2)) return n2;
          return null;
        });
      }).catch(function () { return null; });

      // финализируем ТОЛЬКО если город ещё не был выбран вручную во время запроса
      return new Promise(function (resolve) {
        p.then(function (detected) {
          if (isManual()) { resolve(getSaved() || detected || base); return; }
          var fin = detected || base;
          saveAuto(fin);
          resolve(fin);
        });
      });
    },
    /* принудительный запрос геолокации браузера с окном разрешения (по кнопке) */
    askGeolocation: function () {
      try { localStorage.removeItem('dez_geo_pending'); } catch (e) {}
      return detectByBrowserGeo(true).then(function (raw) {
        var n = normalize(raw);
        if (n && window.DEZ_FIND_CITY(n)) { geoCacheSet(n); saveAuto(n); return n; }
        return null;
      });
    },
    remember: save,          // сохранить как есть
    rememberManual: saveManual, // сохранение после ручного выбора пользователем
    rememberAuto: saveAuto,     // сохранение результата автоопределения
    isManual: isManual,
    DEFAULT: DEFAULT_CITY
  };
})();
