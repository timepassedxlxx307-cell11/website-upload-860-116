(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  window.initMoviePlayer = function (videoId, streamUrl) {
    var video = document.getElementById(videoId);
    if (!video || !streamUrl) {
      return;
    }

    var frame = video.closest("[data-player]");
    var button = frame ? frame.querySelector(".play-overlay") : null;
    var hlsInstance = null;
    var attached = false;

    function attachStream() {
      if (attached) {
        return;
      }

      attached = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        return;
      }

      video.src = streamUrl;
    }

    function hideButton() {
      if (button) {
        button.classList.add("is-hidden");
      }
    }

    function showButton() {
      if (button && video.paused) {
        button.classList.remove("is-hidden");
      }
    }

    function startPlayback() {
      attachStream();
      hideButton();
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(showButton);
      }
    }

    if (button) {
      button.addEventListener("click", startPlayback);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        startPlayback();
      }
    });

    video.addEventListener("play", hideButton);
    video.addEventListener("pause", showButton);
    video.addEventListener("ended", showButton);

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  ready(function () {
    var navToggle = document.querySelector(".nav-toggle");
    var mobilePanel = document.getElementById("mobile-menu");

    if (navToggle && mobilePanel) {
      navToggle.addEventListener("click", function () {
        var isOpen = mobilePanel.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
      var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dots button"));
      var index = slides.findIndex(function (slide) {
        return slide.classList.contains("is-active");
      });

      if (index < 0) {
        index = 0;
      }

      function show(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
          dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
        });
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          show(dotIndex);
        });
      });

      if (slides.length > 1) {
        window.setInterval(function () {
          show(index + 1);
        }, 5200);
      }
    });

    var searchInput = document.querySelector("[data-catalog-search]");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card[data-title]"));
    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var emptyResult = document.querySelector("[data-empty-result]");

    if (searchInput && cards.length) {
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";
      if (initialQuery) {
        searchInput.value = initialQuery;
      }

      function applyCatalogFilters() {
        var query = normalize(searchInput.value);
        var activeFilters = {};

        filters.forEach(function (filter) {
          activeFilters[filter.getAttribute("data-filter")] = normalize(filter.value);
        });

        var visibleCount = 0;

        cards.forEach(function (card) {
          var text = normalize(card.getAttribute("data-title"));
          var matched = !query || text.indexOf(query) !== -1;

          Object.keys(activeFilters).forEach(function (key) {
            var value = activeFilters[key];
            if (!value) {
              return;
            }
            matched = matched && normalize(card.getAttribute("data-" + key)) === value;
          });

          card.hidden = !matched;
          if (matched) {
            visibleCount += 1;
          }
        });

        if (emptyResult) {
          emptyResult.hidden = visibleCount !== 0;
        }
      }

      searchInput.addEventListener("input", applyCatalogFilters);
      filters.forEach(function (filter) {
        filter.addEventListener("change", applyCatalogFilters);
      });
      applyCatalogFilters();
    }
  });
})();
