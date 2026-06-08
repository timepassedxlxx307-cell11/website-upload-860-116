import { H as Hls } from "./hls-vendor-dru42stk.js";

const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

ready(() => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-site-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("is-open"));
  }

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input[name='q']");
      const value = input ? input.value.trim() : "";
      const url = value ? `./search.html?q=${encodeURIComponent(value)}` : "./search.html";
      window.location.href = url;
    });
  });

  const hero = document.querySelector("[data-hero]");
  if (hero) {
    const images = Array.from(hero.querySelectorAll("[data-hero-image]"));
    const cards = Array.from(hero.querySelectorAll("[data-hero-target]"));
    let active = 0;
    const activate = (index) => {
      active = index % images.length;
      images.forEach((image, idx) => image.classList.toggle("is-active", idx === active));
      cards.forEach((card, idx) => card.classList.toggle("is-active", idx === active));
    };
    if (images.length) {
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => activate(Number(card.dataset.heroTarget || 0)));
      });
      activate(0);
      window.setInterval(() => activate(active + 1), 5200);
    }
  }

  const panel = document.querySelector("[data-filter-panel]");
  if (panel) {
    const keyword = panel.querySelector("[data-filter-keyword]");
    const type = panel.querySelector("[data-filter-type]");
    const year = panel.querySelector("[data-filter-year]");
    const cards = Array.from(document.querySelectorAll("[data-card]"));
    const empty = document.querySelector("[data-no-result]");
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || "";
    if (keyword && initial) {
      keyword.value = initial;
    }
    const filter = () => {
      const q = keyword ? keyword.value.trim().toLowerCase() : "";
      const t = type ? type.value : "";
      const y = year ? year.value : "";
      let visible = 0;
      cards.forEach((card) => {
        const haystack = `${card.dataset.title || ""} ${card.dataset.region || ""} ${card.dataset.type || ""} ${card.dataset.year || ""} ${card.dataset.genre || ""} ${card.dataset.tags || ""}`.toLowerCase();
        const okKeyword = !q || haystack.includes(q);
        const okType = !t || (card.dataset.type || "").includes(t);
        const okYear = !y || card.dataset.year === y;
        const ok = okKeyword && okType && okYear;
        card.hidden = !ok;
        if (ok) visible += 1;
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    };
    [keyword, type, year].forEach((element) => {
      if (element) {
        element.addEventListener("input", filter);
        element.addEventListener("change", filter);
      }
    });
    filter();
  }

  const video = document.querySelector("video[data-video]");
  if (video) {
    const source = video.dataset.video;
    const triggers = Array.from(document.querySelectorAll("[data-play-trigger]"));
    let loaded = false;
    let hls = null;
    const loadVideo = () => {
      if (loaded || !source) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    };
    const hideCover = () => triggers.forEach((trigger) => trigger.classList.add("is-hidden"));
    const playVideo = async () => {
      loadVideo();
      hideCover();
      try {
        await video.play();
      } catch (error) {
        triggers.forEach((trigger) => trigger.classList.remove("is-hidden"));
      }
    };
    triggers.forEach((trigger) => trigger.addEventListener("click", playVideo));
    video.addEventListener("play", hideCover);
    video.addEventListener("loadedmetadata", hideCover);
    window.addEventListener("pagehide", () => {
      if (hls) {
        hls.destroy();
      }
    });
  }
});
