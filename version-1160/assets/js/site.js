(function () {
  'use strict';

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMobileMenu() {
    var header = qs('.site-header');
    var button = qs('[data-mobile-menu]');
    if (!header || !button) {
      return;
    }

    button.addEventListener('click', function () {
      header.classList.toggle('is-open');
    });
  }

  function initHeroSlider() {
    var hero = qs('[data-hero-slider]');
    if (!hero) {
      return;
    }

    var slides = qsa('.hero-slide', hero);
    var dots = qsa('.hero-dot', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      if (timer || slides.length < 2) {
        return;
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        stop();
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initCardFilters() {
    qsa('[data-filter-panel]').forEach(function (panel) {
      var scopeSelector = panel.getAttribute('data-filter-panel');
      var scope = qs(scopeSelector) || document;
      var cards = qsa('[data-movie-card]', scope);
      var empty = qs('[data-empty-state]', scope.parentNode || document);
      var keywordInput = qs('[data-filter-keyword]', panel);
      var yearSelect = qs('[data-filter-year]', panel);
      var regionSelect = qs('[data-filter-region]', panel);
      var typeSelect = qs('[data-filter-type]', panel);

      function apply() {
        var keyword = normalize(keywordInput && keywordInput.value);
        var year = yearSelect && yearSelect.value;
        var region = regionSelect && regionSelect.value;
        var type = typeSelect && typeSelect.value;
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute('data-search'));
          var matched = true;
          if (keyword && haystack.indexOf(keyword) === -1) {
            matched = false;
          }
          if (year && card.getAttribute('data-year') !== year) {
            matched = false;
          }
          if (region && card.getAttribute('data-region') !== region) {
            matched = false;
          }
          if (type && card.getAttribute('data-type') !== type) {
            matched = false;
          }
          card.style.display = matched ? '' : 'none';
          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.style.display = visible ? 'none' : 'block';
        }
      }

      [keywordInput, yearSelect, regionSelect, typeSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });

      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      if (q && keywordInput) {
        keywordInput.value = q;
      }
      apply();
    });
  }

  function initVideoPlayers() {
    qsa('[data-player]').forEach(function (wrap) {
      var video = qs('video', wrap);
      var src = video && video.getAttribute('data-hls-src');
      var playButton = qs('[data-play-toggle]', wrap);
      var muteButton = qs('[data-mute-toggle]', wrap);
      var fullscreenButton = qs('[data-fullscreen-toggle]', wrap);
      var errorBox = qs('[data-player-error]', wrap);
      var hls = null;

      if (!video || !src) {
        return;
      }

      function setError(message) {
        wrap.classList.remove('is-loading');
        wrap.classList.add('has-error');
        if (errorBox) {
          errorBox.textContent = message;
        }
      }

      function attachSource() {
        wrap.classList.add('is-loading');
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            wrap.classList.remove('is-loading');
          });
          hls.on(window.Hls.Events.ERROR, function (_, data) {
            if (!data || !data.fatal) {
              return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              setError('网络错误，请检查网络连接后重新播放。');
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              setError('媒体错误，正在尝试恢复播放。');
              hls.recoverMediaError();
            } else {
              setError('无法播放当前视频源。');
              hls.destroy();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', function () {
            wrap.classList.remove('is-loading');
          }, { once: true });
        } else {
          setError('当前浏览器不支持 HLS 播放，请使用最新版浏览器访问。');
        }
      }

      function togglePlay() {
        if (!video.src && !hls) {
          attachSource();
        }
        if (video.paused) {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              setError('浏览器阻止了自动播放，请再次点击播放按钮。');
            });
          }
        } else {
          video.pause();
        }
      }

      if (playButton) {
        playButton.addEventListener('click', togglePlay);
      }
      video.addEventListener('click', togglePlay);

      if (muteButton) {
        muteButton.addEventListener('click', function () {
          video.muted = !video.muted;
          muteButton.setAttribute('aria-pressed', video.muted ? 'true' : 'false');
        });
      }

      if (fullscreenButton) {
        fullscreenButton.addEventListener('click', function () {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (wrap.requestFullscreen) {
            wrap.requestFullscreen();
          }
        });
      }

      video.addEventListener('play', function () {
        wrap.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        wrap.classList.remove('is-playing');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHeroSlider();
    initCardFilters();
    initVideoPlayers();
  });
})();
