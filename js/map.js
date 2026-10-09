/* ═══════════════════════════════════════
   Дез-Комфорт · map.js — живая Яндекс.Карта (пункт 3)
   • Если в config.js задан yandexMapsApiKey — интерактивная карта
     с меткой филиала выбранного города (синхронизируется с geo.js).
   • Иначе — статичная карта через бесплатный url-конструктор
     (https://yandex.ru/map-widget/v1), работает без ключа и сразу.
   Публичная функция: DEZ_MAP.show(cityObj) — переключение метки.
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  var cfg = window.DEZ_CONFIG || {};
  var box = document.getElementById('ymaps');
  if (!box) return; // на страницах городов карты нет

  var current = null;  // активный город
  var ymap = null;     // экземпляр интерактивной карты
  var placemark = null;

  function fallbackStatic(c) {
    // Статичная/виджет-карта без ключа API: конструктор URL Яндекса
    var lat = c.lat, lon = c.lon;
    var src = 'https://yandex.ru/map-widget/v1/?ll=' + [lon, lat].join('%2C') +
      '&z=11&pt=' + [lon, lat, 'pm2rdm'].join('%2C');
    box.innerHTML =
      '<iframe title="Карта: ' + c.name + '" src="' + src + '" loading="lazy" ' +
      'style="width:100%;height:100%;border:0;border-radius:20px"></iframe>' +
      '<div class="ymaps-badge">📍 ' + (c.address || c.name) + '</div>';
  }

  function loadYmapsApi(onReady) {
    if (window.ymaps && window.ymaps.Map) return onReady();
    var s = document.createElement('script');
    s.src = 'https://api-maps.yandex.ru/2.1/?apikey=' + encodeURIComponent(cfg.yandexMapsApiKey) + '&lang=ru_RU';
    s.onload = function () { window.ymaps.ready(onReady); };
    s.onerror = function () { fallbackStatic(current || defaultCity()); };
    document.head.appendChild(s);
  }

  function defaultCity() {
    var name = localStorage.getItem('dez_city') || 'Москва';
    var list = window.DEZ_CITIES || [];
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return list[0];
  }

  function showInteractive(c) {
    if (!ymap) {
      ymap = new ymaps.Map('ymaps', { center: [c.lat, c.lon], zoom: 11, controls: ['zoomControl'] });
    }
    ymap.setCenter([c.lat, c.lon], 11, { duration: 400 });
    var balloon = '<b>Дез-Комфорт · ' + c.name + '</b><br>' + (c.address || '') + '<br>☎ ' + (c.display || '');
    if (placemark) { placemark.geometry.setCoordinates([c.lat, c.lon]); placemark.properties.set({ balloonContent: balloon, hintContent: c.name }); }
    else {
      placemark = new ymaps.Placemark([c.lat, c.lon], { balloonContent: balloon, hintContent: c.name },
        { preset: 'islands#greenCircleIcon' });
      ymap.geoObjects.add(placemark);
    }
    placemark.balloon.open();
  }

  window.DEZ_MAP = {
    show: function (cityObj) {
      if (!cityObj) return;
      current = cityObj;
      if (cfg.yandexMapsApiKey) {
        if (window.ymaps) showInteractive(cityObj);
        else loadYmapsApi(function () { showInteractive(cityObj); });
      } else {
        fallbackStatic(cityObj);
      }
    }
  };

  /* Стартовая точка — город из geo.js (или Москва) */
  var start = defaultCity();
  window.DEZ_MAP.show(start);

  /* Реагируем на смену города (событие от geo.js / main.js) */
  document.addEventListener('dez:city', function (e) {
    var list = window.DEZ_CITIES || [];
    for (var i = 0; i < list.length; i++) if (list[i].name === e.detail) { window.DEZ_MAP.show(list[i]); break; }
  });
})();
