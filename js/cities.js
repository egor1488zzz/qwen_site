/* ═══════════════════════════════════════
   Дез-Комфорт · cities.js
   Справочник городов присутствия.
   phone — местный номер офиса, displayPhone — как показывать.
   region — подпись в шапке; multiplier — коэффициент цен (для будущего).
   ═══════════════════════════════════════ */
/* address — реальный адрес филиала; lat/lon — координаты для Яндекс.Карт;
   messenger — контактный номер филиала; slug — для URL /cities/ */
window.DEZ_CITIES = [
  { name: 'Москва',           region: 'Москва и область',        phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00, address: 'Москва, ул. Промышленная, 12, стр. 3, офис 210', lat: 55.7091, lon: 37.7452, messenger: '+79165550192', slug: 'moskva' },
  { name: 'Санкт-Петербург',  region: 'СПб и Ленинградская обл.', phone: '+78124567890', display: '+7 (812) 456-78-90', multiplier: 1.00, address: 'Санкт-Петербург, наб. Обводного канала, 118, лит. Б', lat: 59.9060, lon: 30.3510, messenger: '+79215550192', slug: 'spb' },
  { name: 'Казань',           region: 'Республика Татарстан',     phone: '+78432123456', display: '+7 (843) 212-34-56', multiplier: 0.85, address: 'Казань, ул. Дементьева, 1в', lat: 55.7801, lon: 49.1219, messenger: '+79175550192', slug: 'kazan' },
  { name: 'Нижний Новгород',  region: 'Нижегородская область',    phone: '+78312123456', display: '+7 (831) 212-34-56', multiplier: 0.85, address: 'Нижний Новгород, ул. Родионова, 19, корп. 5', lat: 56.2965, lon: 43.9367, messenger: '+79205550192', slug: 'nnovgorod' },
  { name: 'Екатеринбург',     region: 'Свердловская область',     phone: '+73432123456', display: '+7 (343) 212-34-56', multiplier: 0.90, address: 'Екатеринбург, ул. Малышева, 145', lat: 56.8389, lon: 60.6057, messenger: '+79125550192', slug: 'ekb' },
  { name: 'Новосибирск',      region: 'Новосибирская область',    phone: '+73832123456', display: '+7 (383) 212-34-56', multiplier: 0.90, address: 'Новосибирск, ул. Станционная, 60/1', lat: 55.0084, lon: 82.9357, messenger: '+79135550192', slug: 'nsk' },
  { name: 'Краснодар',        region: 'Краснодарский край',       phone: '+78612123456', display: '+7 (861) 212-34-56', multiplier: 0.80, address: 'Краснодар, ул. Уральская, 75/1', lat: 45.0445, lon: 38.9760, messenger: '+79185550192', slug: 'krasnodar' },
  { name: 'Ростов-на-Дону',   region: 'Ростовская область',       phone: '+78612123456', display: '+7 (861) 212-34-56', multiplier: 0.80, address: 'Ростов-на-Дону, пр. Стачки, 240', lat: 47.2357, lon: 39.7015, messenger: '+79285550192', slug: 'rostov' },
  { name: 'Самара',           region: 'Самарская область',        phone: '+78462123456', display: '+7 (846) 212-34-56', multiplier: 0.85, address: 'Самара, Московское шоссе, 18-й км', lat: 53.2000, lon: 50.1500, messenger: '+79275550192', slug: 'samara' },
  { name: 'Уфа',              region: 'Республика Башкортостан',  phone: '+73472123456', display: '+7 (347) 212-34-56', multiplier: 0.85, address: 'Уфа, ул. Рихарда Зорге, 12', lat: 54.7388, lon: 55.9721, messenger: '+79175550193', slug: 'ufa' },
  { name: 'Красноярск',       region: 'Красноярский край',        phone: '+73912123456', display: '+7 (391) 212-34-56', multiplier: 0.90, address: 'Солнечная улица, Сосновоборск, Красноярский край (головной офис)', lat: 56.116639, lon: 93.342053, messenger: '+79025550192', slug: 'krsk' },
  { name: 'Воронеж',          region: 'Воронежская область',      phone: '+74732123456', display: '+7 (473) 212-34-56', multiplier: 0.80, address: 'Воронеж, ул. Острогожская, 79', lat: 51.6720, lon: 39.2090, messenger: '+79515550192', slug: 'voronezh' },
  { name: 'Пермь',            region: 'Пермский край',            phone: '+73422123456', display: '+7 (342) 212-34-56', multiplier: 0.85, address: 'Пермь, ул. Мостовая, 118', lat: 58.0105, lon: 56.2502, messenger: '+79025550193', slug: 'perm' },
  { name: 'Волгоград',        region: 'Волгоградская область',    phone: '+78442123456', display: '+7 (844) 212-34-56', multiplier: 0.80, address: 'Волгоград, ул. Рабоче-Крестьянская, 15', lat: 48.7080, lon: 44.5133, messenger: '+79025550194', slug: 'volgograd' },
  { name: 'Саратов',          region: 'Саратовская область',      phone: '+78452123456', display: '+7 (845) 212-34-56', multiplier: 0.80, address: 'Саратов, ул. Чернышевского, 96', lat: 51.5922, lon: 46.0347, messenger: '+79275550193', slug: 'saratov' },
  { name: 'Омск',             region: 'Омская область',           phone: '+73812123456', display: '+7 (381) 212-34-56', multiplier: 0.85, address: 'Омск, ул. Красный Путь, 105', lat: 54.9885, lon: 73.3685, messenger: '+79135550193', slug: 'omsk' },
  { name: 'Тюмень',           region: 'Тюменская область',        phone: '+73452123456', display: '+7 (345) 212-34-56', multiplier: 0.90, address: 'Тюмень, ул. Республики, 142', lat: 57.1530, lon: 65.5340, messenger: '+79125550193', slug: 'tmn' },
  { name: 'Ижевск',           region: 'Удмуртская Республика',    phone: '+73412123456', display: '+7 (341) 212-34-56', multiplier: 0.80, address: 'Ижевск, ул. Воткинское шоссе, 170', lat: 56.8619, lon: 53.2320, messenger: '+79125550194', slug: 'izhevsk' },
  { name: 'Барнаул',          region: 'Алтайский край',           phone: '+73852123456', display: '+7 (385) 212-34-56', multiplier: 0.85, address: 'Барнаул, пр. Ленина, 115', lat: 53.3547, lon: 83.7698, messenger: '+79135550194', slug: 'barnaul' },
  { name: 'Ульяновск',        region: 'Ульяновская область',      phone: '+78422123456', display: '+7 (842) 212-34-56', multiplier: 0.80, address: 'Ульяновск, Московское шоссе, 2', lat: 54.3282, lon: 48.3842, messenger: '+79275550194', slug: 'ulyanovsk' },
  { name: 'Иркутск',          region: 'Иркутская область',        phone: '+73952123456', display: '+7 (395) 212-34-56', multiplier: 0.90, address: 'Иркутск, ул. Трилиссера, 59', lat: 52.2780, lon: 104.2750, messenger: '+79025550195', slug: 'irkutsk' },
  { name: 'Хабаровск',        region: 'Хабаровский край',         phone: '+74212123456', display: '+7 (421) 212-34-56', multiplier: 0.95, address: 'Хабаровск, ул. Краснореченская, 136', lat: 48.4802, lon: 135.0719, messenger: '+79145550192', slug: 'hvsk' },
  { name: 'Ярославль',        region: 'Ярославская область',      phone: '+74852123456', display: '+7 (485) 212-34-56', multiplier: 0.80, address: 'Ярославль, ул. Чехова, 2', lat: 57.6261, lon: 39.8845, messenger: '+79105550192', slug: 'yaroslavl' },
  { name: 'Владивосток',      region: 'Приморский край',          phone: '+74232123456', display: '+7 (423) 212-34-56', multiplier: 0.95, address: 'Владивосток, ул. Стрельникова, 6', lat: 43.1155, lon: 131.8855, messenger: '+79145550193', slug: 'vdk' },
  { name: 'Махачкала',        region: 'Республика Дагестан',      phone: '+78722123456', display: '+7 (872) 212-34-56', multiplier: 0.75, address: 'Махачкала, пр. Имама Шамиля, 10', lat: 42.9849, lon: 47.5047, messenger: '+79285550193', slug: 'mkhl' },
  { name: 'Томск',            region: 'Томская область',          phone: '+73822123456', display: '+7 (382) 212-34-56', multiplier: 0.85, address: 'Томск, Иркутский тракт, 178', lat: 56.4847, lon: 84.9483, messenger: '+79135550195', slug: 'tomsk' },
  { name: 'Оренбург',         region: 'Оренбургская область',     phone: '+73532123456', display: '+7 (353) 212-34-56', multiplier: 0.80, address: 'Оренбург, ул. Шарнышина, 2', lat: 51.7727, lon: 55.0988, messenger: '+79125550195', slug: 'orenburg' },
  { name: 'Кемерово',         region: 'Кемеровская область',      phone: '+73842123456', display: '+7 (384) 212-34-56', multiplier: 0.85, address: 'Кемерово, пр. Октябрьский, 32', lat: 55.3547, lon: 86.0873, messenger: '+79065550192', slug: 'kem' },
  { name: 'Ставрополь',       region: 'Ставропольский край',      phone: '+78652123456', display: '+7 (865) 212-34-56', multiplier: 0.80, address: 'Ставрополь, ул. Доваторцев, 47а', lat: 44.0486, lon: 43.0510, messenger: '+79185550193', slug: 'stv' },
  { name: 'Сочи',             region: 'Краснодарский край',       phone: '+78622123456', display: '+7 (862) 212-34-56', multiplier: 0.85, address: 'Сочи, ул. Горная, 1', lat: 43.5855, lon: 39.7231, messenger: '+79185550194', slug: 'sochi' },
  { name: 'Тула',             region: 'Тульская область',         phone: '+74872123456', display: '+7 (487) 212-34-56', multiplier: 0.80, address: 'Тула, пр. Ленина, 85', lat: 54.1961, lon: 37.6182, messenger: '+79535550192', slug: 'tula' },
  { name: 'Калининград',      region: 'Калининградская область',  phone: '+74012123456', display: '+7 (401) 212-34-56', multiplier: 0.85, address: 'Калининград, ул. Демьяна, 3', lat: 54.7104, lon: 20.4522, messenger: '+79115550192', slug: 'klgd' },
  { name: 'Брянск',           region: 'Брянская область',         phone: '+74832123456', display: '+7 (483) 212-34-56', multiplier: 0.75, address: 'Брянск, ул. Дуки, 65', lat: 53.2435, lon: 34.3637, messenger: '+79035550192', slug: 'bryansk' },
  { name: 'Белгород',         region: 'Белгородская область',     phone: '+74722123456', display: '+7 (472) 212-34-56', multiplier: 0.80, address: 'Белгород, ул. Королева, 2', lat: 50.5979, lon: 36.5858, messenger: '+79525550192', slug: 'belgorod' },
  { name: 'Сургут',           region: 'ХМАО — Югра',              phone: '+73462123456', display: '+7 (346) 212-34-56', multiplier: 0.95, address: 'Сургут, ул. Университетская, 2', lat: 61.2870, lon: 73.3933, messenger: '+79125550196', slug: 'surgut' },
  { name: 'Липецк',           region: 'Липецкая область',         phone: '+74742123456', display: '+7 (474) 212-34-56', multiplier: 0.80, address: 'Липецк, ул. Инициативная, 1', lat: 52.6031, lon: 39.5708, messenger: '+79515550193', slug: 'lipetsk' },
  { name: 'Курск',            region: 'Курская область',          phone: '+74712123456', display: '+7 (471) 212-34-56', multiplier: 0.75, address: 'Курск, ул. 50 лет Октября, 116', lat: 51.7304, lon: 36.1947, messenger: '+79505550192', slug: 'kursk' },
  { name: 'Тверь',            region: 'Тверская область',         phone: '+74822123456', display: '+7 (482) 212-34-56', multiplier: 0.80, address: 'Тверь, наб. Афанасия Никитина, 4', lat: 56.8604, lon: 35.9010, messenger: '+79105550193', slug: 'tver' },
  { name: 'Нижневартовск',    region: 'ХМАО — Югра',              phone: '+73466123456', display: '+7 (3466) 12-34-56', multiplier: 0.95, address: 'Нижневартовск, ул. Маршала Жукова, 22', lat: 60.9340, lon: 76.5260, messenger: '+79125550197', slug: 'nvart' },
  { name: 'Дмитров',          region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00, address: 'Дмитров, ул. Московская, 5', lat: 56.3439, lon: 37.5203, messenger: '+79165550193', slug: 'dmitrov' },
  { name: 'Подольск',         region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00, address: 'Подольск, ул. Кирова, 27', lat: 55.4288, lon: 37.5470, messenger: '+79165550194', slug: 'podolsk' },
  { name: 'Химки',            region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00, address: 'Химки, ул. Электронная, 2', lat: 55.8890, lon: 37.4390, messenger: '+79165550195', slug: 'himki' },
  { name: 'Мытищи',           region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00, address: 'Мытищи, Осташковское ш., 10', lat: 55.9103, lon: 37.7360, messenger: '+79165550196', slug: 'mytishchi' },
  { name: 'Люберцы',          region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00, address: 'Люберцы, Октябрьский пр., 190', lat: 55.6770, lon: 37.8950, messenger: '+79165550197', slug: 'lyubercy' },
  { name: 'Калуга',           region: 'Калужская область',        phone: '+74842123456', display: '+7 (484) 212-34-56', multiplier: 0.80, address: 'Калуга, ул. Гагарина, 13', lat: 54.5293, lon: 36.2754, messenger: '+79105550194', slug: 'kaluga' }
];

/* Быстрый поиск города по названию (без учёта падежа/опечаток — префиксный матчинг) */
window.DEZ_FIND_CITY = function (query) {
  if (!query) return null;
  var q = String(query).toLowerCase().replace(/ё/g, 'е').trim();
  var list = window.DEZ_CITIES;
  for (var i = 0; i < list.length; i++) {
    if (list[i].name.toLowerCase().replace(/ё/g, 'е') === q) return list[i];
  }
  for (var j = 0; j < list.length; j++) {
    if (list[j].name.toLowerCase().replace(/ё/g, 'е').indexOf(q) === 0) return list[j];
  }
  return null;
};
