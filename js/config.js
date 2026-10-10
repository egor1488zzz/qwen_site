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
  leadMode: 'demo',                    // 'demo' | 'endpoint' | 'telegram'
  leadEndpoint: '/api.php',            // URL бэкенда при leadMode='endpoint' (файл лежит в корне сайта)

  telegram: {
    botToken: '',                      // '123456789:AA...токен бота'
    chatId: ''                         // '-1001234567890' (id вашего чата/канала)
  },

  /* 2. CRM. Поддерживаются amoCRM / Bitrix24 — webhook-URL из настроек CRM.
     Пустая строка = не отправлять. Заявка уходит и на leadEndpoint, и в CRM. */
  crmWebhook: '',                      // напр. 'https://вашаккаунт.amocru.ru/api/v2/leads/_webhook'

  /* 3. Яндекс.Карты. Бесплатный ключ JS API: https://developer.tech.yandex.ru/
     Без ключа показывается статичная карта (url-конструктор, тоже бесплатный). */
  yandexMapsApiKey: '',

  /* 4. Мессенджеры (номер филиала подставляется автоматически из cities.js). */
  whatsappNumber: '+79165550192',      // номер по умолчанию (Москва)
  telegramUsername: 'dez_komfort_bot', // юзернейм Telegram-бота/канала
  vkGroupId: 'dezkomfort',

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
