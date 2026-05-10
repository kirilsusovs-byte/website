/**
 * js/script.js — „13th Round” vietnes funkcionalitāte.
 * Mobilā izvēlne: klasē uz <body>, lai rāda/paslēpj navigācijas sarakstu mazos ekrānos.
 * Galerija: kategoriju filtrs (data-gallery-tag); lightbox iekš #lightbox.
 * Forma: validācija pirms „nosūtīšanas”; kļūdas #signup-errors; kopsavilkums #signup-result.
 * BUJ (FAQ): vienlaikus atvērta tikai viena `<details>` sadaļa.
 */
(function () {
  "use strict";

  /** Īss palīgfunkciju pāris, lai neuzrakstītu garu kodu atkārtoti. */
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  /** Skaitļo tikai ciparus tālrunim (bez atstarpēm), lai vieglāk pārbaudīt garumu LV formātam. */
  function lvPhoneDigits(s) {
    return (s || "").replace(/\D/g, "");
  }

  /** Mobilā izvēlne: pogas `#nav-toggle` nospiedums pārslēdz `aria-expanded` un `body.nav-open`. */
  function initNav() {
    var toggle = qs("#nav-toggle");
    var sheet = qs("#nav-sheet");
    if (!toggle || !sheet) return;

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      document.body.classList.toggle("nav-open", !expanded);
    });

    qsa(".nav__links a", sheet).forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 959px)").matches) {
          toggle.setAttribute("aria-expanded", "false");
          document.body.classList.remove("nav-open");
        }
      });
    });

    window.addEventListener(
      "resize",
      debounce(function () {
        if (window.matchMedia("(min-width: 960px)").matches) {
          toggle.setAttribute("aria-expanded", "false");
          document.body.classList.remove("nav-open");
        }
      }, 180)
    );
  }

  /** Neliels debounce augšējā resize klausītājam, lai nevairākas reizes netraucētu. */
  function debounce(fn, ms) {
    var id;
    return function () {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }

  /** Filtrs `.gallery-filter` pogām salīdzina attēlus pēc `[data-gallery-tag]`. “visi” rāda visu. */
  function initGalleryFilters() {
    var buttons = qsa(".gallery-filter");
    var items = qsa(".gallery figure[data-gallery-tag]");
    if (!buttons.length || !items.length) return;

    function applyFilter(btn) {
      var filter = btn.getAttribute("data-filter") || "visi";
      buttons.forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      items.forEach(function (fig) {
        var tag = (fig.getAttribute("data-gallery-tag") || "").toLowerCase();
        var show =
          filter === "visi" ? true : tag.split(/\s+/).indexOf(filter) !== -1;
        fig.classList.toggle("is-hidden", !show);
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn);
      });
    });

    var starter =
      qs(".gallery-filter.is-active", document) ||
      qs(".gallery-filter", document);
    applyFilter(starter);
  }

  /** Click uz `.gallery__thumb` atvēr `#lightbox` ar `src`, `alt` un parakstu. */
  function initLightbox() {
    var overlay = qs("#lightbox");
    if (!overlay) return;
    var img = qs(".lightbox__img", overlay);
    var cap = qs(".lightbox__caption", overlay);
    var btnClose = qs(".lightbox__close", overlay);
    var lastFocus = null;

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (img) {
        img.removeAttribute("src");
        img.alt = "";
      }
      if (cap) {
        cap.textContent = "";
      }
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
    }

    function openFromThumb(btn) {
      var figure = btn.closest("figure");
      if (!figure) return;
      var source = qs("img", btn);
      if (!source || !img || !cap) return;
      var figcap = qs("figcaption", figure);
      lastFocus = document.activeElement;
      img.src = source.currentSrc || source.src || "";
      img.alt = source.alt || "";
      cap.textContent = figcap ? figcap.textContent.trim() : "";
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (btnClose && typeof btnClose.focus === "function") {
        btnClose.focus({ preventScroll: true });
      }
    }

    document.addEventListener("click", function (e) {
      var thumb = e.target.closest(".gallery__thumb");
      if (thumb && document.body.contains(thumb)) {
        e.preventDefault();
        openFromThumb(thumb);
      }
    });

    document.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && document.activeElement) {
        var el = document.activeElement;
        if (el.classList && el.classList.contains("gallery__thumb")) {
          e.preventDefault();
          openFromThumb(el);
          return;
        }
      }

      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    if (btnClose) {
      btnClose.addEventListener("click", close);
    }

  }

  /** Pieteikuma forma `#signup-form`: lauku pārbaude + kļūdu saraksts + izvadītie dati blokā `#signup-result`. */
  function initSignupForm() {
    var form = qs("#signup-form");
    var errBox = qs("#signup-errors");
    var errList = qs("#signup-errors-list", errBox) || qs("ul", errBox);
    var resultBox = qs("#signup-result");
    var resultInner = qs("#signup-result-inner", resultBox);

    if (!form || !errBox || !errList || !resultBox || !resultInner) return;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      errBox.hidden = true;
      resultBox.hidden = true;
      errList.innerHTML = "";

      var errors = [];

      /** elementu vērtības no `FormData`. */
      var fd = new FormData(form);

      /** Palīgkārta: pievieno kļūdas tekstu uz saraksta. */
      function addErr(message) {
        errors.push(message);
      }

      var fullName = String(fd.get("fullname") || "").trim();
      var partsName = fullName.split(/\s+/).filter(Boolean);
      if (!fullName.length || partsName.length < 2 || fullName.length < 6)
        addErr("Norādi vārdu un uzvārdu (vismaz divi vārdi, kopā ≥ 6 rakstzīmes).");

      var email = String(fd.get("email") || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) addErr("Ievadi derīgu e-pasta adresi.");

      var phoneRaw = String(fd.get("phone") || "").trim();
      var digits = lvPhoneDigits(phoneRaw || "");
      if (digits.length < 8 || digits.length > 11)
        addErr("Tālruņim jāietver vismaz 8 cipari (iekļaujot valsts kodu vai bez tā).");

      var birth = String(fd.get("birthdate") || "");
      var age = approximateAgeYears(birth);
      if (!birth || age === null || age < 13 || age > 90)
        addErr("Norādi pareizu dzimšanas datumu (vēlams 13–90 gadi).");

      var levelSet = !!fd.get("level");
      if (!levelSet) addErr('Izvēlies savu līmeni („Līmenis”).');

      var plan = fd.get("plan");
      if (!plan) addErr('Izvēlies treniņu formātu („Nodarbības veids”).');

      /** vismaz viena iezīme rūtinā `interest[]`. */
      if (!fd.getAll("interest[]").some(Boolean))
        addErr("Atzīmē vismaz vienu „Intereses” opciju.");

      var agree = form.querySelector('[name="agree"]');
      if (!agree || !agree.checked)
        addErr("Jāapstiprina, ka dati uzrakstīti patiesi (atzīmes rūtiņa pie apstiprinājuma).");

      var comment = String(fd.get("comments") || "").trim();
      if (!comment.length) addErr("Lūdzu raksti īsu komentāru piezīmei (vēlmes, veselības ierobežojumi …).");

      if (errors.length) {
        errBox.hidden = false;
        errors.forEach(function (msg) {
          var li = document.createElement("li");
          li.textContent = msg;
          errList.appendChild(li);
        });
        return;
      }

      /** Ja kļūdu nav — veido lasāmu rezultāta kopsavilkumu (tikai lapā; netiek sūtīts uz serveri). */
      var interestChosen = [];
      form.querySelectorAll('input[name="interest[]"]:checked').forEach(function (cb) {
        var lbl = cb.getAttribute("data-caption") || cb.value || "";
        interestChosen.push(lbl.trim());
      });

      var planLbl = plan;
      var planInputEl = qs('input[name="plan"]:checked', form);
      if (planInputEl) {
        var planLabelEl = qs(".radio-label-text", planInputEl.closest("label.radio-row"));
        planLbl = planLabelEl ? planLabelEl.textContent.trim() : String(plan || "");
      }

      var levelSelect = qs('select[name="level"] option:checked', form);
      var levelText = levelSelect ? levelSelect.textContent.trim() : "";

      resultInner.innerHTML = "";

      appendRow(resultInner, "Vārds, uzvārds", fullName);
      appendRow(resultInner, "E-pasts", email);
      appendRow(resultInner, "Tālrunis", phoneRaw || digits);
      appendRow(resultInner, "Vecums (apm.)", String(approximateAgeYears(birth)) + " gadi");
      appendRow(resultInner, "Līmenis", levelText);
      appendRow(resultInner, "Nodarbību veids", planLbl);
      appendRow(resultInner, "Intereses", interestChosen.join(", "));
      appendRow(resultInner, "Piezīme", comment);

      resultBox.hidden = false;
      form.reset();
      resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /** Dzimšanas datuma līdz šodienai sakārta vecuma aprēķins (bez laika zonām). */
  function approximateAgeYears(isoLike) {
    if (!isoLike || !/\d{4}-\d{2}-\d{2}/.test(isoLike)) return null;
    var parts = isoLike.split("-");
    var y = Number(parts[0]);
    var m = Number(parts[1]) - 1;
    var d = Number(parts[2]);
    if (!y || m < 0 || d < 1) return null;

    var today = new Date();
    var birth = new Date(y, m, d);
    birth.setHours(0, 0, 0, 0);
    if (isNaN(birth.getTime())) return null;
    var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (birth.getTime() > todayStart.getTime()) return null;
    var age = today.getFullYear() - birth.getFullYear();
    var mo = today.getMonth() - birth.getMonth();
    if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  /** `<dl>` rinda ar tekstu bez HTML ievietošanas (`textContent`). */
  function appendRow(dl, dtText, ddText) {
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = dtText;
    dd.textContent = ddText;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  /** FAQ: vienam `details.open` laikā citi tiek automātiski slēgti. */
  function initFaq() {
    var root = qs(".faq-list");
    if (!root) return;
    qsa("details.faq-details", root).forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (!details.open) return;
        qsa("details.faq-details", root).forEach(function (other) {
          if (other !== details && other.open) other.open = false;
        });
      });
    });
  }

  /** Palaiž visus moduļus, kad DOM būvēts pilnībā. */
  function initAll() {
    initNav();
    initGalleryFilters();
    initLightbox();
    initSignupForm();
    initFaq();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
