(function () {
  var data = window.GUPPI || { codes: {} }

  function euro(value) {
    if (value == null) return "Apstiprināsim"
    var has = Math.round(value * 100) % 100 !== 0
    return new Intl.NumberFormat("lv-LV", { style: "currency", currency: "EUR", minimumFractionDigits: has ? 2 : 0, maximumFractionDigits: 2 }).format(value)
  }
  function delivery(raw) {
    var code = String(raw || "").replace(/\D/g, "")
    if (code.length !== 4) return null
    if (data.codes && data.codes[code]) return Object.assign({ code: code }, data.codes[code])
    if (code.indexOf("10") === 0) return { code: code, fee: 20, place: "Rīga", note: "Pārējā Rīga ārpus bezmaksas apkaimēm." }
    return { code: code, fee: null, place: "", note: "Tālāk par Pierīgu cenu apstiprinām pirms avansa rēķina." }
  }

  document.querySelectorAll("[data-catalog]").forEach(function (root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-card]"))
    var query = root.querySelector("[data-search]")
    var sort = root.querySelector("[data-sort]")
    var filter = "visi"
    function apply() {
      var needle = (query.value || "").trim().toLowerCase()
      var list = cards.filter(function (card) {
        var groupOk = filter === "visi" || (filter === "udens" ? card.getAttribute("data-water") !== "ne" : card.getAttribute("data-group") === filter)
        var text = (card.getAttribute("data-name") + " " + card.getAttribute("data-summary")).toLowerCase()
        return groupOk && (!needle || text.indexOf(needle) !== -1)
      })
      if (sort.value === "cena") list.sort(function (a, b) { return Number(a.getAttribute("data-price")) - Number(b.getAttribute("data-price")) })
      if (sort.value === "laukums") list.sort(function (a, b) { return Number(a.getAttribute("data-area")) - Number(b.getAttribute("data-area")) })
      if (sort.value === "kartiba") list.sort(function (a, b) { return Number(a.getAttribute("data-order")) - Number(b.getAttribute("data-order")) })
      cards.forEach(function (card) { card.classList.add("hide") })
      list.forEach(function (card) { card.classList.remove("hide"); root.querySelector("[data-grid]").appendChild(card) })
      root.querySelector("[data-empty]").classList.toggle("hide", list.length !== 0)
    }
    root.querySelectorAll("[data-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        filter = button.getAttribute("data-filter")
        root.querySelectorAll("[data-filter]").forEach(function (item) { item.classList.toggle("on", item === button) })
        apply()
      })
    })
    query.addEventListener("input", apply)
    sort.addEventListener("change", apply)
  })

  document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
    var main = gallery.querySelector("[data-main]")
    gallery.querySelectorAll("[data-src]").forEach(function (button) {
      button.addEventListener("click", function () {
        main.setAttribute("src", button.getAttribute("data-src"))
        gallery.querySelectorAll("[data-src]").forEach(function (item) { item.classList.toggle("on", item === button) })
      })
    })
  })

  document.querySelectorAll("[data-postal-lookup]").forEach(function (input) {
    var out = document.querySelector(input.getAttribute("data-postal-lookup"))
    input.addEventListener("input", function () {
      var quote = delivery(input.value)
      if (!quote) { out.textContent = "Ievadi 4 ciparus, piemēram, 2167."; return }
      out.textContent = (quote.place ? quote.place + ". " : "") + (quote.fee == null ? quote.note : euro(quote.fee) + ". " + quote.note)
    })
  })

  var gift = document.querySelector("[data-gift]")
  if (gift) {
    gift.querySelectorAll("label.choice").forEach(function (label) {
      label.addEventListener("click", function () {
        gift.querySelectorAll("label.choice").forEach(function (item) { item.classList.remove("on") })
        label.classList.add("on")
      })
    })
    gift.addEventListener("submit", function (event) {
      event.preventDefault()
      var amount = (gift.querySelector("input[name=amount]:checked") || {}).value || ""
      var body = [
        "Dāvanu karte: " + amount + " €",
        "Vārds: " + gift.name.value,
        "Tālrunis: " + gift.phone.value,
        "E-pasts: " + gift.email.value,
        "Saņēmējs: " + gift.recipient.value,
        "Vēlējums: " + gift.notes.value
      ].join("\n")
      location.href = "mailto:" + data.email + "?subject=" + encodeURIComponent("Dāvanu karte " + amount + " €") + "&body=" + encodeURIComponent(body)
    })
  }
})()
