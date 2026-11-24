// Precision: progressive enhancement. The original service content remains visible without JS.
const menu = document.querySelector<HTMLDetailsElement>('.p-mobile-menu');
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
menu?.addEventListener('keydown', event => {
  if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary')?.focus(); }
});
const form = document.querySelector<HTMLFormElement>('.p-form');
form?.querySelector<HTMLButtonElement>('[data-demo-submit]')?.addEventListener('click', () => {
  const feedback = form.querySelector<HTMLElement>('.form-feedback');
  if (!feedback) return;
  const valid = form.reportValidity();
  feedback.textContent = valid ? (form.dataset.success ?? '') : (form.dataset.error ?? '');
  feedback.dataset.state = valid ? 'success' : 'error';
  feedback.focus();
});

const carousel = document.querySelector<HTMLElement>('[data-p-carousel]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (carousel) {
  const cards = [...carousel.querySelectorAll<HTMLElement>('[data-p-card]')];
  const toggler = carousel.querySelector<HTMLButtonElement>('[data-p-toggle]');
  const previous = carousel.querySelector<HTMLButtonElement>('[data-p-prev]');
  const next = carousel.querySelector<HTMLButtonElement>('[data-p-next]');
  const detail = carousel.querySelector<HTMLElement>('[data-p-detail]');
  const title = carousel.querySelector<HTMLElement>('[data-p-title]');
  const summary = carousel.querySelector<HTMLElement>('[data-p-summary]');
  const description = carousel.querySelector<HTMLElement>('[data-p-description]');
  const counter = carousel.querySelector<HTMLElement>('[data-p-counter]');
  const status = carousel.querySelector<HTMLElement>('[data-p-status]');
  const buttons = cards.map(card => card.querySelector<HTMLButtonElement>('[data-p-select]'));
  if (cards.length && detail && title && summary && description && counter && toggler && status) {
    // Resolve DOM nodes once. Display values always originate in the rendered Astro content.
    const panel = detail;
    const heading = title;
    const summaryNode = summary;
    const descriptionNode = description;
    const numberNode = counter;
    const toggleButton = toggler;
    const statusNode = status;
    const prefersReduced = reduced;
    const pauseText = document.documentElement.lang === 'ro' ? 'Pauză' : 'Pause';
    const playText = document.documentElement.lang === 'ro' ? 'Redă' : 'Play';
    const pauseLabel = document.documentElement.lang === 'ro' ? 'Pauză rotație' : 'Pause rotation';
    const playLabel = document.documentElement.lang === 'ro' ? 'Reia rotația' : 'Resume rotation';
    let active = 0;
    let running = !prefersReduced.matches;
    let manualPause = false;
    let hovering = false;
    let focused = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let unteleportFrame = 0;
    let previously = cards.map(() => '');
    let destroyed = false;
    const period = Number(carousel.dataset.duration) || 5000;

    function stopTimer() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    }
    function shouldRotate() {
      return running && !manualPause && !prefersReduced.matches &&
        !hovering && !focused && !document.hidden && !destroyed;
    }
    function updateToggle() {
      const isPlaying = running && !manualPause && !prefersReduced.matches;
      toggleButton.setAttribute('aria-pressed', String(isPlaying));
      toggleButton.setAttribute('aria-label', isPlaying ? pauseLabel : playLabel);
      toggleButton.textContent = isPlaying ? pauseText + ' Ⅱ' : playText + ' ▶';
      toggleButton.disabled = prefersReduced.matches;
    }
    function schedule() {
      stopTimer();
      if (!shouldRotate()) return;
      timer = setTimeout(() => select((active + 1) % cards.length, false), period);
    }
    function slotFor(index: number) {
      const offset = (index - active + cards.length) % cards.length;
      return ['center','left','far','right'][offset] || 'far';
    }
    function layout() {
      if (unteleportFrame) cancelAnimationFrame(unteleportFrame);
      cards.forEach((card, index) => {
        const slot = slotFor(index);
        const old = previously[index];
        // The fourth item is outside the viewport; teleport it invisibly,
        // rather than dragging it across the display at the loop boundary.
        if ((old === 'far' && slot === 'right') ||
            (old === 'right' && slot === 'far') ||
            (old === 'left' && slot === 'far')) card.classList.add('is-teleport');
        else card.classList.remove('is-teleport');
        card.dataset.slot = slot;
        const button = buttons[index];
        button?.setAttribute('aria-pressed', String(index === active));
        if (button) button.tabIndex = slot === 'far' ? -1 : 0;
        previously[index] = slot;
      });
      unteleportFrame = requestAnimationFrame(() => {
        unteleportFrame = requestAnimationFrame(() => {
          cards.forEach(card => card.classList.remove('is-teleport'));
        });
      });
    }
    function showContent(index: number) {
      const item = cards[index];
      heading.textContent = item.dataset.title || '';
      summaryNode.textContent = item.dataset.summary || '';
      descriptionNode.textContent = item.dataset.detail || '';
      numberNode.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
    }
    function select(index: number, user: boolean) {
      if (destroyed || index < 0 || index >= cards.length) return;
      if (user) {
        manualPause = true;
        running = false;
        statusNode.textContent = cards[index].dataset.title || '';
      } else {
        // Automatic changes must not produce recurring live announcements.
        statusNode.textContent = '';
      }
      if (revealTimer !== undefined) clearTimeout(revealTimer);
      if (active !== index) {
        active = index;
        layout();
        if (prefersReduced.matches) {
          showContent(index);
          panel.classList.remove('is-changing');
        } else {
          panel.classList.add('is-changing');
          revealTimer = setTimeout(() => {
            showContent(active);
            panel.classList.remove('is-changing');
          }, 340);
        }
      }
      updateToggle();
      schedule();
    }
    cards.forEach((card, index) => {
      buttons[index]?.addEventListener('click', () => select(index, true));
      buttons[index]?.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const move = event.key === 'ArrowLeft' ? -1 : 1;
        const chosen = (index + move + cards.length) % cards.length;
        select(chosen, true);
        buttons[chosen]?.focus();
      });
    });
    previous?.addEventListener('click', () => select((active - 1 + cards.length) % cards.length, true));
    next?.addEventListener('click', () => select((active + 1) % cards.length, true));
    toggleButton.addEventListener('click', () => {
      if (prefersReduced.matches) return;
      if (manualPause || !running) {
        manualPause = false;
        running = true;
      } else {
        manualPause = true;
        running = false;
      }
      updateToggle();
      schedule();
    });
    carousel.addEventListener('pointerenter', () => { hovering = true; stopTimer(); });
    carousel.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    carousel.addEventListener('focusin', () => { focused = true; stopTimer(); });
    carousel.addEventListener('focusout', event => {
      if (event.relatedTarget instanceof Node && carousel.contains(event.relatedTarget)) return;
      focused = false;
      schedule();
    });
    const onVisibility = () => { if (document.hidden) stopTimer(); else schedule(); };
    document.addEventListener('visibilitychange', onVisibility);
    prefersReduced.addEventListener('change', () => {
      if (prefersReduced.matches) {
        running = false;
        stopTimer();
        if (revealTimer !== undefined) clearTimeout(revealTimer);
        panel.classList.remove('is-changing');
        showContent(active);
      }
      updateToggle();
      schedule();
    });
    window.addEventListener('pagehide', () => {
      destroyed = true;
      stopTimer();
      if (revealTimer !== undefined) clearTimeout(revealTimer);
      if (unteleportFrame) cancelAnimationFrame(unteleportFrame);
      document.removeEventListener('visibilitychange', onVisibility);
    });
    carousel.classList.add('is-ready');
    layout();
    updateToggle();
    schedule();
  }
}

// Decorative motion is optional; never hide content until scripts initialize.
if (!reduced.matches && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll<HTMLElement>('.precision-page .p-motion-enter');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (reduced.matches) return;
      (entry.target as HTMLElement).animate([
        { opacity: .5, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });
  }, { threshold: .1 });
  targets.forEach(target => observer.observe(target));
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}
if (!reduced.matches) {
  const hero = document.querySelector('.precision-page .p-motion-hero');
  hero?.querySelectorAll<HTMLElement>('.p-hero h1, .p-hero .p-lead, .p-hero-art').forEach((element, i) => {
    element.animate([
      { opacity: .35, transform: 'translateY(22px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 730, delay: i * 140, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
}
export {};
