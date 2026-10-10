/* DCS Construtora — interações do site */
(function () {
  "use strict";

  var WHATSAPP = "5549991277677";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  /* Abertura local (file://): links de pasta passam a apontar para index.html */
  if (location.protocol === "file:") {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      var parts = href.split("#");
      if (parts[0] === "" || parts[0].slice(-1) === "/") {
        parts[0] = (parts[0] || "./") + "index.html";
        a.setAttribute("href", parts.join("#"));
      }
    });
  }

  /* Ano no rodapé */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Cabeçalho com sombra ao rolar */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Menu mobile */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".menu-toggle__label").textContent = open ? "Fechar" : "Menu";
    body.classList.toggle("is-locked", open);
    if (open) menu.querySelector("a").focus();
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(menu.hidden);
    });

    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") {
        setMenu(false);
        toggle.focus();
      }
      if (e.key === "Tab") {
        var items = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll("a")));
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    window.matchMedia("(min-width: 1181px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* Animação de entrada */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (!reducedMotion && "IntersectionObserver" in window && revealEls.length) {
    body.classList.add("js-motion");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Slideshow do topo */
  var slideshow = document.querySelector(".slideshow");
  if (slideshow) {
    var slides = slideshow.querySelectorAll(".slide");
    var dots = slideshow.querySelectorAll(".slideshow__dots button");
    var caption = slideshow.querySelector(".slideshow__caption");
    var captionText = caption.querySelector("span");
    var current = 0;
    var timer = null;
    var duration = 6000;

    slideshow.style.setProperty("--slide-time", duration + "ms");

    var show = function (index) {
      slides[current].classList.remove("is-active");
      dots[current].removeAttribute("aria-current");
      current = (index + slides.length) % slides.length;
      var slide = slides[current];
      slide.classList.add("is-active");
      // reinicia a barra de progresso
      void dots[current].offsetWidth;
      dots[current].setAttribute("aria-current", "true");
      captionText.textContent = slide.dataset.caption;
      caption.setAttribute("href", slide.dataset.href);
    };

    var play = function () {
      if (reducedMotion) return;
      clearInterval(timer);
      timer = setInterval(function () {
        show(current + 1);
      }, duration);
      slideshow.classList.remove("is-paused");
    };

    var pause = function () {
      clearInterval(timer);
      slideshow.classList.add("is-paused");
    };

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });

    slideshow.addEventListener("mouseenter", pause);
    slideshow.addEventListener("mouseleave", play);
    slideshow.addEventListener("focusin", pause);
    slideshow.addEventListener("focusout", play);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
      else play();
    });

    if (reducedMotion) slideshow.classList.add("is-paused");
    play();
  }

  /* Filtros do portfólio */
  var filterButtons = document.querySelectorAll("[data-filter]");
  if (filterButtons.length) {
    var cards = document.querySelectorAll("[data-category]");
    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.dataset.filter;
        filterButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === button));
        });
        cards.forEach(function (card) {
          card.hidden = filter !== "all" && card.dataset.category !== filter;
          card.classList.add("is-visible");
        });
      });
    });
  }

  /* Galeria com lightbox */
  var lightbox = document.getElementById("lightbox");
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  if (lightbox && galleryItems.length && typeof lightbox.showModal === "function") {
    var lbImg = lightbox.querySelector("img");
    var lbCaption = lightbox.querySelector(".lightbox__caption");
    var lbCount = lightbox.querySelector(".lightbox__count");
    var lbPrev = lightbox.querySelector(".lightbox__prev");
    var lbNext = lightbox.querySelector(".lightbox__next");
    // a capa repete a primeira foto da galeria: usa só uma lista sem duplicatas
    var sources = [];
    galleryItems.forEach(function (item) {
      if (sources.indexOf(item.dataset.lightbox) === -1) sources.push(item.dataset.lightbox);
    });
    var alts = sources.map(function (src) {
      var item = galleryItems.filter(function (el) {
        return el.dataset.lightbox === src;
      })[0];
      return item.querySelector("img").alt;
    });
    var index = 0;
    var opener = null;

    var render = function () {
      lbImg.src = sources[index];
      lbImg.alt = alts[index];
      lbCaption.textContent = alts[index];
      lbCount.textContent = String(index + 1).padStart(2, "0") + " / " + String(sources.length).padStart(2, "0");
      var single = sources.length < 2;
      lbPrev.hidden = single;
      lbNext.hidden = single;
    };

    var go = function (step) {
      index = (index + step + sources.length) % sources.length;
      render();
    };

    galleryItems.forEach(function (item) {
      item.addEventListener("click", function () {
        opener = item;
        index = sources.indexOf(item.dataset.lightbox);
        render();
        lightbox.showModal();
        body.classList.add("is-locked");
      });
    });

    lbPrev.addEventListener("click", function () {
      go(-1);
    });
    lbNext.addEventListener("click", function () {
      go(1);
    });
    lightbox.querySelector(".lightbox__close").addEventListener("click", function () {
      lightbox.close();
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("lightbox__stage")) lightbox.close();
    });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });
    lightbox.addEventListener("close", function () {
      body.classList.remove("is-locked");
      if (opener) opener.focus();
    });

    var touchX = null;
    lightbox.addEventListener(
      "touchstart",
      function (e) {
        touchX = e.touches[0].clientX;
      },
      { passive: true }
    );
    lightbox.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      touchX = null;
    });
  }

  /* Formulário de contato: monta a mensagem e abre o WhatsApp */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.nome;
      var error = form.querySelector(".field__error");
      if (!name.value.trim()) {
        name.setAttribute("aria-invalid", "true");
        error.hidden = false;
        name.focus();
        return;
      }
      name.removeAttribute("aria-invalid");
      error.hidden = true;

      var lines = ["Olá, DCS! Meu nome é " + name.value.trim() + "."];
      var service = form.elements.servico.value;
      var city = form.elements.cidade.value.trim();
      var message = form.elements.mensagem.value.trim();
      if (service) lines.push("Tenho interesse em: " + service + ".");
      if (city) lines.push("Local da obra: " + city + ".");
      if (message) lines.push("", message);

      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });

    form.elements.nome.addEventListener("input", function () {
      if (this.value.trim()) {
        this.removeAttribute("aria-invalid");
        form.querySelector(".field__error").hidden = true;
      }
    });
  }

  /* Mapa carregado somente quando o visitante pede */
  var mapButton = document.querySelector("[data-load-map]");
  if (mapButton) {
    mapButton.addEventListener("click", function () {
      var holder = mapButton.closest(".map");
      var iframe = document.createElement("iframe");
      iframe.src = mapButton.dataset.loadMap;
      iframe.title = "Mapa: escritório da DCS em Lages, SC";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      holder.innerHTML = "";
      holder.appendChild(iframe);
    });
  }

  /* Ao voltar pelo histórico, fecha menu e lightbox */
  window.addEventListener("pageshow", function () {
    setMenu(false);
    if (lightbox && lightbox.open) lightbox.close();
    body.classList.remove("is-locked");
  });
})();
