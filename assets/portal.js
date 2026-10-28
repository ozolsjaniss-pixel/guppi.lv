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
  function euro(cents) {
    var value = cents / 100
    return (value % 1 ? value.toFixed(2).replace(".", ",") : String(value)) + " €"
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
      var items = {}
      ;(catalog.items || []).forEach(function (item) { items[item.slug] = item.from_cents })
      priced.forEach(function (span) {
        var cents = price(span.getAttribute("data-portal-price"), items)
        if (cents == null) return
        var text = euro(cents)
        // Diapazona sākumā (169–209 €) € zīmi neliekam.
        if (!/€/.test(span.textContent)) text = text.replace(" €", "")
        span.textContent = text
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
