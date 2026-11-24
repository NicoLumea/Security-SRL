// Vanguard-specific cinematic motion. All content is visible without JavaScript.
const menu = document.querySelector<HTMLDetailsElement>('.v-mobile-menu');
menu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => { menu.open = false; });
});
menu?.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});

const root = document.querySelector<HTMLElement>('.vanguard-page');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (root) {
  type MotionKind = 'heading' | 'copy' | 'service' | 'project' | 'about-title' | 'about-copy' | 'process' | 'contact-title';
  type MotionTarget = { element: HTMLElement; kind: MotionKind; sequence: number; };
  const targets: MotionTarget[] = [];
  const headingGroups = root.querySelectorAll<HTMLElement>('[data-v-group]');
  headingGroups.forEach(group => {
    [group.querySelector<HTMLElement>('.v-kicker'), group.querySelector<HTMLElement>('h2'), group.querySelector<HTMLElement>('p')]
      .forEach((element, sequence) => {
        if (element) targets.push({ element, kind: sequence === 2 ? 'copy' : 'heading', sequence });
      });
  });
  root.querySelectorAll<HTMLElement>('[data-v-motion]').forEach(element => {
    const kind = element.dataset.vMotion as MotionKind;
    let sequence = 0;
    if (kind === 'service') {
      sequence = [...(element.parentElement?.children ?? [])].indexOf(element) % 4;
    } else if (kind === 'project' || kind === 'process') {
      sequence = [...(element.parentElement?.children ?? [])].indexOf(element);
    }
    targets.push({ element, kind, sequence });
  });
  const hero = root.querySelector<HTMLElement>('.v-hero');
  const heroCopy = root.querySelector<HTMLElement>('.v-hero-copy');
  const heroImage = root.querySelector<HTMLElement>('.v-hero-media img');
  const heroArrow = root.querySelector<HTMLElement>('.v-media-arrow');
  const projectImages = [...root.querySelectorAll<HTMLElement>('.v-project-image img')];
  const heroParts = ['title', 'intro', 'actions', 'media', 'arrow']
    .map(name => root.querySelector<HTMLElement>(`[data-v-hero="${name}"]`))
    .filter((element): element is HTMLElement => Boolean(element));
  const introAnimations = new Set<Animation>();
  let raf = 0;
  let stopped = false;
  let lastScroll = -1;
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const small = matchMedia('(max-width: 760px)');
  const interactive = (element: HTMLElement) =>
    element.contains(document.activeElement) && document.activeElement !== document.body;

  function clearStyle(element: HTMLElement) {
    element.style.removeProperty('--v-motion-x');
    element.style.removeProperty('--v-motion-y');
    element.style.removeProperty('--v-motion-opacity');
  }
  function clearAll() {
    introAnimations.forEach(animation => animation.cancel());
    introAnimations.clear();
    targets.forEach(({ element }) => clearStyle(element));
    if (heroCopy) clearStyle(heroCopy);
    if (heroImage) clearStyle(heroImage);
    if (heroArrow) clearStyle(heroArrow);
    projectImages.forEach(image => image.style.removeProperty('--v-parallax-y'));
    root.removeAttribute('data-v-motion-active');
  }

  // A short staged first impression, separate from reversible scroll progress.
  function startHero() {
    if (reduced.matches || !('animate' in document.documentElement)) return;
    const distances = [60, 35, 25, small.matches ? 40 : 80, 30];
    const offsets = [0, 120, 230, 140, 460];
    heroParts.forEach((element, index) => {
      const offset = distances[index];
      const from = index === 3 ? `translate3d(${offset}px, 0, 0)` : `translate3d(0, ${offset}px, 0)`;
      const animation = element.animate(
        [{ opacity: 0.12, transform: from }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
        { duration: index === 3 ? 900 : 680, delay: offsets[index], easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' },
      );
      introAnimations.add(animation);
      animation.finished.then(() => introAnimations.delete(animation)).catch(() => introAnimations.delete(animation));
    });
  }

  function render() {
    raf = 0;
    if (stopped || reduced.matches) return;
    const height = Math.max(1, window.innerHeight);
    const mobile = small.matches;
    root.setAttribute('data-v-motion-active', '');
    targets.forEach(({ element, kind, sequence }) => {
      // Native focus/typing wins over decorative motion.
      if (interactive(element)) {
        clearStyle(element);
        return;
      }
      const rect = element.getBoundingClientRect();
      // Account for our own transform so scroll progress never feeds back on itself.
      const currentTransform = getComputedStyle(element).transform;
      const ownY = currentTransform === 'none' ? 0 : new DOMMatrixReadOnly(currentTransform).m42;
      const naturalTop = rect.top - ownY;
      const naturalBottom = rect.bottom - ownY;
      // Skip unrelated distant targets without making them permanently invisible.
      const entryStart = height * (mobile ? 0.96 : 0.93) - sequence * (mobile ? 17 : 25);
      const entryEnd = height * (mobile ? 0.69 : 0.64) - sequence * (mobile ? 8 : 14);
      const progress = clamp((entryStart - naturalTop) / Math.max(1, entryStart - entryEnd));
      const ease = 1 - Math.pow(1 - progress, 3);
      const exiting = clamp((height * 0.13 - naturalBottom) / (height * 0.35));
      let distance = mobile ? 36 : 76;
      let x = 0;
      if (kind === 'project') {
        distance = mobile ? 38 : 86;
        x = (sequence % 2 ? -1 : 1) * distance * (1 - ease);
      } else if (kind === 'about-title') {
        x = -(mobile ? 32 : 70) * (1 - ease);
      } else if (kind === 'about-copy') {
        x = (mobile ? 24 : 58) * (1 - ease);
      } else if (kind === 'service' || kind === 'process') {
        distance = mobile ? 35 : 57;
      } else if (kind === 'copy') {
        distance = mobile ? 22 : 44;
      } else if (kind === 'contact-title') {
        distance = mobile ? 28 : 54;
      }
      const y = (kind === 'project' || kind === 'about-title' || kind === 'about-copy' ? 13 : distance) * (1 - ease) - exiting * (mobile ? 9 : 18);
      const opacity = clamp((0.3 + 0.7 * ease) * (1 - exiting * 0.18));
      element.style.setProperty('--v-motion-x', `${x.toFixed(2)}px`);
      element.style.setProperty('--v-motion-y', `${y.toFixed(2)}px`);
      element.style.setProperty('--v-motion-opacity', opacity.toFixed(3));
    });
    projectImages.forEach((image, index) => {
      const rect = image.getBoundingClientRect();
      const progress = clamp((height - rect.top) / Math.max(1, height + rect.height));
      const distance = mobile ? 8 : 24;
      image.style.setProperty('--v-parallax-y', `${((index % 2 ? -1 : 1) * (progress - .5) * distance).toFixed(2)}px`);
    });
    if (hero && heroCopy && heroImage) {
      const rect = hero.getBoundingClientRect();
      const travel = clamp(-rect.top / Math.max(1, rect.height));
      // Parallax is gentle, independent of the initial entrance sequence.
      heroCopy.style.setProperty('--v-motion-y', `${(-25 * travel).toFixed(2)}px`);
      heroImage.style.setProperty('--v-motion-y', `${(mobile ? -12 : -31) * travel}px`);
      if (heroArrow) heroArrow.style.setProperty('--v-motion-y', `${(mobile ? -10 : -22) * travel}px`);
    }
    lastScroll = window.scrollY;
  }
  function schedule() {
    if (reduced.matches || stopped || raf) return;
    raf = requestAnimationFrame(render);
  }
  function syncMotion() {
    if (reduced.matches) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clearAll();
    } else {
      schedule();
    }
  }
  reduced.addEventListener('change', syncMotion);
  small.addEventListener('change', schedule);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  root.addEventListener('focusin', schedule);
  root.addEventListener('focusout', schedule);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.scrollY !== lastScroll) schedule();
  });
  window.addEventListener('pageshow', schedule);
  window.addEventListener('pagehide', () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    clearAll();
  });
  if (!reduced.matches) {
    startHero();
    schedule();
  }
}
export {};
