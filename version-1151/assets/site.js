(function () {
    "use strict";

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initMobileNav() {
        var button = document.querySelector("[data-mobile-menu-button]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!button || !nav) {
            return;
        }
        button.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function initHeroCarousel() {
        var carousel = document.querySelector("[data-hero-carousel]");
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
        var previous = carousel.querySelector("[data-hero-prev]");
        var next = carousel.querySelector("[data-hero-next]");
        if (slides.length < 2) {
            return;
        }
        var index = 0;
        var isPaused = false;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        if (previous) {
            previous.addEventListener("click", function () {
                show(index - 1);
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
            });
        });
        carousel.addEventListener("mouseenter", function () {
            isPaused = true;
        });
        carousel.addEventListener("mouseleave", function () {
            isPaused = false;
        });
        window.setInterval(function () {
            if (!isPaused) {
                show(index + 1);
            }
        }, 5600);
    }

    function initSearch() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-search-panel]"));
        if (!panels.length) {
            return;
        }
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var emptyState = document.querySelector("[data-empty-state]");
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";

        panels.forEach(function (panel) {
            var input = panel.querySelector("[data-search-input]");
            var categoryFilter = panel.querySelector("[data-category-filter]");
            if (input && query) {
                input.value = query;
            }

            function applyFilter() {
                var text = input ? input.value.trim().toLowerCase() : "";
                var category = categoryFilter ? categoryFilter.value : "";
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = (card.getAttribute("data-search") || "").toLowerCase();
                    var cardCategory = card.getAttribute("data-category") || "";
                    var matchesText = !text || haystack.indexOf(text) !== -1;
                    var matchesCategory = !category || cardCategory === category;
                    var matches = matchesText && matchesCategory;
                    card.hidden = !matches;
                    if (matches) {
                        visible += 1;
                    }
                });
                if (emptyState) {
                    emptyState.classList.toggle("is-visible", visible === 0);
                }
            }

            if (input) {
                input.addEventListener("input", applyFilter);
            }
            if (categoryFilter) {
                categoryFilter.addEventListener("change", applyFilter);
            }
            applyFilter();
        });
    }

    function initPlayer() {
        var configElement = document.getElementById("movie-player-config");
        var video = document.querySelector("[data-player-video]");
        var overlay = document.querySelector("[data-player-overlay]");
        if (!configElement || !video || !overlay) {
            return;
        }
        var config = {};
        try {
            config = JSON.parse(configElement.textContent || "{}");
        } catch (error) {
            config = {};
        }
        var player = null;
        var attached = false;

        function attach() {
            if (attached || !config.source) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = config.source;
            } else if (window.Hls && window.Hls.isSupported()) {
                player = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                player.loadSource(config.source);
                player.attachMedia(video);
            } else {
                video.src = config.source;
            }
        }

        function play() {
            attach();
            overlay.classList.add("is-hidden");
            video.setAttribute("controls", "controls");
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    overlay.classList.remove("is-hidden");
                });
            }
        }

        overlay.addEventListener("click", play);
        video.addEventListener("click", function () {
            if (!attached || video.paused) {
                play();
            }
        });
        video.addEventListener("play", function () {
            overlay.classList.add("is-hidden");
        });
        window.addEventListener("pagehide", function () {
            if (player && typeof player.destroy === "function") {
                player.destroy();
            }
        });
    }

    ready(function () {
        initMobileNav();
        initHeroCarousel();
        initSearch();
        initPlayer();
    });
})();
