import { H as Hls } from './hls-vendor-dru42stk.js';

function setStatus(shell, message) {
  const status = shell.querySelector('[data-video-status]');
  if (status) {
    status.textContent = message;
  }
}

async function playVideo(shell) {
  const video = shell.querySelector('video');
  const source = shell.dataset.videoSrc;

  if (!video || !source) {
    setStatus(shell, '播放源缺失');
    return;
  }

  setStatus(shell, '正在加载播放源...');

  try {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      shell._hlsInstance = hls;
    } else {
      video.src = source;
    }

    video.controls = true;
    shell.classList.add('is-playing');
    await video.play();
    setStatus(shell, '正在播放');
  } catch (error) {
    shell.classList.remove('is-playing');
    setStatus(shell, '播放初始化失败，请刷新或更换浏览器');
    console.error('Video playback failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-video-player]').forEach((shell) => {
    const button = shell.querySelector('[data-video-play]');
    const video = shell.querySelector('video');

    if (button) {
      button.addEventListener('click', () => playVideo(shell));
    }

    if (video) {
      video.addEventListener('pause', () => setStatus(shell, '已暂停'));
      video.addEventListener('playing', () => setStatus(shell, '正在播放'));
      video.addEventListener('error', () => setStatus(shell, '视频加载异常'));
    }
  });
});
