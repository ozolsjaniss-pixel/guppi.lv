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
    var start = new URLSearchParams(location.search).get("grupa")
    var preset = start && root.querySelector('[data-filter="' + start.replace(/[^a-z]/g, "") + '"]')
    if (preset) preset.click()
  })

  // Galerija: bultas, skaitītājs, vilkšana ar pirkstu, tastatūra un pilnekrāna skats.
  document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
    var main = gallery.querySelector("[data-main]")
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll("[data-src]"))
    var srcs = thumbs.map(function (b) { return b.getAttribute("data-src") })
    var at = 0
    var stage = document.createElement("div")
    stage.className = "stage"
    main.parentNode.insertBefore(stage, main)
    stage.appendChild(main)
    function button(cls, label, svg) {
      var b = document.createElement("button")
      b.type = "button"
      b.className = cls
      b.setAttribute("aria-label", label)
      b.innerHTML = svg
      return b
    }
    var arrowL = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>'
    var arrowR = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
    var count = document.createElement("span")
    count.className = "g-count"
    var zoom = button("g-zoom", "Atvērt pilnā izmērā", '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>Palielināt')
    if (srcs.length > 1) {
      var prev = button("g-nav prev", "Iepriekšējā bilde", arrowL)
      var next = button("g-nav next", "Nākamā bilde", arrowR)
      prev.addEventListener("click", function () { show(at - 1) })
      next.addEventListener("click", function () { show(at + 1) })
      stage.appendChild(prev)
      stage.appendChild(next)
      stage.appendChild(count)
    }
    stage.appendChild(zoom)
    function show(i) {
      at = (i + srcs.length) % srcs.length
      main.setAttribute("src", srcs[at])
      count.textContent = (at + 1) + " / " + srcs.length
      thumbs.forEach(function (b, k) { b.classList.toggle("on", k === at) })
      if (box.open) { boxImg.src = srcs[at]; boxCount.textContent = count.textContent }
    }
    thumbs.forEach(function (b, k) { b.addEventListener("click", function () { show(k) }) })
    var x0 = null
    stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX }, { passive: true })
    stage.addEventListener("touchend", function (e) {
      if (x0 === null) return
      var dx = e.changedTouches[0].clientX - x0
      if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1))
      x0 = null
    })
    // pilnekrāna skats
    var box = document.createElement("dialog")
    box.className = "lightbox"
    var boxImg = document.createElement("img")
    boxImg.alt = main.alt
    var boxCount = document.createElement("span")
    boxCount.className = "g-count"
    var close = button("g-close", "Aizvērt", "×")
    close.addEventListener("click", function () { box.close() })
    box.appendChild(boxImg)
    if (srcs.length > 1) {
      var bp = button("g-nav prev", "Iepriekšējā bilde", arrowL)
      var bn = button("g-nav next", "Nākamā bilde", arrowR)
      bp.addEventListener("click", function () { show(at - 1) })
      bn.addEventListener("click", function () { show(at + 1) })
      box.appendChild(bp)
      box.appendChild(bn)
      box.appendChild(boxCount)
    }
    box.appendChild(close)
    box.addEventListener("click", function (e) { if (e.target === box) box.close() })
    document.body.appendChild(box)
    function open() {
      if (!box.showModal) return
      boxImg.src = srcs[at]
      boxCount.textContent = count.textContent
      box.showModal()
    }
    main.addEventListener("click", open)
    zoom.addEventListener("click", open)
    document.addEventListener("keydown", function (e) {
      if (!box.open) return
      if (e.key === "ArrowLeft") show(at - 1)
      if (e.key === "ArrowRight") show(at + 1)
    })
    show(0)
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
  // Kustība: parādās ritinot, skaitļi skaita, ja lietotājs nav lūdzis mazāk kustības.
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  document.documentElement.classList.add("js")
  var seen = "IntersectionObserver" in window && !calm ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return
      entry.target.classList.add("in")
      if (entry.target.hasAttribute("data-count")) countUp(entry.target)
      seen.unobserve(entry.target)
    })
  }, { threshold: 0.15 }) : null
  document.querySelectorAll(".reveal, [data-count]").forEach(function (el) {
    if (seen) seen.observe(el)
    else el.classList.add("in")
  })
  function countUp(el) {
    var end = Number(el.getAttribute("data-count"))
    if (!end) return
    var start = performance.now()
    var suffix = el.getAttribute("data-suffix") || ""
    function step(now) {
      var t = Math.min(1, (now - start) / 1200)
      el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))) + suffix
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // Atsauksmju siena: divas rindas slīd pretējos virzienos, apstājas, kad uzbrauc ar peli.
  var AV = ["#ae4a84", "#f3a713", "#1c9a4b", "#6a4fb3", "#d0607f", "#2f8fbf"]
  function card(review, i) {
    var el = document.createElement("figure")
    el.className = "rv"
    var stars = document.createElement("span")
    stars.className = "stars"
    stars.textContent = "★★★★★".slice(0, Math.max(1, Math.min(5, review.rating || 5)))
    var text = document.createElement("p")
    text.textContent = review.text
    var who = document.createElement("figcaption")
    who.className = "who"
    var av = document.createElement("span")
    av.className = "avatar"
    av.style.setProperty("--av", AV[i % AV.length])
    av.textContent = (review.author || "?").trim().charAt(0).toUpperCase()
    who.appendChild(av)
    who.appendChild(document.createTextNode(review.author || "Klients"))
    el.appendChild(stars)
    el.appendChild(text)
    el.appendChild(who)
    return el
  }
  function loop(track) {
    track.querySelectorAll("[data-clone]").forEach(function (el) { el.remove() })
    if (calm) return
    Array.prototype.slice.call(track.children).forEach(function (el) {
      var copy = el.cloneNode(true)
      copy.setAttribute("data-clone", "")
      copy.setAttribute("aria-hidden", "true")
      track.appendChild(copy)
    })
    track.style.setProperty("--dur", Math.max(30, Math.round(track.scrollWidth / 2 / 45)) + "s")
  }
  var wall = document.querySelector("[data-reviews-wall]")
  if (wall) wall.querySelectorAll(".wall-track").forEach(loop)
  window.guppiReviews = function (list) {
    if (!wall || !list.length) return
    var tracks = wall.querySelectorAll(".wall-track")
    tracks.forEach(function (track) { track.innerHTML = "" })
    list.forEach(function (review, i) { tracks[i % tracks.length].appendChild(card(review, i)) })
    tracks.forEach(loop)
    if (spotlight) spotlight.set(list.filter(function (r) { return r.text.length > 70 }).slice(0, 6))
  }

  // Izceltā atsauksme: mainās ik pēc 7 s, var izvēlēties ar punktiem.
  var spot = document.querySelector("[data-spotlight]")
  var spotlight = null
  if (spot) {
    var quote = spot.querySelector("blockquote")
    var name = spot.querySelector("[data-who]")
    var initial = spot.querySelector(".avatar")
    var dots = spot.querySelector(".dots")
    var items = JSON.parse(spot.getAttribute("data-spotlight") || "[]")
    var at = 0
    var timer = null
    function show(i) {
      at = (i + items.length) % items.length
      spot.classList.add("fade")
      setTimeout(function () {
        quote.textContent = "“" + items[at].text + "”"
        name.textContent = items[at].author
        initial.textContent = items[at].author.charAt(0).toUpperCase()
        initial.style.setProperty("--av", AV[at % AV.length])
        dots.querySelectorAll("button").forEach(function (b, k) { b.classList.toggle("on", k === at) })
        spot.classList.remove("fade")
      }, calm ? 0 : 300)
    }
    function drawDots() {
      dots.innerHTML = ""
      items.forEach(function (item, k) {
        var b = document.createElement("button")
        b.type = "button"
        b.setAttribute("aria-label", "Atsauksme " + (k + 1))
        b.className = k === at ? "on" : ""
        b.addEventListener("click", function () { show(k); restart() })
        dots.appendChild(b)
      })
    }
    function restart() {
      clearInterval(timer)
      if (!calm && items.length > 1) timer = setInterval(function () { show(at + 1) }, 7000)
    }
    spotlight = { set: function (list) { if (!list.length) return; items = list; at = 0; drawDots(); show(0); restart() } }
    drawDots()
    restart()
    spot.addEventListener("mouseenter", function () { clearInterval(timer) })
    spot.addEventListener("mouseleave", restart)
  }
})()
