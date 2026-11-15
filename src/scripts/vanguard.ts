const menu = document.querySelector<HTMLDetailsElement>('.v-mobile-menu');
menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.open = false;
  });
});
menu?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});
// Visible by default, including without JS. Animate only as content enters the viewport.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new Set<Animation>();
const targets = document.querySelectorAll<HTMLElement>('[data-v-enter]');
const observer =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer?.unobserve(entry.target);
            if (motion.matches || !('animate' in entry.target)) continue;
            const animation = entry.target.animate(
              [
                { opacity: 0.35, transform: 'translateY(18px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)' },
            );
            animations.add(animation);
            animation.finished
              .then(() => animations.delete(animation))
              .catch(() => animations.delete(animation));
          }
        },
        { threshold: 0.08 },
      )
    : undefined;
targets.forEach((target) => observer?.observe(target));
motion.addEventListener('change', () => {
  if (motion.matches) animations.forEach((animation) => animation.cancel());
});
window.addEventListener('pagehide', () => animations.forEach((animation) => animation.cancel()));

export {};
