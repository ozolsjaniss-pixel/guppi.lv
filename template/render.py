"""Website template for rental businesses on the portal.

One template, many businesses: the look comes from `theme`, every text line from the
content file, and items, prices, calendar, cart and reviews from the portal. Only the
Python standard library is used, so the portal can render the same pages itself.

render_site(content) -> {"path/index.html": html, ...}
"""

from __future__ import annotations

import html
import json
import re

# ---------- icons ----------
ICONS = {
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'star': '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
    'truck': '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    'shield': '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    'umbrella': '<path d="M22 12a10 10 0 0 0-20 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/>',
    'wallet': '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    'sparkle': '<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/><path d="M19 3v4M17 5h4"/>',
    'cake': '<path d="M4 21v-9h16v9"/><path d="M4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0"/><path d="M12 8v4M2 21h20"/><path d="M12 4c.8.7 1 1.6 0 2.5-1-.9-.8-1.8 0-2.5z"/>',
    'school': '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5M22 9v6"/>',
    'briefcase': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>',
    'tent': '<path d="M12 4 2 20h20z"/><path d="M12 4v16M9 20l3-6 3 6"/>',
    'heart': '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    'size': '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    'kids': '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
    'drop': '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    'home': '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>',
    'area': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/>',
    'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    'chat': '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
    'insta': '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    'pin': '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    'smile': '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    'slide': '<path d="M5 20V5M9 20V5M5 9h4M5 13h4"/><path d="M9 7c5 0 6 5 8 9 .8 1.6 2 3 3.5 4"/>',
    'users': '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c0-3 2.7-5 6-5s6 2 6 5M14 15c3.3 0 6 2 8 5"/>',
    'gift': '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0"/>',
    'flag': '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
}


def ic(name: str, cls: str = '') -> str:
    if not name:
        return ''
    fill = ' fill' if name == 'star' else ''
    extra = f' {cls}' if cls else ''
    return f'<svg class="ic{fill}{extra}" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'


def esc(value) -> str:
    return html.escape(str(value), quote=True)


# ---------- text with live tokens ----------
TOKEN = re.compile(r'\{([a-z_.]+)(?::([^}|]*))?(?:\|([^}|]*))?(?:\|([^}]*))?\}')


class Site:
    """Everything one business's pages need while rendering."""

    def __init__(self, content: dict):
        self.c = content
        self.b = content['business']
        self.f = content.get('fallback', {})
        self.items = content.get('items', {})
        self.order = content.get('item_order', list(self.items))

    def euro(self, cents: int, symbol: bool = True) -> str:
        value = cents / 100
        text = (f'{value:.2f}'.replace('.', ',') if value % 1 else str(int(value)))
        return text + (' €' if symbol else '')

    def from_cents(self, key: str):
        how, _, rest = key.partition(':') if ':' in key else ('', '', key)
        values = [self.items[s]['from_cents'] for s in rest.split(',')]
        return max(values) if how == 'max' else min(values)

    def balance(self, after: str) -> str:
        n = self.f.get('balance_days', 3)
        word = 'dienu' if n % 10 == 1 and n % 100 != 11 else 'dienas'
        return f'{n} {word} pirms {after}'

    def text(self, s: str) -> str:
        """Escape a content string and turn its {tokens} into live portal spans."""
        out, last = [], 0
        for m in TOKEN.finditer(s):
            out.append(esc(s[last:m.start()]))
            out.append(self.token(m.group(1), m.group(2), m.group(3), m.group(4)))
            last = m.end()
        out.append(esc(s[last:]))
        return ''.join(out)

    def token(self, name, a, b, c) -> str:
        if name == 'deposit':
            return f'<span data-portal-deposit>{self.f.get("deposit_percent", 20)}</span>'
        if name == 'balance':
            return f'<span data-balance-days="{esc(a)}" data-zero="{esc(b)}">{esc(self.balance(a))}</span>'
        if name in ('price', 'amount'):
            key = a if not b else f'{a}:{b}'
            return f'<span data-portal-price="{esc(key)}">{self.euro(self.from_cents(key), name == "price")}</span>'
        if name == 'rating':
            return f'<span data-portal-rating>{esc(self.f.get("rating", ""))}</span>'
        if name == 'reviews':
            n = self.f.get('review_count', 0)
            word = a if n % 10 == 1 and n % 100 != 11 else b
            return f'<span data-portal-review-count data-one="{esc(a)}" data-many="{esc(b)}">{n} {esc(word)}</span>'
        if name.startswith('business.'):
            return esc(self.b[name.split('.', 1)[1]])
        raise KeyError(f'unknown token {name}')


# ---------- shell ----------
def link(pre: str, href: str) -> str:
    """Site paths are written from the site root; external and tel: links stay as they are."""
    if re.match(r'^(https?:|mailto:|tel:|#)', href):
        return href
    return pre + href


def header(site: Site, pre: str, active: str) -> str:
    nav = site.c['nav']
    cur = ' aria-current="page"'
    desk = ''.join(f'<a href="{link(pre, n["href"])}"{cur if n["key"] == active else ""}>{esc(n["label"])}</a>' for n in nav['main'])
    mob = ''.join(f'<a href="{link(pre, n["href"])}">{esc(n["label"])}</a>' for n in nav['main'] + nav['more'])
    b = site.b
    return f'''<header class="top">
    <div class="top-row">
      <a href="{pre}index.html"><img class="logo" src="{pre}{esc(site.c['theme']['logo'])}" alt="{esc(b['name'])}"></a>
      <nav class="desk" aria-label="Galvenā">
        {desk}
      </nav>
      <div class="top-cart" data-portal-cart="{esc(b['slug'])}" data-view="button" data-href="{pre}grozs/index.html"></div>
      <div class="desk-actions">
        <a class="phone" href="tel:{esc(b['phone_intl'])}">{ic('phone')}{esc(b['phone'])}</a>
        <a class="btn" href="{pre}rezervet/index.html">{esc(nav['book'])}</a>
      </div>
      <details class="menu">
        <summary>{esc(nav['menu'])}</summary>
        <nav aria-label="Mobilā">
          {mob}
          <a class="solid" href="{pre}rezervet/index.html">{esc(nav['book'])}</a>
          <a href="tel:{esc(b['phone_intl'])}">{esc(b['phone'])}</a>
        </nav>
      </details>
    </div>
  </header>'''


def footer(site: Site, pre: str) -> str:
    f, b, p = site.c['footer'], site.b, site.c['platform']
    cols = ''
    for col in f['columns']:
        lis = ''.join(f'<li><a href="{link(pre, l["href"])}">{esc(l["label"])}</a></li>' for l in col['links'])
        cols += f'''
      <div>
        <p class="foot-title">{esc(col['title'])}</p>
        <ul>{lis}</ul>
      </div>'''
    social = ''.join(f'<a href="{esc(s["href"])}" aria-label="{esc(s["label"])}">{ic(s["icon"])}</a>' for s in f['social'])
    contact = ''.join(f'<li><a href="{esc(h)}">{esc(t)}</a></li>' for t, h in [(b['phone'], f'tel:{b["phone_intl"]}'), (b['email'], f'mailto:{b["email"]}'), ('WhatsApp', f'https://wa.me/{b["whatsapp"]}')])
    legal = ''.join(f'<li class="muted">{site.text(line)}</li>' for line in f['legal_lines'])
    bottom = ''.join(f'<a href="{link(pre, l["href"])}">{esc(l["label"])}</a>' for l in f['bottom'])
    powered = f'<a class="powered" href="{esc(p["url"])}">{esc(p["powered_label"])} <b>{esc(p["name"])}</b></a>' if p.get('name') else ''
    return f'''<footer class="foot">
    <svg class="foot-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V32c160-26 320-34 480-20s320 34 480 26 320-30 480-26v48z"/></svg>
    <div class="wrap foot-grid">
      <div>
        <span class="logo-chip"><img class="logo" src="{pre}{esc(site.c['theme']['logo'])}" alt="{esc(b['name'])}"></span>
        <p class="muted foot-about">{site.text(f['about'])}</p>
        <div class="social">
          {social}
        </div>
      </div>{cols}
      <div>
        <p class="foot-title">{esc(f['contact_title'])}</p>
        <ul>
          {contact}
          {legal}
        </ul>
      </div>
    </div>
    <div class="links">
      <span>© {esc(f['year'])} {esc(b['legal_name'])}</span>
      {bottom}
      {powered}
    </div>
  </footer>'''


def page(site: Site, path: str, title: str, description: str, active: str, main: str) -> str:
    depth = path.count('/')
    pre = '../' * depth
    t = site.c['theme']
    fonts = t['fonts_url']
    return f'''<!DOCTYPE html>
<html lang="{esc(site.c.get('lang', 'lv'))}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
{f'  <meta name="description" content="{esc(description)}">' + chr(10) if description else ''}  <link rel="icon" href="{pre}{esc(t['logo'])}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="{esc(fonts)}">
  <link rel="stylesheet" href="{pre}assets/site.css">
  <style>:root {{ --primary: {esc(t['primary'])}; --accent: {esc(t['accent'])}; }}</style>
</head>
<body>
  {header(site, pre, active)}
  <main>{main.replace('{{pre}}', pre)}</main>
  {footer(site, pre)}
  <script src="{pre}assets/data.js"></script>
  <script src="{pre}assets/site.js"></script>
  <script src="{pre}assets/portal.js"></script>
</body>
</html>
'''


# ---------- shared pieces ----------
def btn(site: Site, b: dict, extra: str = '') -> str:
    cls = 'btn' + (' ' + b['style'] if b.get('style') else '') + extra
    icon_l = ic(b['icon']) + ' ' if b.get('icon') else ''
    arrow = ' ' + ic('arrow') if b.get('arrow') else ''
    return f'<a class="{cls}" href="{link("{{pre}}", b["href"])}">{icon_l}{site.text(b["label"])}{arrow}</a>'


def sec_head(site: Site, s: dict) -> str:
    more = f'<a class="more" href="{link("{{pre}}", s["more"]["href"])}">{site.text(s["more"]["label"])} {ic("arrow")}</a>' if s.get('more') else ''
    sub = f'<p class="muted" style="margin-top:0.4rem">{site.text(s["sub"])}</p>' if s.get('sub') else ''
    return f'<div class="sec-head"><div><p class="eyebrow">{ic(s.get("eyebrow_icon", ""))} {site.text(s["eyebrow"])}</p><h2>{site.text(s["title"])}</h2>{sub}</div>{more}</div>'


def card(site: Site, slug: str) -> str:
    it = site.items[slug]
    href = f'{{{{pre}}}}atrakcijas/{slug}/index.html'
    return f'''<article class="card" data-card data-group="{esc(it['group'])}" data-water="{esc(it['water'])}" data-name="{esc(it['name'])}" data-summary="{esc(it['summary'])}" data-price="{it['from_cents'] / 100:g}" data-area="{esc(it['area_sort'])}" data-order="{it['order']}">
    <a class="shot" href="{href}">
      <img src="{{{{pre}}}}{esc(it['photos'][it.get('card_photo', 0)])}" alt="{esc(it['card_alt'])}">
      <span class="badge">{esc(it['badge'])}</span>
    </a>
    <div class="pad">
      <h2><a href="{href}">{esc(it['name'])}</a></h2>
      <p class="muted meta">{esc(it['meta'])}</p>
      <p class="summary">{esc(it['summary'])}</p>
      <div class="card-foot">
        <p class="price">{esc(site.c['words']['from'])} {site.text('{price:' + slug + '}')}</p>
        <a class="btn" href="{href}#kalendars">{esc(site.c['words']['free_days'])}</a>
      </div>
    </div>
  </article>'''


def rich(site: Site, blocks: list) -> str:
    """Article and legal text: headings, paragraphs and lists, every line editable."""
    out = []
    for b in blocks:
        if 'h2' in b:
            out.append(f'<h2 class="rich-h">{site.text(b["h2"])}</h2>')
        elif 'p' in b:
            out.append(f'<p class="rich-p">{site.text(b["p"])}</p>')
        elif 'ul' in b:
            out.append('<ul class="rich-list">' + ''.join(f'<li>{site.text(x)}</li>' for x in b['ul']) + '</ul>')
    return '\n    '.join(out)


# ---------- section types ----------
def s_hero(site, s):
    trust = ''.join(f'<li class="{t["cls"]}"><span class="t-ic">{ic(t["icon"])}</span><span><b>{site.text(t["title"])}</b><small>{site.text(t["note"])}</small></span></li>' for t in s['trust'])
    photos = ''.join(f'<figure class="polaroid p{k + 1}"><img src="{{{{pre}}}}{esc(p["src"])}" alt="{esc(p["alt"])}"><figcaption>{esc(p["caption"])}</figcaption></figure>' for k, p in enumerate(s['photos']))
    buttons = ''.join(btn(site, b, ' big') for b in s['buttons'])
    return f'''
  <section class="hero2">
    <div class="wrap hero2-grid">
      <div class="hero2-copy">
        <p class="sticker">{ic('heart')} {site.text(s['sticker'])}</p>
        <h1>{site.text(s['title'])} <span class="hl">{site.text(s['title_highlight'])}</span></h1>
        <p class="lead">{site.text(s['lead'])}</p>
        <div class="row">{buttons}</div>
      </div>
      <div class="hero2-art">
        {photos}
        <p class="badge-round">{site.text(s['badge_top'])}<b>{site.text(s['badge_bottom'])}</b></p>
        <p class="ticket">{site.text(s['ticket'])}</p>
        <span class="balloon b1" aria-hidden="true"></span><span class="balloon b2" aria-hidden="true"></span>
      </div>
    </div>
    <div class="wrap trust-row">
      <ul class="trust">
          {trust}
        </ul>
    </div>
    <svg class="wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 46c120 26 240 34 360 24S600 26 720 30s240 38 360 36 240-26 360-42v56H0z"/></svg>
  </section>'''


def s_ticker(site, s):
    items = ''.join(f'<span>{ic(i["icon"])}{site.text(i["text"])}</span>' for i in s['items'])
    return f'''
  <div class="ticker" aria-label="{esc(s['label'])}"><div class="ticker-track">{items}{items.replace('<span>', '<span aria-hidden="true">')}</div></div>'''


def s_steps(site, s):
    colors = ['plum', 'gold', 'plum']
    cards = ''.join(f'<article class="step reveal"><span class="bubble {colors[k % 3]}">{k + 1}</span><div><h3>{ic(x["icon"])}{site.text(x["title"])}</h3><p class="muted" style="margin-top:0.35rem">{site.text(x["text"])}</p></div></article>' for k, x in enumerate(s['items']))
    return f'''
  <section class="wrap section"><div class="steps">
    {cards}
  </div></section>'''


def s_popular(site, s):
    return f'''
  <section class="wrap section">
    {sec_head(site, s)}
    <div class="cards">{''.join(card(site, slug) for slug in s['items'])}</div>
  </section>'''


def s_occasions(site, s):
    tiles = ''.join(f'<a class="occ t{k + 1} reveal" href="{link("{{pre}}", o["href"])}"><span class="bubble-ic">{ic(o["icon"])}</span><h3>{site.text(o["title"])}</h3><p>{site.text(o["text"])}</p><span class="go">{site.text(s["go"])} {ic("arrow")}</span></a>' for k, o in enumerate(s['items']))
    return f'''
  <section class="wrap section">
    {sec_head(site, s)}
    <div class="occasions">{tiles}</div>
  </section>'''


AV = ['#ae4a84', '#f3a713', '#1c9a4b', '#6a4fb3', '#d0607f', '#2f8fbf']


def s_reviews(site, s):
    snap = s['fallback_reviews']

    def rv(r, k):
        return (f'<figure class="rv"><span class="stars">{"★" * (r.get("rating") or 5)}</span><p>{esc(r["text"])}</p>'
                f'<figcaption class="who"><span class="avatar" style="--av:{AV[k % 6]}">{esc(r["author"][0].upper())}</span>{esc(r["author"])}</figcaption></figure>')
    row1 = ''.join(rv(r, k) for k, r in enumerate(snap) if k % 2 == 0)
    row2 = ''.join(rv(r, k) for k, r in enumerate(snap) if k % 2 == 1)
    spot = [r for r in snap if len(r['text']) > 70][:6]
    spot_json = esc(json.dumps([{'author': r['author'], 'text': r['text']} for r in spot], ensure_ascii=False))
    first = spot[0]
    actions = ''.join(btn(site, b).replace('href=', 'data-google-review href=', 1) if b.get('google') else btn(site, b) for b in s['buttons'])
    return f'''
  <section class="reviews-band">
    <div class="wrap">
      <div class="sec-head"><div><p class="eyebrow">{ic('heart')} {site.text(s['eyebrow'])}</p><h2>{site.text(s['title'])}</h2></div><p class="score"><b data-portal-rating>{esc(site.f.get('rating', ''))}</b><span><span class="stars">★★★★★</span><br><span class="muted">{site.text(s['score_note'])}</span></span></p></div>
      <div class="spotlight reveal" data-spotlight="{spot_json}">
        <span class="stars">★★★★★</span>
        <blockquote>“{esc(first['text'])}”</blockquote>
        <p class="who"><span class="avatar">{esc(first['author'][0].upper())}</span><span data-who>{esc(first['author'])}</span></p>
        <div class="dots"></div>
      </div>
    </div>
    <div class="wall" data-reviews-wall>
      <div class="wall-row"><div class="wall-track">{row1}</div></div>
      <div class="wall-row reverse"><div class="wall-track">{row2}</div></div>
    </div>
    <div class="wrap reviews-actions">{actions}</div>
  </section>'''


def stats(site, items):
    out = ''
    for st in items:
        if 'count' in st:
            suffix = st.get('suffix', '')
            attr = f' data-suffix="{esc(suffix)}"' if suffix else ''
            out += f'<div class="stat"><b data-count="{st["count"]}"{attr}>{st["count"]}{esc(suffix)}</b><span>{site.text(st["label"])}</span></div>'
        else:
            out += f'<div class="stat"><b>{site.text(st["value"])}</b><span>{site.text(st["label"])}</span></div>'
    return out


def s_story(site, s):
    paras = ''.join(f'<p class="muted">{site.text(p)}</p>' for p in s['paragraphs'])
    more = f'<p style="margin-top:1.2rem"><a class="more eyebrow" href="{link("{{pre}}", s["more"]["href"])}">{site.text(s["more"]["label"])} {ic("arrow")}</a></p>' if s.get('more') else ''
    pad = ' style="padding-top:2.5rem"' if s.get('pad_top') else ''
    return f'''
  <section class="wrap section story"{pad}>
    <div class="story-img reveal"><img src="{{{{pre}}}}{esc(s['photo'])}" alt="{esc(s['photo_alt'])}" loading="lazy"><p class="sticker">{ic('sparkle')} {site.text(s['sticker'])}</p></div>
    <div class="story-copy reveal">
      <p class="eyebrow">{ic(s.get('eyebrow_icon', ''))} {site.text(s['eyebrow'])}</p>
      <h2>{site.text(s['title'])}</h2>
      {paras}
      <div class="stats">
        {stats(site, s['stats'])}
      </div>{more}
    </div>
  </section>'''


def s_reasons(site, s):
    cards = ''
    for r in s['items']:
        body = f'<span class="bubble-ic">{ic(r["icon"])}</span><h3>{site.text(r["title"])}</h3><p>{site.text(r["text"])}</p>'
        if r.get('href'):
            cards += f'<a class="reveal" href="{link("{{pre}}", r["href"])}">{body}<span class="go">{site.text(r["go"])} {ic("arrow")}</span></a>'
        else:
            cards += f'<article class="reveal">{body}</article>'
    return f'''
  <section class="wrap section">
    {sec_head(site, s)}
    <div class="why">{cards}</div>
  </section>'''


def tip_cards(site, s, articles):
    out = ''
    for slug in s['items']:
        a = articles[slug]
        out += f'<article class="panel"><p class="muted">{esc(a["read_time"])}</p><h3 style="margin-top:0.3rem"><a href="{{{{pre}}}}padomi/{slug}/index.html">{esc(a["title"])}</a></h3><p class="muted" style="margin-top:0.4rem">{site.text(a["summary"])}</p></article>'
    return out


def s_tips(site, s):
    return f'''
  <section class="wrap section tips">
    {sec_head(site, s)}
    <div class="cards">{tip_cards(site, s, site.c['articles'])}</div>
  </section>'''


def s_faq(site, s):
    qa = ''.join(f'<details><summary>{site.text(q["q"])}</summary><p class="muted" style="margin-top:0.4rem">{site.text(q["a"])}</p></details>' for q in s['items'])
    return f'''
  <section class="wrap section">
    {sec_head(site, s)}
    <div class="faq" style="margin-top:1rem">{qa}</div>
  </section>'''


def s_cta(site, s):
    return f'''
  <section class="cta-band">
    <div class="wrap cta-inner reveal">
      <p class="eyebrow" style="color:var(--primary-deep)">{ic('sparkle')} {site.text(s['eyebrow'])}</p>
      <h2>{site.text(s['title'])}</h2>
      <p>{site.text(s['text'])}</p>
      <div class="row">{''.join(btn(site, b, ' big') for b in s['buttons'])}</div>
    </div>
  </section>'''


def s_page_hero(site, s):
    return f'''
  <section class="page-hero"><div class="wrap">
    <p class="eyebrow">{ic(s.get('eyebrow_icon', ''))} {site.text(s['eyebrow'])}</p>
    <h1>{site.text(s['title'])}</h1>
    <p class="lead">{site.text(s['lead'])}</p>
  </div></section>'''


def s_occ_details(site, s):
    body = ''
    for o in s['items']:
        buttons = ''.join(btn(site, b) for b in o['buttons'])
        body += f'''
    <article class="occ-detail reveal" id="{esc(o['id'])}" style="--tint:var({esc(o['tint'])})">
      <img src="{{{{pre}}}}{esc(o['photo'])}" alt="{esc(o['photo_alt'])}" loading="lazy">
      <div>
        <p class="eyebrow">{ic(o['icon'])} {site.text(o['eyebrow'])}</p>
        <h2>{site.text(o['title'])}</h2>
        <p class="muted">{site.text(o['text'])}</p>
        <div class="row">{buttons}</div>
      </div>
    </article>'''
    return f'''
  <section class="wrap section" style="padding-top:2.5rem">{body}
  </section>'''


def s_timeline(site, s):
    tl = ''.join(f'<li class="reveal"><span class="bubble-ic">{ic(x["icon"])}</span><div><h3>{site.text(x["title"])}</h3><p>{site.text(x["text"])}</p><span class="when">{site.text(x["when"])}</span></div></li>' for x in s['items'])
    return f'''
  <section class="wrap section" style="padding-top:2.5rem">
    <ol class="timeline">{tl}</ol>
  </section>'''


def s_info(site, s):
    boxes = ''
    b = site.b
    for x in s['items']:
        inner = ''.join(f'<p>{site.text(p)}</p>' for p in x.get('paragraphs', []))
        if x.get('fill') == 'company':
            inner += f'<p>{esc(b["address"])}<br>{site.text(x["reg_line"])}</p>'
        if x.get('fill') == 'contact':
            inner += f'<p><a href="tel:{esc(b["phone_intl"])}">{esc(b["phone"])}</a> · <a href="mailto:{esc(b["email"])}">{esc(b["email"])}</a> · <a href="https://wa.me/{esc(b["whatsapp"])}">WhatsApp</a></p>'
        if x.get('list'):
            inner += '<ol class="todo">' + ''.join(f'<li>{site.text(i)}</li>' for i in x['list']) + '</ol>'
        if x.get('more'):
            inner += f'<p><a class="more eyebrow" href="{link("{{pre}}", x["more"]["href"])}">{site.text(x["more"]["label"])} {ic("arrow")}</a></p>'
        boxes += f'<div class="info{" " + x["cls"] if x.get("cls") else ""} reveal"><h3>{ic(x["icon"])} {site.text(x["title"])}</h3>{inner}</div>'
    return f'''
  <section class="wrap section">
    <div class="info-grid">{boxes}</div>
  </section>'''


SECTIONS = {'hero': s_hero, 'ticker': s_ticker, 'steps': s_steps, 'popular': s_popular, 'occasions': s_occasions,
            'reviews': s_reviews, 'story': s_story, 'reasons': s_reasons, 'tips': s_tips, 'faq': s_faq, 'cta': s_cta,
            'page_hero': s_page_hero, 'occ_details': s_occ_details, 'timeline': s_timeline, 'info': s_info}


def sections(site: Site, secs: list) -> str:
    return ''.join(SECTIONS[s['type']](site, s) for s in secs if s.get('on', True))


# ---------- page types ----------
def simple_head(site, p, narrow=False):
    style = ' style="max-width:46rem"' if narrow else ''
    intro = f'<p class="lead" style="margin-top:0.7rem">{site.text(p["intro"])}</p>' if p.get('intro') else ''
    return style, f'<h1>{site.text(p["title"])}</h1>\n    {intro}'


def item_page(site: Site, slug: str) -> str:
    it, w = site.items[slug], site.c['words']
    ip = site.c['item_page']
    photos = it['photos']
    thumbs = ''.join(f'<button type="button" data-src="{{{{pre}}}}{esc(p)}" class="{"on" if k == 0 else ""}"><img src="{{{{pre}}}}{esc(p)}" alt=""></button>' for k, p in enumerate(photos))
    feats = ''.join(f'<li>{ic(f["icon"])}{esc(f["text"])}</li>' for f in it['features'])
    feats = f'\n        <ul class="features">{feats}</ul>' if feats else ''
    guar = ''.join(f'<li>{ic(g["icon"])}<span>{site.text(g["text"])}</span></li>' for g in it.get('guarantees', ip['guarantees']))
    specs = ''.join(f'\n          <div class="spec"><dt class="muted">{ic(sp["icon"])}{esc(sp["label"])}</dt><dd>{esc(sp["value"])}</dd></div>' for sp in it['specs'])
    included = ''.join(f'<li>{site.text(x)}</li>' for x in it.get('included', ip['included']))
    prepare = ''.join(f'<li>{site.text(x)}</li>' for x in it.get('prepare', ip['prepare']))
    similar = ''.join(card(site, s) for s in it['similar'])
    co = ip['callout']
    return f'''<div class="wrap page">
    <p class="muted"><a href="{{{{pre}}}}atrakcijas/index.html">{esc(w['catalog'])}</a> / {esc(it['name'])}</p>
    <div class="product">
      <div data-gallery>
        <img class="main" data-main src="{{{{pre}}}}{esc(photos[0])}" alt="{esc(it['name'])}">
        <div class="thumbs">{thumbs}</div>
      </div>
      <div>
        <p class="plum">{esc(it['badge'])}</p>
        <h1>{esc(it['name'])}</h1>
        <p class="lead">{esc(it['summary'])}</p>
        <p class="muted desc">{esc(it['description'])}</p>{feats}
        <p class="price-line"><span class="price big">{esc(w['from'])} {site.text('{price:' + slug + '}')}</span> <span class="muted">{esc(w['per_day'])}</span></p>
        <div class="booking" id="kalendars" data-portal-booking="{esc(site.b['slug'])}" data-item="{esc(slug)}" data-cart-href="{{{{pre}}}}grozs/index.html"></div>
        <p class="note">{site.text(ip['times'])}</p>
        <ul class="guarantees">{guar}</ul>
        <dl class="specs">{specs}
        </dl>
      </div>
    </div>
    <div class="split extras">
      <div class="panel"><h2>{esc(ip['included_title'])}</h2><ul class="checks">{included}</ul></div>
      <div class="panel"><h2>{esc(ip['prepare_title'])}</h2><ol class="todo">{prepare}</ol></div>
    </div>
    <div class="callout reveal"><p>{ic(co['icon'])} {site.text(co['text'])}</p>{btn(site, co['button'])}</div>
    <!--slot:portal-reviews:products--><h2 class="similar">{esc(ip['similar_title'])}</h2>
    <div class="cards">{similar}</div>
  </div>'''


def catalog_page(site: Site) -> str:
    c = site.c['catalog']
    filters = ''.join(f'<button type="button" data-filter="{esc(f["key"])}" class="{"on" if k == 0 else ""}">{esc(f["label"])}</button>' for k, f in enumerate(c['filters']))
    sorts = ''.join(f'<option value="{esc(o["key"])}">{esc(o["label"])}</option>' for o in c['sort'])
    cards = ''.join(card(site, s) for s in site.order)
    return f'''<div class="wrap page" data-catalog>
    <h1>{site.text(c['title'])}</h1>
    <p class="muted" style="margin-top:0.7rem;max-width:40rem">{site.text(c['intro'])}</p>
    <div class="tools" style="margin-top:1.2rem">
      <input data-search placeholder="{esc(c['search'])}" aria-label="{esc(c['search_label'])}" style="max-width:22rem">
      <label>{esc(c['sort_label'])} <select data-sort>{sorts}</select></label>
    </div>
    <div class="filters">{filters}</div>
    <div class="cards" data-grid>{cards}</div>
    <p class="panel hide" data-empty style="margin-top:1rem;text-align:center">{site.text(c['empty'])}</p>
  </div>'''


def special(site: Site, kind: str, p: dict) -> str:
    """Pages with a fixed tool on them: booking, cart, reviews, delivery, contacts, gift card."""
    b = site.b
    if kind == 'booking':
        return f'''<div class="wrap page">
    <h1>{site.text(p['title'])}</h1>
    <p class="muted" style="margin-top:0.6rem;max-width:40rem">{site.text(p['intro'])}</p>
    <div class="booking" data-portal-booking="{esc(b['slug'])}" data-cart-href="{{{{pre}}}}grozs/index.html"></div>
  </div>'''
    if kind == 'cart':
        return f'''<div class="wrap page">
    <h1>{site.text(p['title'])}</h1>
    <p class="muted" style="margin-top:0.6rem;max-width:40rem">{site.text(p['intro'])}</p>
    <div class="booking" data-portal-cart="{esc(b['slug'])}"></div>
  </div>'''
    if kind == 'reviews':
        return f'<div class="wrap page"><h1>{site.text(p["title"])}</h1><!--slot:portal-reviews:reviews--></div>'
    if kind == 'delivery':
        zones = ''.join(f'<article class="panel" style="margin-bottom:0.7rem"><p class="display" style="font-size:1.8rem">{site.text(z["price"])}</p><h2 style="font-size:1.2rem">{site.text(z["title"])}</h2><p class="muted" style="margin-top:0.3rem">{site.text(z["text"])}</p></article>' for z in p['zones'])
        lk = p['lookup']
        return f'''<div class="wrap page">
    <h1>{site.text(p['title'])}</h1>
    <p class="lead" style="margin-top:0.7rem">{site.text(p['intro'])}</p>
    <div class="split" style="margin-top:1.2rem">
      <div>{zones}</div>
      <div class="panel">
        <label class="lbl" for="zone">{esc(lk['label'])}</label>
        <input id="zone" data-postal-lookup="#zone-out" inputmode="numeric" placeholder="{esc(lk['placeholder'])}">
        <p id="zone-out" class="note">{site.text(lk['hint'])}</p>
        <p style="margin-top:0.8rem"><a class="plum" href="{{{{pre}}}}rezervet/index.html">{esc(lk['link'])}</a></p>
      </div>
    </div>
  </div>'''
    if kind == 'contacts':
        paras = ''.join(f'<p class="muted" style="margin-top:0.6rem">{site.text(x)}</p>' for x in p['when_text'])
        return f'''<div class="wrap page"><h1>{site.text(p['title'])}</h1><div class="split" style="margin-top:1rem"><div class="panel"><p class="display" style="font-size:1.6rem">{esc(b['legal_name'])}</p><p style="margin-top:0.6rem">{esc(b['address'])}</p><p>{site.text(p['reg_line'])}</p><p>{site.text(p['vat_line'])}</p><p style="margin-top:0.6rem"><a class="plum" href="tel:{esc(b['phone_intl'])}">{esc(b['phone'])}</a></p><p><a class="plum" href="mailto:{esc(b['email'])}">{esc(b['email'])}</a></p><p><a class="plum" href="https://wa.me/{esc(b['whatsapp'])}">WhatsApp</a></p></div><div class="panel"><h2>{site.text(p['when_title'])}</h2>{paras}</div></div></div>'''
    if kind == 'gift':
        g = p['form']
        amounts = ''.join(f'<label class="choice{" on" if a == g["default"] else ""}" style="text-align:center"><input class="hide" type="radio" name="amount" value="{a}"{" checked" if a == g["default"] else ""}>{a} €</label>' for a in g['amounts'])
        fields = ''.join(gift_field(f) for f in g['fields'])
        return f'''<div class="wrap page"><div class="split"><div><h1>{site.text(p['title'])}</h1><p class="muted" style="margin-top:0.8rem;line-height:1.6">{site.text(p['intro'])}</p></div>
    <form class="panel" data-gift>
      <span class="lbl">{esc(g['amount_label'])}</span>
      <div class="days">{amounts}</div>
      {fields}
      <button class="btn" type="submit" style="margin-top:0.8rem">{esc(g['submit'])}</button>
    </form></div></div>'''
    raise KeyError(kind)


def gift_field(f: dict) -> str:
    if f.get('textarea'):
        control = f'<textarea name="{esc(f["name"])}"></textarea>'
    else:
        kind = f' type="{esc(f["type"])}"' if f.get('type') else ''
        need = ' required' if f.get('required') else ''
        control = f'<input name="{esc(f["name"])}"{kind}{need}>'
    return f'<div class="field"><label class="lbl">{esc(f["label"])}</label>{control}</div>'


def article_list(site: Site, p: dict) -> str:
    arts = site.c['articles']
    items = ''.join(f'<article class="panel" style="margin-bottom:0.7rem"><p class="muted">{esc(arts[s]["date"])} · {esc(arts[s]["minutes"])}</p><h2 style="font-size:1.4rem;margin-top:0.3rem"><a href="{s}/index.html">{esc(arts[s]["title"])}</a></h2><p class="muted" style="margin-top:0.35rem">{site.text(arts[s]["summary"])}</p></article>' for s in p['items'])
    return f'<div class="wrap page"><h1>{site.text(p["title"])}</h1><p class="muted" style="margin-top:0.6rem">{site.text(p["intro"])}</p><div style="margin-top:1rem">{items}</div></div>'


def article(site: Site, slug: str) -> str:
    a = site.c['articles'][slug]
    return f'''<div class="wrap page" style="max-width:46rem"><p class="muted"><a href="../index.html">{esc(site.c['articles_page']['crumb'])}</a></p><h1 style="font-size:2.4rem">{esc(a['title'])}</h1><p class="muted" style="margin-top:0.5rem">{esc(a['date'])} · {esc(a['minutes'])}</p>
    {rich(site, a['body'])}
  </div>'''


def legal(site: Site, key: str) -> str:
    l = site.c['legal'][key]
    return f'''<div class="wrap page" style="max-width:46rem"><h1>{site.text(l['title'])}</h1><div class="rich" style="margin-top:1rem">
    {rich(site, l['body'])}
  </div></div>'''


# ---------- the whole site ----------
def render_site(content: dict) -> dict:
    site = Site(content)
    out = {}
    for path, p in content['pages'].items():
        if not p.get('on', True):
            continue
        kind = p['kind']
        if kind == 'sections':
            main = sections(site, p['sections'])
        elif kind == 'catalog':
            main = catalog_page(site)
        elif kind == 'articles':
            main = article_list(site, p)
        elif kind == 'legal':
            main = legal(site, p['legal'])
        else:
            main = special(site, kind, p)
        out[path] = page(site, path, p['seo_title'], p['seo_description'], p.get('nav', ''), main)
    for slug in site.order:
        it = site.items[slug]
        out[f'atrakcijas/{slug}/index.html'] = page(site, f'atrakcijas/{slug}/index.html', it['seo_title'], it['seo_description'], 'atrakcijas', item_page(site, slug))
    for slug, a in content['articles'].items():
        out[f'padomi/{slug}/index.html'] = page(site, f'padomi/{slug}/index.html', a['seo_title'], a['seo_description'], 'padomi', article(site, slug))
    return out
