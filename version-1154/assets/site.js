(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function schedule() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        schedule();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        schedule();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        schedule();
      });
    }

    show(0);
    schedule();
  }

  function normalize(text) {
    return String(text || '').toLowerCase().trim();
  }

  function setupSearchPanel(panel) {
    var section = panel.closest('section') || document;
    var grid = section.querySelector('[data-card-grid]');
    if (!grid) {
      return;
    }
    var input = panel.querySelector('[data-search-input]');
    var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-key]'));
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));
    var empty = section.querySelector('[data-empty-state]');
    var active = { key: 'type', value: 'all' };

    function matches(card, query) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-type'),
        card.getAttribute('data-region'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-keywords')
      ].join(' '));
      var filterMatch = active.value === 'all' || normalize(card.getAttribute('data-' + active.key)).indexOf(normalize(active.value)) !== -1;
      var queryMatch = !query || haystack.indexOf(query) !== -1;
      return filterMatch && queryMatch;
    }

    function apply() {
      var query = normalize(input ? input.value : '');
      var visible = 0;
      cards.forEach(function (card) {
        var ok = matches(card, query);
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    if (input) {
      input.addEventListener('input', apply);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (other) {
          other.classList.remove('is-active');
        });
        button.classList.add('is-active');
        active.key = button.getAttribute('data-filter-key') || 'type';
        active.value = button.getAttribute('data-filter-value') || 'all';
        apply();
      });
    });

    apply();
  }

  ready(function () {
    setupMenu();
    setupHero();
    Array.prototype.slice.call(document.querySelectorAll('[data-search-panel]')).forEach(setupSearchPanel);
  });
})();
