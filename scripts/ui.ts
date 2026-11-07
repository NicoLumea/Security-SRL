import { CONSENT_KEY, readConsent, type Consent } from '../lib/consent';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  let ticking = false;
  const update = () => {
    header.classList.toggle('scrolled', window.scrollY > 48);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}
// Content is visible without JS; never animate elements already in the viewport.
if (!reduced.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll('.reveal').forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add('ready');
      observer.observe(el);
    }
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape')
    document.querySelectorAll('details[open]').forEach((el) => el.removeAttribute('open'));
});
document.addEventListener('click', (e) => {
  document.querySelectorAll('details[open]').forEach((el) => {
    if (e.target instanceof HTMLElement && !el.contains(e.target)) el.removeAttribute('open');
  });
});
// MP4/WebM slots intentionally have no network source until motion is permitted.
const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
if (video) {
  const sync = () => {
    if (reduced.matches) {
      video.pause();
      return;
    }
    video.querySelectorAll('source').forEach((s) => {
      if (!s.src && s.dataset.src) s.src = s.dataset.src;
    });
    video.load();
    video.muted = true;
    void video.play().catch(() => {
      video.hidden = true;
    });
  };
  sync();
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (!reduced.matches) void video.play().catch(() => {});
  });
}
// Presentation-only form. No action URL, named fields, fetch, or data persistence.
const form = document.querySelector<HTMLFormElement>('[data-demo-form]');
if (form) {
  form.addEventListener('submit', (e) => e.preventDefault());
  const feedback = form.querySelector<HTMLElement>('.form-feedback')!;
  const validate = () => {
    const valid = form.reportValidity();
    feedback.textContent = valid ? form.dataset.success! : form.dataset.error!;
    if (valid) feedback.focus();
  };
  form.querySelector('[data-demo-submit]')?.addEventListener('click', validate);
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      validate();
    }
  });
}
const search = document.querySelector<HTMLInputElement>('[data-project-search]');
const filters = document.querySelector<HTMLElement>('[data-filters]');
if (filters) {
  let category = 'all';
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const filter = () => {
    let visible = 0;
    document.querySelectorAll<HTMLElement>('[data-project]').forEach((el) => {
      const match =
        (category === 'all' || el.dataset.category === category) &&
        normalize(el.dataset.search || '').includes(normalize(search?.value || ''));
      el.hidden = !match;
      if (match) visible++;
    });
    const empty = document.querySelector<HTMLElement>('[data-empty]');
    if (empty) empty.hidden = visible > 0;
  };
  filters.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => {
      category = b.dataset.filter || 'all';
      filters.querySelectorAll('button').forEach((other) => {
        const active = other === b;
        other.classList.toggle('selected', active);
        other.setAttribute('aria-pressed', String(active));
      });
      filter();
    }),
  );
  search?.addEventListener('input', filter);
}
// Two cards on desktop; swipe/manual rotation on mobile. Rotation is opt-in and pausable.
const track = document.querySelector<HTMLElement>('[data-featured]');
const controls = document.querySelector<HTMLElement>('[data-rotation-controls]');
if (track && controls) {
  const mobile = matchMedia('(max-width:700px)');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let playing = false;
  let index = 0;
  const play = controls.querySelector<HTMLButtonElement>('[data-rotate]')!;
  const cards = [...track.children] as HTMLElement[];
  const move = (delta: number) => {
    index = (index + delta + cards.length) % cards.length;
    track.scrollTo({
      left: cards[index].offsetLeft - track.offsetLeft,
      behavior: reduced.matches ? 'instant' : 'smooth',
    });
    const label = controls.querySelector('[data-slide-count]');
    if (label)
      label.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  };
  const stop = () => {
    playing = false;
    clearTimeout(timer);
    play.textContent = play.dataset.play!;
    play.setAttribute('aria-pressed', 'false');
  };
  const schedule = () => {
    timer = setTimeout(() => {
      if (playing && !document.hidden) {
        move(1);
        schedule();
      }
    }, 6000);
  };
  controls.querySelector('[data-next]')?.addEventListener('click', () => {
    stop();
    move(1);
  });
  controls.querySelector('[data-previous]')?.addEventListener('click', () => {
    stop();
    move(-1);
  });
  play.addEventListener('click', () => {
    if (playing) {
      stop();
      return;
    }
    if (reduced.matches) return;
    playing = true;
    play.textContent = play.dataset.pause!;
    play.setAttribute('aria-pressed', 'true');
    schedule();
  });
  track.addEventListener('pointerdown', stop);
  track.addEventListener('focusin', stop);
  track.addEventListener('mouseenter', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  const sync = () => {
    controls.hidden = !mobile.matches || cards.length < 2;
    play.hidden = reduced.matches;
    stop();
    if (!mobile.matches) track.scrollLeft = 0;
  };
  sync();
  mobile.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
}
// No analytics/marketing script exists. Consent only remembers a local preference.
const dialog = document.querySelector<HTMLDialogElement>('#consent');
if (dialog) {
  let previousFocus: HTMLElement | null = null;
  let stored: Consent | null = null;
  try {
    stored = readConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    /* Browser storage may be disabled. */
  }
  const analytics = dialog.querySelector<HTMLInputElement>('#analytics')!;
  const marketing = dialog.querySelector<HTMLInputElement>('#marketing')!;
  const open = () => {
    previousFocus = document.activeElement as HTMLElement;
    analytics.checked = stored?.analytics ?? false;
    marketing.checked = stored?.marketing ?? false;
    dialog.showModal();
  };
  const close = () => {
    dialog.close();
    previousFocus?.focus();
  };
  dialog.querySelector('[data-consent-close]')?.addEventListener('click', close);
  document
    .querySelectorAll('[data-open-consent]')
    .forEach((b) => b.addEventListener('click', open));
  dialog.querySelector('[data-customize]')?.addEventListener('click', () => {
    dialog.querySelector<HTMLElement>('#consent-options')!.hidden = false;
    dialog.querySelector<HTMLElement>('[data-choice="save"]')!.hidden = false;
    analytics.focus();
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((b) =>
    b.addEventListener('click', () => {
      const choice = b.dataset.choice;
      stored = {
        version: 1,
        at: Date.now(),
        analytics: choice === 'accept' || (choice === 'save' && analytics.checked),
        marketing: choice === 'accept' || (choice === 'save' && marketing.checked),
      };
      try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
      } catch {
        /* No network fallback. */
      }
      close();
    }),
  );
  if (!stored)
    setTimeout(() => {
      if (!stored && !dialog.open) open();
    }, 10000);
}
