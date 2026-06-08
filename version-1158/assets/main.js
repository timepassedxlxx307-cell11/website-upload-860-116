(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function bindMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) return;
    button.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function bindHero() {
    var carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) return;
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var prev = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var index = Math.max(0, slides.findIndex(function (slide) { return slide.classList.contains('active'); }));

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });
    if (prev) prev.addEventListener('click', function () { show(index - 1); });
    if (next) next.addEventListener('click', function () { show(index + 1); });
    setInterval(function () { show(index + 1); }, 5200);
  }

  function bindFilters() {
    var containers = document.querySelectorAll('[data-filter-container]');
    containers.forEach(function (container) {
      var section = container.closest('.content-section') || document;
      var search = section.querySelector('[data-page-search]');
      var chips = Array.prototype.slice.call(section.querySelectorAll('[data-filter]'));
      var cards = Array.prototype.slice.call(container.querySelectorAll('.movie-card'));
      var activeFilter = 'all';

      function apply() {
        var query = normalize(search ? search.value : '');
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-tags')
          ].join(' '));
          var typeText = normalize(card.getAttribute('data-type') + ' ' + card.getAttribute('data-tags'));
          var matchQuery = !query || haystack.indexOf(query) !== -1;
          var matchFilter = activeFilter === 'all' || typeText.indexOf(normalize(activeFilter)) !== -1;
          card.style.display = matchQuery && matchFilter ? '' : 'none';
        });
      }

      if (search) search.addEventListener('input', apply);
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          activeFilter = chip.getAttribute('data-filter') || 'all';
          chips.forEach(function (item) { item.classList.toggle('active', item === chip); });
          apply();
        });
      });
    });
  }

  function movieCard(movie) {
    var tags = [movie.region, movie.type, movie.year, movie.category].filter(Boolean).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '<article class="movie-card">' +
      '<a class="poster-link" href="' + encodeURI(movie.url) + '">' +
      '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
      '<span class="poster-badge">' + escapeHtml(movie.year || movie.type) + '</span>' +
      '<span class="poster-play">▶</span>' +
      '</a>' +
      '<div class="movie-card-body">' +
      '<h2><a href="' + encodeURI(movie.url) + '">' + escapeHtml(movie.title) + '</a></h2>' +
      '<p>' + escapeHtml(movie.oneLine || '') + '</p>' +
      '<div class="movie-tags">' + tags + '</div>' +
      '</div>' +
      '</article>';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function renderSearch() {
    var target = document.getElementById('searchResults');
    if (!target || !window.SEARCH_MOVIES) return;
    var params = new URLSearchParams(window.location.search);
    var query = normalize(params.get('q'));
    var input = document.getElementById('searchPageInput');
    var intro = document.getElementById('searchIntro');
    if (input) input.value = params.get('q') || '';
    var list = window.SEARCH_MOVIES;
    var matches = query ? list.filter(function (movie) {
      var haystack = normalize([
        movie.title,
        movie.oneLine,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.category,
        (movie.tags || []).join(' ')
      ].join(' '));
      return haystack.indexOf(query) !== -1;
    }) : list.slice(0, 60);
    if (intro) {
      intro.textContent = query ? '关键词“' + (params.get('q') || '') + '”的相关影片' : '输入片名、地区、类型或题材，查找想看的影片。';
    }
    target.innerHTML = matches.length ? matches.slice(0, 120).map(movieCard).join('') : '<div class="empty-state">没有找到相关影片，换一个关键词试试。</div>';
  }

  window.initMoviePlayer = function (videoId, buttonId, layerId, streamUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var layer = document.getElementById(layerId);
    if (!video || !streamUrl) return;
    var loaded = false;
    var hls;

    function load(callback) {
      if (loaded) {
        if (callback) callback();
        return;
      }
      loaded = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', function () {
          if (callback) callback();
        }, { once: true });
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          if (callback) callback();
        });
      } else {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', function () {
          if (callback) callback();
        }, { once: true });
      }
    }

    function play() {
      if (layer) layer.classList.add('is-hidden');
      load(function () {
        var result = video.play();
        if (result && result.catch) result.catch(function () {});
      });
      var immediate = video.play();
      if (immediate && immediate.catch) immediate.catch(function () {});
    }

    if (button) button.addEventListener('click', play);
    if (layer) layer.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) play();
    });
    window.addEventListener('beforeunload', function () {
      if (hls && hls.destroy) hls.destroy();
    });
  };

  ready(function () {
    bindMenu();
    bindHero();
    bindFilters();
    renderSearch();
  });
})();
