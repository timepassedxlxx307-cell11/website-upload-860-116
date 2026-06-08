(function () {
  function startPlayer(box) {
    var video = box.querySelector('video');
    var button = box.querySelector('[data-play-button]');
    var src = box.getAttribute('data-stream');
    if (!video || !src) {
      return;
    }

    function hideButton() {
      if (button) {
        button.classList.add('is-hidden');
      }
    }

    function play() {
      hideButton();
      if (!video.getAttribute('src')) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          box._hls = hls;
        } else {
          video.src = src;
        }
      }
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          if (button) {
            button.classList.remove('is-hidden');
          }
        });
      }
    }

    if (button) {
      button.addEventListener('click', play);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener('play', hideButton);
  }

  if (document.readyState !== 'loading') {
    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(startPlayer);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(startPlayer);
    });
  }
})();
