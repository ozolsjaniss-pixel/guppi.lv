// Rezervāciju portāla adrese. Pirms palaišanas to maina tikai šeit.
var PORTAL = "https://guppi-portal-demo.onrender.com"

;(function () {
  var script = document.createElement("script")
  script.src = PORTAL + "/widget/booking.js"
  script.async = true
  document.body.appendChild(script)
})()
