/* ═══════════════════════════════════════
   Дез-Комфорт · config.js — интеграции
   Замените значения на свои ключи после регистрации сервисов.
   Пустые строки = интеграция отключена (сайт работает без них).
   ═══════════════════════════════════════ */
window.DEZ_CONFIG = {

  /* 1. Приём заявок. Варианты:
     'demo'    — имитация (заявки в localStorage, для GitHub Pages)
     'endpoint'— POST JSON на ваш бэкенд (backend/api.php или Node)
     'telegram'— прямая отправка в Telegram через Bot API (без сервера!)
       ⚠ Для telegram-варианта публичный токен виден в коде — используйте
         отдельного бота только для входящих заявок. */
  leadMode: 'endpoint',                // на сервере заявки идут в api.php; ниже — авто-откат в demo на GitHub Pages
  leadEndpoint: '/api.php',            // URL бэкенда при leadMode='endpoint' (файл лежит в корне сайта)
  serverApi: 'http://2.26.10.224',     // ⚑ IP сервера — заявки с GitHub Pages уходят на ваш бэкенд.
                                       //   Когда подключите домен+HTTPS, замените на 'https://ваш-домен.ru'
                                       //   (и добавьте новый адрес в белый список CORS в api.php / DEZ_CORS_ALLOW).

  telegram: {
    botToken: '',                      // '123456789:AA...токен бота' — заполните, и тогда с GitHub Pages заявки будут падать вам в Telegram (режим telegram включится автоматически)
    chatId: ''                         // '-1001234567890' (id вашего чата/канала)
  },

  /* 2. CRM. Поддерживаются amoCRM / Bitrix24 — webhook-URL из настроек CRM.
     Пустая строка = не отправлять. Заявка уходит и на leadEndpoint, и в CRM. */
  crmWebhook: '',                      // напр. 'https://вашаккаунт.amocru.ru/api/v2/leads/_webhook'

  /* 3. Яндекс.Карты. Бесплатный ключ JS API: https://developer.tech.yandex.ru/
     Без ключа показывается статичная карта (url-конструктор, тоже бесплатный). */
  yandexMapsApiKey: '',

  /* 4. Мессенджеры. */
  telegramUsername: 'SiteDezComfort_bot', // юзернейм Telegram-бота ( DezComfort )
  maxUsername: '',                        // ⚑ Юзернейм MAX-мессенджера (например, 'dezcomfort').
                                          //   Пока пусто — кнопка MAX ведёт на общий чат support.max.ru
  vkGroupId: 'dezkomfort',

  /* 4a. Головной офис (локация на карте и в контактах). */
  officeAddress: 'Солнечная улица, Сосновоборск, Красноярский край',
  officeLat: 56.116639,
  officeLon: 93.342053,

  /* 5. Сквозная аналитика. Вставьте id Яндекс.Метрики и Google Analytics.
     0 / '' = счётчики не подключены. */
  yaMetrikaId: 0,                      // напр. 98765432
  gtagId: '',                          // напр. 'G-XXXXXXXXXX'
  calltouchKey: '',                    // опционально: коллтрекинг Calltouch

  /* 6. Личный кабинет: адрес бэкенда с токенами клиентов. */
  cabinetUrl: '/cabinet/',             // страница кабинета (серверная часть в backend/)

  /* 7. Домен для canonical/og и мультиязычных страниц городов. */
  siteUrl: 'https://egor1488zzz.github.io/qwen_site/'
};
