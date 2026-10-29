# Website template

One template for every rental business on the portal. A business changes its look, every text
line and which sections show; items, prices, calendar, cart and reviews come from the portal.
GUPPI.lv is the first site built from it (`content/guppi.json`).

```bash
python3 template/build.py content/guppi.json .
```

`render.py` turns a content file into pages and uses only the Python standard library, so the
portal can render the same pages itself when it serves the sites. `build.py` writes them as static
files and, while a site is still published that way, carries over the portal's own marker blocks
(`portal-seo` in the head, `portal-reviews` on the reviews and item pages).

## Content file

| Key | What it holds |
|---|---|
| `platform` | The "Powered by" badge in every footer: `name`, `url`, `powered_label`. Set once for the platform, not per business. |
| `business` | `slug` (portal business), `name`, `legal_name`, `reg_no`, `vat_no`, `address`, `phone`, `phone_intl`, `email`, `whatsapp`. Legal pages, contacts and footer read these. |
| `theme` | `logo`, `primary`, `accent` (every tint, shadow and text colour is derived from these two), `fonts_url`. |
| `fallback` | Values shown until the portal answers: `deposit_percent`, `balance_days`, `rating`, `review_count`. |
| `words` | Short repeated words: "no" before a price, "/ 1 diena", the catalog name, the card button. |
| `nav`, `footer` | Menu links and labels; footer columns, social links, legal lines, bottom links, year. |
| `catalog` | Catalog page texts, search placeholder, sort options and group filters. |
| `item_page` | Texts shared by every item page: times note, guarantees, "Cenā ir", "Sagatavo Tu", call-out, similar-items title. An item can override `guarantees`, `included`, `prepare`. |
| `items`, `item_order` | Per item: name, badge, group, water, summary, description, features (icon + text), specs (icon, label, value), card meta, photos, similar items, SEO title and description. Prices come from the portal (`from_cents` is the fallback). |
| `articles`, `articles_page` | Tips: title, date, minutes, summary, body blocks, SEO. |
| `legal` | `terms`, `privacy`: title and body blocks with `{business.*}` fields, so every business fills in the same template. |
| `pages` | Every other page by path, with `kind`, `nav` (active menu item), `seo_title`, `seo_description` and its texts. |

### Page kinds

`sections` (home, Pasākumiem, Kā tas notiek, Par mums), `catalog`, `articles`, `legal`, `booking`,
`cart`, `reviews`, `delivery`, `contacts`, `gift`.

### Section types (for `kind: sections`)

Each has `"on": true|false` and its own text fields:
`hero`, `ticker`, `steps`, `popular`, `occasions`, `reviews`, `story`, `reasons`, `tips`, `faq`, `cta`,
`page_hero`, `occ_details`, `timeline`, `info`.

### Body blocks (articles and legal pages)

A list of `{"h2": "…"}`, `{"p": "…"}`, `{"ul": ["…", "…"]}`.

### Tokens inside any text

Text stays editable; tokens become live values from the portal.

| Token | Shows |
|---|---|
| `{deposit}` | deposit percent (write `{deposit}%`) |
| `{balance:svētkiem\|svētku dienā}` | "3 dienas pirms svētkiem", or the second text when the balance is due on the day |
| `{price:slug}` / `{price:min:a,b}` / `{price:max:a,b}` | "no" price of one item, or the lowest/highest of a list, with € |
| `{amount:…}` | the same without € (start of a range) |
| `{rating}`, `{reviews:atsauksmes\|atsauksmēm}` | review score and count |
| `{business.legal_name}` etc. | a business field |

Icons are named (`truck`, `shield`, `umbrella`, `wallet`, `calendar`, `heart`, `smile`, …); the list is `ICONS` in `render.py`.
