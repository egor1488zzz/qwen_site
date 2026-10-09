/* ═══════════════════════════════════════
   Дез-Комфорт · geo.js — определение города
   Порядок: сохранённый выбор → ?city= в URL → GeoIP по IP → геолокация браузера → Москва.
   Открытый API (без ключей): ip-api.com (HTTP) + BigDataCloud (HTTPS-safe).
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  var STORE_KEY = 'dez_city';
  var DEFAULT_CITY = 'Москва';

  function getSaved() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function save(name) {
    try { localStorage.setItem(STORE_KEY, name); } catch (e) {}
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

  function detectByBrowserGeo() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var la = pos.coords.latitude.toFixed(4), lo = pos.coords.longitude.toFixed(4);
          fetchJson('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + la + '&longitude=' + lo + '&localityLanguage=ru', 3500)
            .then(function (d) { resolve(d && (d.city || d.locality) || null); })
            .catch(function () { resolve(null); });
        },
        function () { resolve(null); },
        { timeout: 4000, maximumAge: 600000 }
      );
    });
  }

  /* Публичное событие: сайт готов принять город */
  window.DEZ_GEO = {
    /* вернуть определённый город (Promise<string>) */
    detect: function () {
      var saved = getSaved();
      if (saved) return Promise.resolve(saved);
      var urlCity = cityFromUrl();
      if (urlCity) { var n1 = normalize(urlCity); if (n1) { save(n1); return Promise.resolve(n1); } }
      return detectByIp()
        .then(function (raw) {
          var n = normalize(raw);
          if (n && window.DEZ_FIND_CITY(n)) { save(n); return n; }
          return detectByBrowserGeo().then(function (raw2) {
            var n2 = normalize(raw2);
            if (n2 && window.DEZ_FIND_CITY(n2)) { save(n2); return n2; }
            return DEFAULT_CITY;
          });
        })
        .catch(function () { return DEFAULT_CITY; });
    },
    remember: save,
    DEFAULT: DEFAULT_CITY
  };
})();
