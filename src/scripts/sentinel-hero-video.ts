// The video is server-rendered for both languages. No image fallback or DOM injection.
const video = document.querySelector<HTMLVideoElement>('[data-sentinel-hero-video]');
const controls = document.querySelector<HTMLElement>('[data-sentinel-video-controls]');
if (video && controls) {
  const button = controls.querySelector<HTMLButtonElement>('[data-sentinel-video-play]');
  const error = controls.querySelector<HTMLElement>('[data-sentinel-video-error]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let manual = false;
  let failed = false;

  const showButton = () => { if (button && !failed) button.hidden = false; };
  const showError = () => {
    failed = true;
    if (button) button.hidden = true;
    if (error) error.hidden = false;
  };
  const syncPreference = () => {
    if (motion.matches && !manual) {
      video.autoplay = false;
      video.pause();
      showButton();
    } else if (!manual && !failed) {
      video.autoplay = true;
      void video.play().catch(showButton);
    }
  };

  // Explicitly set the property as well as the HTML muted attribute for iOS.
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.addEventListener('playing', () => {
    if (button) button.hidden = true;
    if (error) error.hidden = true;
  });
  video.addEventListener('error', showError);
  video.querySelector('source')?.addEventListener('error', showError);
  video.addEventListener('stalled', () => {
    if (video.error) showError();
  });
  button?.addEventListener('click', () => {
    // This call executes synchronously inside a genuine user activation.
    manual = true;
    video.classList.add('user-activated');
    video.muted = true;
    const attempt = video.play();
    void attempt.then(() => {
      if (button) button.hidden = true;
    }).catch(() => {
      video.classList.remove('user-activated');
      showButton();
    });
  });
  motion.addEventListener('change', () => {
    if (!motion.matches) manual = false;
    if (!motion.matches) video.classList.remove('user-activated');
    syncPreference();
  });
  syncPreference();
}
export {};
