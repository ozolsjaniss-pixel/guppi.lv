// Rezervāciju portāla adrese. Pirms palaišanas to maina tikai šeit.
var PORTAL = "https://guppi-portal-demo.onrender.com"

;(function () {
  var script = document.createElement("script")
  script.src = PORTAL + "/widget/booking.js"
  script.async = true
  document.body.appendChild(script)

  // Atlikuma termiņš nāk no portāla. Ja portāls neatbild, paliek lapā ierakstītais teksts.
  var spans = document.querySelectorAll("[data-balance-days]")
  if (!spans.length || !window.fetch) return
  function phrase(span, n) {
    if (n === 0) return span.getAttribute("data-zero")
    var word = n % 10 === 1 && n % 100 !== 11 ? " dienu" : " dienas"
    return n + word + " pirms " + span.getAttribute("data-balance-days")
  }
  fetch(PORTAL + "/api/v1/catalog?business=guppi")
    .then(function (response) { return response.json() })
    .then(function (catalog) {
      var n = catalog && catalog.business && catalog.business.balance_days
      if (typeof n !== "number" || n < 0 || n % 1 !== 0) return
      spans.forEach(function (span) { span.textContent = phrase(span, n) })
    })
    .catch(function () {})
})()
