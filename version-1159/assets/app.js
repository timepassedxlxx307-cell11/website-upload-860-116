document.addEventListener("DOMContentLoaded", function () {
  setupMenu();
  setupSearch();
  setupHero();
  setupPlayers();
});

function setupMenu() {
  var button = document.querySelector("[data-menu-button]");
  var nav = document.querySelector("[data-mobile-nav]");

  if (!button || !nav) {
    return;
  }

  button.addEventListener("click", function () {
    nav.classList.toggle("open");
  });
}

function setupSearch() {
  var forms = document.querySelectorAll("[data-search-form]");

  forms.forEach(function (form) {
    var input = form.querySelector("[data-search-input]");
    var scopeSelector = form.getAttribute("data-search-scope");
    var scope = scopeSelector ? document.querySelector(scopeSelector) : document;
    var empty = document.querySelector("[data-empty-state]");

    if (!input || !scope) {
      return;
    }

    function applySearch() {
      var query = input.value.trim().toLowerCase();
      var cards = scope.querySelectorAll("[data-movie-card]");
      var visible = 0;

      cards.forEach(function (card) {
        var content = (card.getAttribute("data-search") || card.textContent || "").toLowerCase();
        var matched = !query || content.indexOf(query) !== -1;
        card.classList.toggle("hidden-by-search", !matched);
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("show", visible === 0);
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      applySearch();
    });

    input.addEventListener("input", applySearch);
  });
}

function setupHero() {
  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));

  if (slides.length <= 1) {
    return;
  }

  var index = 0;
  var timer = null;

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("active", slideIndex === index);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("active", dotIndex === index);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(function () {
      show(index + 1);
    }, 5600);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      var next = Number(dot.getAttribute("data-hero-dot"));
      show(next);
      start();
    });
  });

  start();
}

function setupPlayers() {
  var players = document.querySelectorAll("[data-player]");

  players.forEach(function (box) {
    var video = box.querySelector("video");
    var button = box.querySelector("[data-play-button]");
    var status = box.querySelector("[data-player-status]");
    var stream = box.getAttribute("data-stream");
    var loaded = false;
    var hlsInstance = null;

    if (!video || !button || !stream) {
      return;
    }

    function setStatus(text) {
      if (status) {
        status.textContent = text;
      }
    }

    function loadStream() {
      if (loaded) {
        return true;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        loaded = true;
        setStatus("加载中");
        return true;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        loaded = true;
        setStatus("加载中");
        return true;
      }

      setStatus("播放环境受限");
      return false;
    }

    function playVideo() {
      if (!loadStream()) {
        return;
      }

      video.controls = true;
      box.classList.add("is-playing");

      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          box.classList.remove("is-playing");
          setStatus("点击继续播放");
        });
      }
    }

    button.addEventListener("click", playVideo);

    video.addEventListener("click", function () {
      if (video.paused) {
        playVideo();
      }
    });

    video.addEventListener("playing", function () {
      box.classList.add("is-playing");
      setStatus("播放中");
    });

    video.addEventListener("pause", function () {
      if (!video.ended) {
        setStatus("已暂停");
      }
    });

    video.addEventListener("error", function () {
      setStatus("视频加载失败");
    });

    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
}
