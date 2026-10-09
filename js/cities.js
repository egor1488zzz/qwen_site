/* ═══════════════════════════════════════
   Дез-Комфорт · cities.js
   Справочник городов присутствия.
   phone — местный номер офиса, displayPhone — как показывать.
   region — подпись в шапке; multiplier — коэффициент цен (для будущего).
   ═══════════════════════════════════════ */
window.DEZ_CITIES = [
  { name: 'Москва',           region: 'Москва и область',        phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00 },
  { name: 'Санкт-Петербург',  region: 'СПб и Ленинградская обл.', phone: '+78124567890', display: '+7 (812) 456-78-90', multiplier: 1.00 },
  { name: 'Казань',           region: 'Республика Татарстан',     phone: '+78432123456', display: '+7 (843) 212-34-56', multiplier: 0.85 },
  { name: 'Нижний Новгород',  region: 'Нижегородская область',    phone: '+78312123456', display: '+7 (831) 212-34-56', multiplier: 0.85 },
  { name: 'Екатеринбург',     region: 'Свердловская область',     phone: '+73432123456', display: '+7 (343) 212-34-56', multiplier: 0.90 },
  { name: 'Новосибирск',      region: 'Новосибирская область',    phone: '+73832123456', display: '+7 (383) 212-34-56', multiplier: 0.90 },
  { name: 'Краснодар',        region: 'Краснодарский край',       phone: '+78612123456', display: '+7 (861) 212-34-56', multiplier: 0.80 },
  { name: 'Ростов-на-Дону',   region: 'Ростовская область',       phone: '+78612123456', display: '+7 (861) 212-34-56', multiplier: 0.80 },
  { name: 'Самара',           region: 'Самарская область',        phone: '+78462123456', display: '+7 (846) 212-34-56', multiplier: 0.85 },
  { name: 'Уфа',              region: 'Республика Башкортостан',  phone: '+73472123456', display: '+7 (347) 212-34-56', multiplier: 0.85 },
  { name: 'Красноярск',       region: 'Красноярский край',        phone: '+73912123456', display: '+7 (391) 212-34-56', multiplier: 0.90 },
  { name: 'Воронеж',          region: 'Воронежская область',      phone: '+74732123456', display: '+7 (473) 212-34-56', multiplier: 0.80 },
  { name: 'Пермь',            region: 'Пермский край',            phone: '+73422123456', display: '+7 (342) 212-34-56', multiplier: 0.85 },
  { name: 'Волгоград',        region: 'Волгоградская область',    phone: '+78442123456', display: '+7 (844) 212-34-56', multiplier: 0.80 },
  { name: 'Саратов',          region: 'Саратовская область',      phone: '+78452123456', display: '+7 (845) 212-34-56', multiplier: 0.80 },
  { name: 'Омск',             region: 'Омская область',           phone: '+73812123456', display: '+7 (381) 212-34-56', multiplier: 0.85 },
  { name: 'Тюмень',           region: 'Тюменская область',        phone: '+73452123456', display: '+7 (345) 212-34-56', multiplier: 0.90 },
  { name: 'Ижевск',           region: 'Удмуртская Республика',    phone: '+73412123456', display: '+7 (341) 212-34-56', multiplier: 0.80 },
  { name: 'Барнаул',          region: 'Алтайский край',           phone: '+73852123456', display: '+7 (385) 212-34-56', multiplier: 0.85 },
  { name: 'Ульяновск',        region: 'Ульяновская область',      phone: '+78422123456', display: '+7 (842) 212-34-56', multiplier: 0.80 },
  { name: 'Иркутск',          region: 'Иркутская область',        phone: '+73952123456', display: '+7 (395) 212-34-56', multiplier: 0.90 },
  { name: 'Хабаровск',        region: 'Хабаровский край',         phone: '+74212123456', display: '+7 (421) 212-34-56', multiplier: 0.95 },
  { name: 'Ярославль',        region: 'Ярославская область',      phone: '+74852123456', display: '+7 (485) 212-34-56', multiplier: 0.80 },
  { name: 'Владивосток',      region: 'Приморский край',          phone: '+74232123456', display: '+7 (423) 212-34-56', multiplier: 0.95 },
  { name: 'Махачкала',        region: 'Республика Дагестан',      phone: '+78722123456', display: '+7 (872) 212-34-56', multiplier: 0.75 },
  { name: 'Томск',            region: 'Томская область',          phone: '+73822123456', display: '+7 (382) 212-34-56', multiplier: 0.85 },
  { name: 'Оренбург',         region: 'Оренбургская область',     phone: '+73532123456', display: '+7 (353) 212-34-56', multiplier: 0.80 },
  { name: 'Кемерово',         region: 'Кемеровская область',      phone: '+73842123456', display: '+7 (384) 212-34-56', multiplier: 0.85 },
  { name: 'Ставрополь',       region: 'Ставропольский край',      phone: '+78652123456', display: '+7 (865) 212-34-56', multiplier: 0.80 },
  { name: 'Сочи',             region: 'Краснодарский край',       phone: '+78622123456', display: '+7 (862) 212-34-56', multiplier: 0.85 },
  { name: 'Тула',             region: 'Тульская область',         phone: '+74872123456', display: '+7 (487) 212-34-56', multiplier: 0.80 },
  { name: 'Калининград',      region: 'Калининградская область',  phone: '+74012123456', display: '+7 (401) 212-34-56', multiplier: 0.85 },
  { name: 'Брянск',           region: 'Брянская область',         phone: '+74832123456', display: '+7 (483) 212-34-56', multiplier: 0.75 },
  { name: 'Белгород',         region: 'Белгородская область',     phone: '+74722123456', display: '+7 (472) 212-34-56', multiplier: 0.80 },
  { name: 'Сургут',           region: 'ХМАО — Югра',              phone: '+73462123456', display: '+7 (346) 212-34-56', multiplier: 0.95 },
  { name: 'Липецк',           region: 'Липецкая область',         phone: '+74742123456', display: '+7 (474) 212-34-56', multiplier: 0.80 },
  { name: 'Курск',            region: 'Курская область',          phone: '+74712123456', display: '+7 (471) 212-34-56', multiplier: 0.75 },
  { name: 'Тверь',            region: 'Тверская область',         phone: '+74822123456', display: '+7 (482) 212-34-56', multiplier: 0.80 },
  { name: 'Нижневартовск',    region: 'ХМАО — Югра',              phone: '+73466123456', display: '+7 (3466) 12-34-56', multiplier: 0.95 },
  { name: 'Дмитров',          region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00 },
  { name: 'Подольск',         region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00 },
  { name: 'Химки',            region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00 },
  { name: 'Мытищи',           region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00 },
  { name: 'Люберцы',          region: 'Московская область',       phone: '+74951204567', display: '+7 (495) 120-45-67', multiplier: 1.00 },
  { name: 'Калуга',           region: 'Калужская область',        phone: '+74842123456', display: '+7 (484) 212-34-56', multiplier: 0.80 }
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
