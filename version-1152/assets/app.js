(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function initHeader() {
    var header = document.querySelector('[data-header]');
    var button = document.querySelector('[data-menu-button]');
    var nav = document.querySelector('[data-mobile-nav]');

    function updateHeader() {
      if (!header) {
        return;
      }
      header.classList.toggle('scrolled', window.scrollY > 8);
    }

    if (button && nav) {
      button.addEventListener('click', function () {
        nav.classList.toggle('open');
      });
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
      });
    });

    show(0);
    window.setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  function initFilters() {
    var input = document.querySelector('[data-search-input]');
    var yearFilter = document.querySelector('[data-filter-year]');
    var typeFilter = document.querySelector('[data-filter-type]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var empty = document.querySelector('[data-no-result]');

    if (!cards.length || (!input && !yearFilter && !typeFilter)) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    if (input && params.get('q')) {
      input.value = params.get('q');
    }
    if (yearFilter && params.get('year')) {
      yearFilter.value = params.get('year');
    }

    function matchCard(card) {
      var q = input ? input.value.trim().toLowerCase() : '';
      var year = yearFilter ? yearFilter.value : '';
      var type = typeFilter ? typeFilter.value : '';
      var haystack = [
        card.dataset.title,
        card.dataset.genre,
        card.dataset.year,
        card.dataset.region,
        card.dataset.type
      ].join(' ').toLowerCase();
      var byText = !q || haystack.indexOf(q) !== -1;
      var byYear = !year || card.dataset.year === year;
      var byType = !type || (card.dataset.type || '').indexOf(type) !== -1 || (card.dataset.genre || '').indexOf(type) !== -1;
      return byText && byYear && byType;
    }

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var ok = matchCard(card);
        card.classList.toggle('hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('show', visible === 0);
      }
    }

    [input, yearFilter, typeFilter].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('[data-player-button]');
      var source = box.getAttribute('data-source');
      var hlsInstance = null;

      if (!video || !source) {
        return;
      }

      function bindSource() {
        if (video.dataset.ready === '1') {
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }

        video.dataset.ready = '1';
      }

      function start() {
        bindSource();
        box.classList.add('is-playing');
        var playPromise = video.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function () {});
        }
      }

      if (button) {
        button.addEventListener('click', start);
      }

      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });

      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    initHeader();
    initHero();
    initFilters();
    initPlayers();
  });
})();
