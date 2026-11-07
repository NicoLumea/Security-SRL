// Sentinel-only progressive enhancement. The HTML/CSS remain visible until both
// observers are ready; nothing in the hero, navigation or form fields is hidden.
const body = document.body;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const resetDistance = 160;
let dispose = () => {};

function initialize() {
  dispose();
  if (!body.classList.contains('sentinel')) return;
  const elements = [...body.querySelectorAll<HTMLElement>('[data-reveal]')];
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  let entrance: IntersectionObserver | undefined;
  let perimeter: IntersectionObserver | undefined;
  let active = true;

  const clearTimer = (element: HTMLElement) => {
    clearTimeout(timers.get(element));
    timers.delete(element);
  };
  const visible = (element: HTMLElement) => {
    clearTimer(element);
    element.dataset.revealState = 'visible';
  };
  const focus = () => {
    for (const element of elements) {
      if (element.contains(document.activeElement)) visible(element);
    }
  };
  const fragment = () => {
    try {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) elements.filter((element) => element.contains(target)).forEach(visible);
    } catch {
      // An invalid URL fragment must not interfere with navigation or content.
    }
  };
  const cleanup = () => {
    active = false;
    entrance?.disconnect();
    perimeter?.disconnect();
    timers.forEach(clearTimeout);
    timers.clear();
    elements.forEach((element) => {
      delete element.dataset.revealState;
      element.style.removeProperty('--reveal-delay');
      element.style.removeProperty('--reveal-duration');
    });
    body.removeEventListener('focusin', focus);
    window.removeEventListener('hashchange', fragment);
    delete body.dataset.reveals;
  };
  dispose = cleanup;

  if (motion.matches || !('IntersectionObserver' in window)) {
    body.dataset.reveals = motion.matches ? 'reduced' : 'unavailable';
    return;
  }

  try {
    entrance = new IntersectionObserver(
      (entries) => {
        if (!active) return;
        try {
          // Stagger only siblings entering in this observer batch. A new mobile
          // row or an upward revisit never waits behind already-visible cards.
          const groups = new Map<Element, number>();
          for (const entry of entries) {
            const element = entry.target as HTMLElement;
            if (!entry.isIntersecting || element.dataset.revealState !== 'hidden') continue;
            if (element.contains(document.activeElement)) {
              visible(element);
              continue;
            }
            const group = element.closest('[data-reveal-group]');
            const order = group ? (groups.get(group) ?? 0) : 0;
            if (group) groups.set(group, order + 1);
            const delay = Math.min(
              300,
              Math.max(0, Number(element.dataset.revealDelay) || order * 100),
            );
            const duration = Math.min(
              950,
              Math.max(650, Number(element.dataset.revealDuration) || 800),
            );
            element.style.setProperty('--reveal-delay', `${delay}ms`);
            element.style.setProperty('--reveal-duration', `${duration}ms`);
            element.dataset.revealState = 'entering';
            clearTimer(element);
            // Release animation styling after settling, including when a browser
            // does not deliver transitionend (background tabs, interrupted scroll).
            timers.set(
              element,
              setTimeout(() => visible(element), duration + delay + 50),
            );
          }
        } catch {
          cleanup();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -24px 0px' },
    );

    // A separate expanded perimeter creates a quiet zone around the viewport.
    // Partially visible sections never reset when the entrance threshold changes.
    perimeter = new IntersectionObserver(
      (entries) => {
        if (!active) return;
        try {
          for (const entry of entries) {
            const element = entry.target as HTMLElement;
            if (entry.isIntersecting || element.contains(document.activeElement)) continue;
            const rect = entry.boundingClientRect;
            if (
              rect.height > 0 &&
              (rect.bottom < -resetDistance || rect.top > window.innerHeight + resetDistance)
            ) {
              clearTimer(element);
              element.dataset.revealState = 'hidden';
            }
          }
        } catch {
          cleanup();
        }
      },
      { threshold: 0, rootMargin: `${resetDistance}px 0px ${resetDistance}px 0px` },
    );

    for (const element of elements) {
      entrance.observe(element);
      perimeter.observe(element);
      const rect = element.getBoundingClientRect();
      element.dataset.revealState =
        rect.height > 0 && rect.top >= window.innerHeight ? 'hidden' : 'visible';
    }
    body.addEventListener('focusin', focus);
    window.addEventListener('hashchange', fragment);
    focus();
    fragment();
    body.dataset.reveals = 'ready';
  } catch {
    cleanup();
  }
}

initialize();
motion.addEventListener('change', initialize);
window.addEventListener('pagehide', () => dispose());
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initialize();
});
