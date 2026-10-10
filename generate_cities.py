#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Дез-Комфорт · generate_cities.py
Генерирует SEO-посадочные страницы cities/<slug>.html для каждого города
из js/cities.js (мультиязычные региональные лендинги, пункт 5 плана).

Запуск:  python3 generate_cities.py
Результат: cities/moskva.html, cities/kazan.html, ... + cities/index.html
"""
import json, re, os, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(ROOT, 'js', 'cities.js'), encoding='utf-8').read()

# Извлекаем массив DEZ_CITIES из JS
m = re.search(r'window\.DEZ_CITIES\s*=\s*(\[.*?\n\]);', SRC, re.S)
raw = m.group(1)
# JS -> JSON: ключи без кавычек берём в двойные, одинарные кавычки значений -> двойные
raw = re.sub(r'([{,]\s*)(\w+):', r'\1"\2":', raw)
raw = raw.replace("'", '"')
CITIES = json.loads(raw)

YEAR = datetime.date.today().year
BASE = '..'  # относительно cities/ все пути ../index.html, ../css/style.css

SERVICES = [
    ('Тараканы', 'Уничтожение тараканов', 1800, 'Гель от тараканов не помогает? Холодный и горячий туман уничтожают колонии даже в запущенных случаях — включая соседей по стояку.'),
    ('Клопы', 'Уничтожение клопов', 2200, 'Клопы исчезают за одну обработку: препарат работает и с яйцами через повторный визит по гарантии — бесплатно.'),
    ('Муравьи', 'Уничтожение муравьёв', 1500, 'Разрушаем муравьиные тропы и гнёзда приманками с доставкой яда внутрь колонии — без повторов каждые 2 недели.'),
    ('Блохи', 'Уничтожение блох', 1700, 'Обрабатываем полы, щели, подвалы и ковры. Блохи уходят вместе с клещами и мошкой — за один визит.'),
    ('Комары и клещи', 'Обработка участка', 3000, 'Барьерная защита участка до 6 недель. Можно заказать срочную обработку к празднику в день обращения.'),
    ('Для бизнеса', 'Дезинсекция для организаций', 3500, 'Договорное обслуживание по СанПиН, документы для Роспотребнадзора, ночные обработки без остановки работы.'),
]

PREP = {  # предлог «в ...» для названий городов
    'Москва': 'Москве', 'Санкт-Петербург': 'Санкт-Петербурге', 'Казань': 'Казани',
    'Нижний Новгород': 'Нижнем Новгороде', 'Екатеринбург': 'Екатеринбурге',
    'Новосибирск': 'Новосибирске', 'Краснодар': 'Краснодаре', 'Ростов-на-Дону': 'Ростове-на-Дону',
    'Самара': 'Самаре', 'Уфа': 'Уфе', 'Красноярск': 'Красноярске', 'Воронеж': 'Воронеже',
    'Пермь': 'Перми', 'Волгоград': 'Волгограде', 'Саратов': 'Саратове', 'Омск': 'Омске',
    'Тюмень': 'Тюмени', 'Ижевск': 'Ижевске', 'Барнаул': 'Барнауле', 'Ульяновск': 'Ульяновске',
    'Иркутск': 'Иркутске', 'Хабаровск': 'Хабаровске', 'Ярославль': 'Ярославле',
    'Владивосток': 'Владивостоке', 'Махачкала': 'Махачкале', 'Томск': 'Томске',
    'Оренбург': 'Оренбурге', 'Кемерово': 'Кемерове', 'Ставрополь': 'Ставрополе',
    'Сочи': 'Сочи', 'Тула': 'Туле', 'Калининград': 'Калининграде', 'Брянск': 'Брянске',
    'Белгород': 'Белгороде', 'Сургут': 'Сургуте', 'Липецк': 'Липецке', 'Курск': 'Курске',
    'Тверь': 'Твери', 'Нижневартовск': 'Нижневартовске', 'Дмитров': 'Дмитрове',
    'Подольск': 'Подольске', 'Химки': 'Химках', 'Мытищи': 'Мытищах', 'Люберцы': 'Люберцах',
    'Калуга': 'Калуге',
}

def price_row(c, base):
    p = int(round(base * c['multiplier'] / 50) * 50)
    return f'{p:,}'.replace(',', ' ') + ' ₽'

def city_page(c, site_url):
    name = c['name']; prep = PREP.get(name, name)
    title = f"Дезинсекция в {prep} — уничтожение насекомых | Дез-Комфорт"
    desc = (f"Служба дезинсекции «Дез-Комфорт» в городе {name}: уничтожение тараканов, клопов, муравьёв, блох. "
            f"Безопасные препараты, гарантия до 12 месяцев, выезд за 60 минут. Тел: {c['display']}")
    svc_cards = '\n'.join(f'''      <a class="scard" href="{BASE}/index.html#services">
        <h3>{label}</h3><p>{text}</p><span class="scard__price">от {price_row(c, base)}</span></a>''' for _k, label, base, text in SERVICES)
    office = f"{c.get('address','')}"
    rows = '\n'.join(f"<tr><td>{label}</td><td>от {price_row(c, base)}</td></tr>" for _k, label, base, _t in SERVICES)
    other = ' '.join(f'<a href="{x["slug"]}.html">{x["name"]}</a>' for x in CITIES if x['slug'] != c['slug'])[:2000]
    wa_digits = re.sub(r'\D', '', c['messenger'])[1:]
    return f'''<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{site_url}cities/{c['slug']}.html">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{BASE}/css/style.css">
</head>
<body>
<header class="header is-scrolled"><div class="container header__inner">
  <a class="logo" href="{BASE}/index.html"><span class="logo__icon">🛡️</span><span class="logo__text">Дез<b>-Комфорт</b></span></a>
  <nav class="nav"><a href="{BASE}/index.html#services">Услуги</a><a href="{BASE}/index.html#prices">Цены</a><a href="{BASE}/index.html#contacts">Контакты</a></nav>
  <a class="header__phone" href="tel:{c['phone']}">{c['display']}</a>
</div></header>

<section class="hero"><div class="container hero__inner"><div class="hero__content">
  <span class="badge badge--green">Филиал в городе {name} · {c['region']}</span>
  <h1 class="hero__title">Дезинсекция в {prep}<br><span>за одну обработку, с гарантией</span></h1>
  <p class="hero__subtitle">Местная служба «Дез-Комфорт»: уничтожаем тараканов, клопов, муравьёв и блох в квартирах, домах и организациях. Выезд мастера по {name} — в течение 60 минут.</p>
  <div class="hero__buttons">
    <a href="tel:{c['phone']}" class="btn btn--primary btn--lg">📞 {c['display']}</a>
    <a href="{BASE}/index.html#prices" class="btn btn--ghost btn--lg">Все цены</a>
  </div>
</div></div></section>

<section class="section"><div class="container">
  <div class="section__head"><span class="section__tag">Услуги в {prep}</span><h2 class="section__title">Что мы уничтожаем</h2></div>
  <div class="scards">{svc_cards}</div>
</div></section>

<section class="section section--alt" id="price"><div class="container">
  <div class="section__head"><h2 class="section__title">Цены на дезинсекцию в {prep}</h2>
  <p class="section__text">Стоимость для однокомнатной квартиры, фиксированная, без скрытых доплат.</p></div>
  <div class="tablewrap"><table class="pricetable"><thead><tr><th>Услуга</th><th>Цена в {name}</th></tr></thead><tbody>
{rows}
  </tbody></table></div>
</div></section>

<section class="section" id="office"><div class="container">
  <div class="section__head"><h2 class="section__title">Офис в {prep}</h2></div>
  <div class="citem"><span class="citem__ico">📍</span><div><b>Адрес</b><span>{office}</span></div></div>
  <div class="citem"><span class="citem__ico">📞</span><div><b>Телефон</b><a href="tel:{c['phone']}">{c['display']}</a><small>круглосуточно</small></div></div>
  <div class="citem"><span class="citem__ico">💬</span><div><b>Telegram (DezComfort)</b><a href="https://t.me/SiteDezComfort_bot" target="_blank" rel="noopener">@SiteDezComfort_bot</a><small>пришлите фото вредителя — определим бесплатно</small></div></div>
</div></section>

<footer class="footer"><div class="container footer__bottom">
  <span>© 2011–{YEAR} Дез-Комфорт · {name}</span>
  <div class="footer__links">{other}</div>
</div></footer>
<script src="{BASE}/js/config.js"></script>
<script>window.DEZ_PAGE_CITY='{name}';</script>
<script src="{BASE}/js/analytics.js"></script>
</body>
</html>'''

os.makedirs(os.path.join(ROOT, 'cities'), exist_ok=True)
# Определим siteUrl из config.js для canonical
cfg = open(os.path.join(ROOT, 'js', 'config.js'), encoding='utf-8').read()
mu = re.search(r"siteUrl:\s*'([^']+)'", cfg)
SITE_URL = mu.group(1) if mu else ''
if not SITE_URL.endswith('/'): SITE_URL += '/'
for c in CITIES:
    with open(os.path.join(ROOT, 'cities', c['slug'] + '.html'), 'w', encoding='utf-8') as f:
        f.write(city_page(c, SITE_URL))

# Указатель городов
links = '\n'.join(f'<li><a href="{c["slug"]}.html">{c["name"]}</a> — {c["display"]}</li>' for c in sorted(CITIES, key=lambda x: x['name']))
index_html = f'''<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Города присутствия Дез-Комфорт — филиалы дезинсекции</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="../css/style.css"></head>
<body style="padding-top:80px"><div class="container">
<h1 style="font-family:Unbounded,sans-serif;margin-bottom:24px">Мы работаем в {len(CITIES)} городах России</h1>
<ul style="columns:3;line-height:2">{links}</ul>
<p style="margin-top:32px"><a href="../index.html">← Вернуться на главную</a></p>
</div></body></html>'''
open(os.path.join(ROOT, 'cities', 'index.html'), 'w', encoding='utf-8').write(index_html)
print(f'OK: generated {len(CITIES)} city pages + index')
