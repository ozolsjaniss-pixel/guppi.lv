// Rezervāciju portāla adrese. Pirms palaišanas to maina tikai šeit.
var PORTAL = "http://127.0.0.1:8787"
var BUSINESS = "guppi"

;(function () {
  var script = document.createElement("script")
  script.src = PORTAL + "/widget/booking.js"
  script.async = true
  document.body.appendChild(script)

  // Cenas, avanss, atlikuma termiņš un vērtējums nāk no portāla.
  // Ja portāls neatbild, paliek lapā ierakstītais teksts.
  if (!window.fetch) return
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)) }
  function get(path) {
    return fetch(PORTAL + path).then(function (response) { return response.json() })
  }
  function whole(n) { return typeof n === "number" && n >= 0 && n % 1 === 0 }
  // Summu raksta pēc portāla iestatījumiem (Iestatījumi → Maksājumi). Portāls cenas jau noapaļo.
  var MONEY = { symbol: "€", symbol_after: true, decimal: ",", thousands: " " }
  function amount(cents) {
    var value = cents / 100
    var parts = (value % 1 ? value.toFixed(2) : String(value)).split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, MONEY.thousands === " " ? "\u00a0" : MONEY.thousands)
    return parts.join(MONEY.decimal)
  }
  function money(cents) {
    return MONEY.symbol_after ? amount(cents) + "\u00a0" + MONEY.symbol : MONEY.symbol + amount(cents)
  }
  function days(span, n) {
    if (n === 0) return span.getAttribute("data-zero")
    var word = n % 10 === 1 && n % 100 !== 11 ? " dienu" : " dienas"
    return n + word + " pirms " + span.getAttribute("data-balance-days")
  }
  // "dinozauri" — vienas atrakcijas cena; "min:a,b" / "max:a,b" — zemākā vai augstākā no saraksta.
  function price(key, items) {
    var how = key.indexOf(":") > 0 ? key.split(":")[0] : ""
    var slugs = (how ? key.slice(how.length + 1) : key).split(",")
    var list = slugs.map(function (slug) { return items[slug] }).filter(whole)
    if (list.length !== slugs.length) return null
    return how === "max" ? Math.max.apply(null, list) : Math.min.apply(null, list)
  }

  var priced = all("[data-portal-price]")
  var deposit = all("[data-portal-deposit]")
  var balance = all("[data-balance-days]")
  if (priced.length || deposit.length || balance.length) {
    get("/api/v1/catalog?business=" + BUSINESS).then(function (catalog) {
      var business = (catalog && catalog.business) || {}
      var m = catalog.money || {}
      if (typeof m.symbol === "string" && m.symbol) MONEY.symbol = m.symbol
      if (typeof m.symbol_after === "boolean") MONEY.symbol_after = m.symbol_after
      if (typeof m.decimal === "string" && m.decimal) MONEY.decimal = m.decimal
      if (typeof m.thousands === "string") MONEY.thousands = m.thousands
      var items = {}
      ;(catalog.items || []).forEach(function (item) { items[item.slug] = item.from_cents })
      priced.forEach(function (span) {
        var cents = price(span.getAttribute("data-portal-price"), items)
        if (cents == null) return
        // Diapazona sākumā (169–209 €) valūtas zīmi neliekam: tur teksts beidzas ar ciparu.
        span.textContent = /\d$/.test(span.textContent.trim()) ? amount(cents) : money(cents)
        var card = span.closest("[data-card]")
        if (card) card.setAttribute("data-price", String(cents / 100))
      })
      if (whole(business.deposit_percent)) deposit.forEach(function (span) { span.textContent = business.deposit_percent })
      if (whole(business.balance_days)) balance.forEach(function (span) { span.textContent = days(span, business.balance_days) })
    }).catch(function () {})
  }

  var rating = all("[data-portal-rating]")
  var count = all("[data-portal-review-count]")
  if (rating.length || count.length) {
    get("/api/v1/reviews?business=" + BUSINESS).then(function (reviews) {
      if (!reviews || typeof reviews.rating !== "number" || !whole(reviews.total) || !reviews.total) return
      var stars = reviews.rating % 1 ? String(reviews.rating) : reviews.rating.toFixed(1)
      rating.forEach(function (span) { span.textContent = stars.replace(".", ",") })
      count.forEach(function (span) {
        var n = reviews.total
        var word = n % 10 === 1 && n % 100 !== 11 ? span.getAttribute("data-one") : span.getAttribute("data-many")
        span.textContent = n + " " + word
      })
    }).catch(function () {})
  }
})()
