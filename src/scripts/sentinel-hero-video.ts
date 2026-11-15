// Keep the static image (and avoid a video request) until motion is permitted.
// Native muted autoplay handles playback; no retries or forced play() calls.
const template = document.querySelector<HTMLTemplateElement>('[data-sentinel-hero-template]');
if (template) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let video: HTMLVideoElement | undefined;
  const sync = () => {
    if (motion.matches) {
      video?.pause();
      video?.remove();
      video = undefined;
      return;
    }
    if (video) return;
    video = template.content.querySelector('video')!.cloneNode(true) as HTMLVideoElement;
    video.muted = true;
    const current = video;
    current.addEventListener('playing', () => current.classList.add('is-playing'));
    current.addEventListener('error', () => current.classList.remove('is-playing'));
    template.after(current);
  };
  sync();
  motion.addEventListener('change', sync);
}
