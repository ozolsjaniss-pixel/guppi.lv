(function () {
  var data = window.GUPPI || { products: [], busy: {}, codes: {} }
  var WEEK = ["P", "O", "T", "C", "Pk", "S", "Sv"]

  function iso(date) {
    var y = date.getFullYear()
    var m = String(date.getMonth() + 1).padStart(2, "0")
    var d = String(date.getDate()).padStart(2, "0")
    return y + "-" + m + "-" + d
  }
  function parse(value) {
    var bits = String(value || "").split("-")
    if (bits.length !== 3) return null
    var date = new Date(Number(bits[0]), Number(bits[1]) - 1, Number(bits[2]))
    return iso(date) === value ? date : null
  }
  function addDays(date, days) {
    var next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
    return next
  }
  function pretty(value) {
    var date = parse(value)
    if (!date) return value
    var label = new Intl.DateTimeFormat("lv-LV", { day: "numeric", month: "long", year: "numeric" }).format(date)
    return label
  }
  function euro(value) {
    if (value == null) return "Apstiprināsim"
    var has = Math.round(value * 100) % 100 !== 0
    return new Intl.NumberFormat("lv-LV", { style: "currency", currency: "EUR", minimumFractionDigits: has ? 2 : 0, maximumFractionDigits: 2 }).format(value)
  }
  function todayISO() {
    return iso(new Date())
  }
  function plusDays(days) {
    return iso(addDays(new Date(), days))
  }
  function range(start, days) {
    var date = parse(start)
    if (!date) return []
    var out = []
    for (var i = 0; i < days; i++) out.push(iso(addDays(date, i)))
    return out
  }
  function busySet(slug) {
    return new Set((data.busy && data.busy[slug]) || [])
  }
  function delivery(raw) {
    var code = String(raw || "").replace(/\D/g, "")
    if (code.length !== 4) return null
    if (data.codes && data.codes[code]) return Object.assign({ code: code }, data.codes[code])
    if (code.indexOf("10") === 0) return { code: code, fee: 20, place: "Rīga", note: "Pārējā Rīga ārpus bezmaksas apkaimēm." }
    return { code: code, fee: null, place: "", note: "Tālāk par Pierīgu cenu apstiprinām pirms avansa rēķina." }
  }

  function mountCalendar(root, options) {
    var slug = options.slug
    var days = options.days
    var value = options.value || ""
    var today = todayISO()
    var horizon = plusDays(180)
    var anchor = parse(value) || parse(today)
    var cursor = { y: anchor.getFullYear(), m: anchor.getMonth() }

    function canStart(day) {
      var span = range(day, days)
      if (span.length !== days) return false
      if (span[0] < today || span[span.length - 1] > horizon) return false
      var occupied = busySet(slug)
      return span.every(function (item) { return !occupied.has(item) })
    }
    function draw() {
      var first = new Date(cursor.y, cursor.m, 1)
      var offset = (first.getDay() + 6) % 7
      var start = addDays(first, -offset)
      var cells = []
      for (var i = 0; i < 42; i++) cells.push(addDays(start, i))
      var monthLabel = new Intl.DateTimeFormat("lv-LV", { month: "long", year: "numeric" }).format(first)
      monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      var occupied = busySet(slug)
      var span = value ? range(value, days) : []
      var spanSet = new Set(span)
      var freeCount = cells.filter(function (date) {
        return date.getMonth() === cursor.m && canStart(iso(date))
      }).length
      var monthKey = iso(first).slice(0, 7)
      var html = ''
      html += '<div class="cal-head"><div><p class="kicker" style="font-size:1.5rem">Brīvās dienas</p><p style="margin-top:0.25rem;font-weight:800">' + monthLabel + '</p></div><div>'
      html += '<button type="button" class="navbtn" data-shift="-1"' + (monthKey <= today.slice(0, 7) ? " disabled" : "") + '>‹</button> '
      html += '<button type="button" class="navbtn" data-shift="1"' + (monthKey >= horizon.slice(0, 7) ? " disabled" : "") + '>›</button></div></div>'
      html += '<p class="note" style="padding:0.7rem 1rem 0">' + (freeCount ? "Šomēnes var sākt nomu " + freeCount + (freeCount === 1 ? " dienā." : " dienās.") : "Šomēnes nav brīva sākuma diena šim ilgumam.") + '</p>'
      html += '<div class="week">' + WEEK.map(function (day) { return "<div>" + day + "</div>" }).join("") + '</div><div class="grid7">'
      cells.forEach(function (date) {
        var day = iso(date)
        var inMonth = date.getMonth() === cursor.m
        var taken = occupied.has(day)
        var startable = inMonth && canStart(day)
        var selected = spanSet.has(day)
        var isStart = day === value
        var cls = !inMonth ? "" : isStart ? "start" : selected ? "span" : taken ? "busy" : startable ? "free" : ""
        html += '<button type="button" class="' + cls + '" data-day="' + day + '"' + (startable ? "" : " disabled") + '>' + (inMonth ? date.getDate() : "") + '</button>'
      })
      html += '</div><div class="legend"><span><i class="sw" style="background:#1c9a4b"></i>Brīvs</span><span><i class="sw" style="background:#f6e7ef"></i>Aizņemts</span><span><i class="sw" style="background:#ae4a84"></i>Sākums</span><span><i class="sw" style="background:#f3a713"></i>Nomas dienas</span></div>'
      html += '<p class="note" style="padding:0 1rem 0.9rem">' + (value ? pretty(value) + (days > 1 ? " – " + pretty(span[span.length - 1]) : "") + ". Diena ir brīva." : "Zaļās dienas ir brīvas. Izvēlies sākumu.") + '</p>'
      root.innerHTML = html
      root.querySelectorAll("[data-shift]").forEach(function (button) {
        button.addEventListener("click", function () {
          var next = new Date(cursor.y, cursor.m + Number(button.getAttribute("data-shift")), 1)
          cursor = { y: next.getFullYear(), m: next.getMonth() }
          draw()
        })
      })
      root.querySelectorAll("[data-day]").forEach(function (button) {
        if (button.disabled) return
        button.addEventListener("click", function () {
          value = button.getAttribute("data-day")
          options.onChange(value)
          draw()
        })
      })
    }
    draw()
    return {
      setDays: function (next) { days = next; value = ""; options.onChange(""); draw() },
      setSlug: function (next) { slug = next; value = ""; options.onChange(""); draw() },
      clear: function () { value = ""; draw() },
      show: function (next) { value = next; var picked = parse(next); if (picked) cursor = { y: picked.getFullYear(), m: picked.getMonth() }; draw() }
    }
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

  document.querySelectorAll("[data-product-desk]").forEach(function (desk) {
    var slug = desk.getAttribute("data-slug")
    var prices = desk.getAttribute("data-prices").split(",").map(Number)
    var days = 1
    var date = ""
    var calRoot = desk.querySelector("[data-cal]")
    var go = desk.querySelector("[data-go]")
    var calendar = mountCalendar(calRoot, {
      slug: slug,
      days: days,
      value: "",
      onChange: function (next) {
        date = next
        if (!go) return
        if (date) {
          go.classList.remove("is-off")
          go.textContent = "Rezervēt šo dienu"
          go.setAttribute("href", go.getAttribute("data-base") + "?atrakcija=" + encodeURIComponent(slug) + "&datums=" + date + "&dienas=" + days)
        } else {
          go.classList.add("is-off")
          go.textContent = "Vispirms izvēlies dienu"
          go.setAttribute("href", "#kalendars")
        }
      }
    })
    desk.querySelectorAll("[data-days]").forEach(function (button) {
      button.addEventListener("click", function () {
        days = Number(button.getAttribute("data-days"))
        desk.querySelectorAll("[data-days]").forEach(function (item) { item.classList.toggle("on", item === button) })
        calendar.setDays(days)
      })
    })
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

  function paintQuote(box, product, days, date, postal) {
    if (!box) return
    var rental = product ? product.prices[days - 1] : 0
    var quote = delivery(postal)
    var fee = quote && quote.fee != null ? quote.fee : null
    var pending = !quote || quote.fee == null
    var total = rental + (fee || 0)
    var deposit = Math.round(total * 20) / 100
    box.querySelector("[data-name]").textContent = product ? product.name : ""
    box.querySelector("[data-rental]").textContent = euro(rental)
    box.querySelector("[data-delivery]").textContent = !quote ? "Apstiprināsim" : pending ? "Apstiprināsim" : euro(fee)
    box.querySelector("[data-total]").textContent = euro(total)
    box.querySelector("[data-deposit]").textContent = euro(deposit)
    box.querySelector("[data-balance]").textContent = euro(Math.round((total - deposit) * 100) / 100)
    var note = box.querySelector("[data-note]")
    if (!quote) note.textContent = "Ievadi pasta indeksu, lai redzētu piegādi."
    else note.textContent = (quote.place ? quote.place + ". " : "") + (quote.note || "")
  }

  var book = document.querySelector("[data-book]")
  if (book) {
    var params = new URLSearchParams(location.search)
    var slug = params.get("atrakcija") || (data.products[0] && data.products[0].slug) || ""
    var days = Number(params.get("dienas"))
    if (days !== 2 && days !== 3) days = 1
    var date = params.get("datums") || ""
    if (date < todayISO()) date = ""
    var select = book.querySelector("[data-slug]")
    var postal = book.querySelector("[data-postal]")
    var form = book.querySelector("form")
    var fields = book.querySelector("[data-fields]")
    var picked = book.querySelector("[data-picked]")
    var calHost = book.querySelector("[data-cal]")
    var hint = book.querySelector("[data-hint]")
    select.value = slug
    book.querySelectorAll("[data-days]").forEach(function (button) {
      button.classList.toggle("on", Number(button.getAttribute("data-days")) === days)
    })
    function product() {
      return data.products.filter(function (item) { return item.slug === slug })[0]
    }
    function syncPrices() {
      var item = product()
      book.querySelectorAll("[data-days]").forEach(function (button) {
        var n = Number(button.getAttribute("data-days"))
        button.querySelector("b").textContent = item ? euro(item.prices[n - 1]) : ""
      })
      paintQuote(book.querySelector("[data-summary]"), item, days, date, postal.value)
    }
    function showForm(open) {
      fields.classList.toggle("hide", !open)
      hint.classList.toggle("hide", open)
      picked.classList.toggle("hide", !open)
      calHost.classList.toggle("hide", open)
      if (open) picked.querySelector("strong").textContent = pretty(date) + (days > 1 ? " – " + pretty(range(date, days).slice(-1)[0]) : "")
    }
    var calendar = mountCalendar(calHost, {
      slug: slug,
      days: days,
      value: date,
      onChange: function (next) {
        date = next
        showForm(Boolean(date))
        syncPrices()
      }
    })
    if (date) calendar.show(date)
    showForm(Boolean(date))
    syncPrices()
    select.addEventListener("change", function () {
      slug = select.value
      date = ""
      calendar.setSlug(slug)
      showForm(false)
      syncPrices()
    })
    book.querySelectorAll("[data-days]").forEach(function (button) {
      button.addEventListener("click", function () {
        days = Number(button.getAttribute("data-days"))
        book.querySelectorAll("[data-days]").forEach(function (item) { item.classList.toggle("on", item === button) })
        date = ""
        calendar.setDays(days)
        showForm(false)
        syncPrices()
      })
    })
    picked.querySelector("button").addEventListener("click", function () {
      date = ""
      calendar.clear()
      showForm(false)
    })
    postal.addEventListener("input", syncPrices)
    form.addEventListener("submit", function (event) {
      event.preventDefault()
      var item = product()
      var body = [
        "Atrakcija: " + (item ? item.name : slug),
        "Datums: " + pretty(date),
        "Dienas: " + days,
        "Vārds: " + form.name.value,
        "Tālrunis: " + form.phone.value,
        "E-pasts: " + form.email.value,
        "Adrese: " + form.address.value,
        "Indekss: " + form.postal.value,
        "Bērnu vecums: " + form.childAge.value,
        "Kods: " + form.code.value,
        "Piezīmes: " + form.notes.value
      ].join("\n")
      var mail = "mailto:" + data.email + "?subject=" + encodeURIComponent("Rezervācija " + (item ? item.name : "")) + "&body=" + encodeURIComponent(body)
      var wa = data.whatsapp + "?text=" + encodeURIComponent(body)
      book.querySelector("[data-sent]").classList.remove("hide")
      book.querySelector("[data-sent] a.mail").setAttribute("href", mail)
      book.querySelector("[data-sent] a.wa").setAttribute("href", wa)
      location.href = mail
    })
  }

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
