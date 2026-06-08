(function () {
  const bySelector = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setupMobileNavigation() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const menu = document.querySelector('[data-mobile-nav]');
    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('is-open', !expanded);
    });
  }

  function setupBackTop() {
    bySelector('[data-back-top]').forEach((button) => {
      button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function setupHeroCarousel() {
    const carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) {
      return;
    }

    const slides = bySelector('[data-hero-slide]', carousel);
    const dots = bySelector('[data-hero-dot]', carousel);
    const previous = carousel.querySelector('[data-hero-prev]');
    const next = carousel.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(() => show(current + 1), 5200);
    }

    if (previous) {
      previous.addEventListener('click', () => {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        show(current + 1);
        restart();
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        show(Number(dot.dataset.heroDot || 0));
        restart();
      });
    });

    restart();
  }

  function normalize(text) {
    return String(text || '').trim().toLowerCase();
  }

  function regionMatches(region, selected) {
    if (selected === 'all') {
      return true;
    }
    if (selected === '海外') {
      return !/(中国|国产|香港|台湾|内地)/.test(region);
    }
    return region.includes(selected);
  }

  function yearMatches(year, selected) {
    if (selected === 'all') {
      return true;
    }
    if (selected === 'older') {
      return Number(year) <= 2021;
    }
    return String(year) === selected;
  }

  function setupFilters() {
    bySelector('[data-filter-scope]').forEach((scope) => {
      const search = scope.querySelector('[data-filter-search]');
      const category = scope.querySelector('[data-filter-category]');
      const region = scope.querySelector('[data-filter-region]');
      const year = scope.querySelector('[data-filter-year]');
      const count = scope.querySelector('[data-filter-count]');
      const container = scope.parentElement || document;
      const cards = bySelector('.movie-card', container);

      function applyFilters() {
        const query = normalize(search ? search.value : '');
        const categoryValue = category ? category.value : 'all';
        const regionValue = region ? region.value : 'all';
        const yearValue = year ? year.value : 'all';
        let visible = 0;

        cards.forEach((card) => {
          const haystack = normalize([
            card.dataset.title,
            card.dataset.tags,
            card.textContent,
          ].join(' '));
          const cardRegion = card.dataset.region || '';
          const cardYear = card.dataset.year || '';
          const cardCategory = card.dataset.category || '';

          const matched = (!query || haystack.includes(query)) &&
            (categoryValue === 'all' || cardCategory === categoryValue) &&
            regionMatches(cardRegion, regionValue) &&
            yearMatches(cardYear, yearValue);

          card.classList.toggle('is-hidden', !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = String(visible);
        }
      }

      [search, category, region, year].forEach((control) => {
        if (control) {
          control.addEventListener('input', applyFilters);
          control.addEventListener('change', applyFilters);
        }
      });

      applyFilters();
    });
  }

  function setupImageFallbacks() {
    bySelector('img').forEach((image) => {
      image.addEventListener('error', () => {
        const visual = image.closest('.poster-wrap, .hero-slide, .detail-poster, .detail-backdrop');
        if (visual) {
          visual.classList.add('image-missing');
        }
      }, { once: true });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupMobileNavigation();
    setupBackTop();
    setupHeroCarousel();
    setupFilters();
    setupImageFallbacks();
  });
})();
