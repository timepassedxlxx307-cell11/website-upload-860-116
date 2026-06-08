(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function initMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "×" : "☰";
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var next = Number(dot.getAttribute("data-hero-dot") || "0");
        show(next);
        start();
      });
    });

    var hero = document.querySelector(".hero");
    if (hero) {
      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
    }
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initSearch() {
    var input = document.querySelector("[data-search-input]");
    var clear = document.querySelector("[data-search-clear]");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
    if (!input || !cards.length) {
      return;
    }

    function run(value) {
      var keyword = normalize(value);
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-year"),
          card.textContent
        ].join(" "));
        card.classList.toggle("is-hidden", Boolean(keyword) && haystack.indexOf(keyword) === -1);
      });
    }

    input.addEventListener("input", function () {
      run(input.value);
    });

    if (clear) {
      clear.addEventListener("click", function () {
        input.value = "";
        run("");
        input.focus();
      });
    }

    document.querySelectorAll("[data-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        input.value = button.getAttribute("data-filter") || "";
        run(input.value);
      });
    });
  }

  function initPlayers() {
    document.querySelectorAll("[data-player-shell]").forEach(function (shell) {
      var video = shell.querySelector("video[data-src]");
      var button = shell.querySelector("[data-player]");
      if (!video) {
        return;
      }

      function startPlayback(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        attachStream(video, shell);
      }

      if (button) {
        button.addEventListener("click", startPlayback);
      }

      shell.addEventListener("click", function (event) {
        if (event.target === video || event.target.closest("button")) {
          return;
        }
        startPlayback(event);
      });

      video.addEventListener("play", function () {
        shell.classList.add("is-ready");
      });
    });
  }

  function attachStream(video, shell) {
    var source = video.getAttribute("data-src");
    if (!source) {
      return;
    }

    if (video.getAttribute("data-ready") === "true") {
      var activePlay = video.play();
      if (activePlay && typeof activePlay.catch === "function") {
        activePlay.catch(function () {});
      }
      return;
    }

    function play() {
      video.setAttribute("data-ready", "true");
      if (shell) {
        shell.classList.add("is-ready");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      video.addEventListener("loadedmetadata", play, { once: true });
      video.load();
      return;
    }

    var Hls = window.Hls;
    if (Hls && Hls.isSupported()) {
      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, play);
      hls.on(Hls.Events.ERROR, function (eventName, data) {
        if (data && data.fatal) {
          shell.classList.add("is-ready");
        }
      });
      video._hls = hls;
      return;
    }

    video.src = source;
    video.addEventListener("loadedmetadata", play, { once: true });
    video.load();
  }

  ready(function () {
    initMenu();
    initHero();
    initSearch();
    initPlayers();
  });
})();
