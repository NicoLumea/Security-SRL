const menu = document.querySelector<HTMLDetailsElement>('.d-mobile-nav');
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
menu?.addEventListener('keydown', event => {
  if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary')?.focus(); }
});
const form = document.querySelector<HTMLFormElement>('.d-form');
form?.querySelector<HTMLButtonElement>('[data-demo-submit]')?.addEventListener('click', () => {
  const feedback = form.querySelector<HTMLElement>('.form-feedback');
  if (!feedback) return;
  const valid = form.reportValidity();
  feedback.textContent = valid ? form.dataset.success ?? '' : form.dataset.error ?? '';
  feedback.dataset.state = valid ? 'success' : 'error';
  feedback.focus();
});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const targets = document.querySelectorAll<HTMLElement>('[data-d-reveal]');
const active = new Set<Animation>();
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer?.unobserve(entry.target);
    if (reduced.matches || !('animate' in entry.target)) continue;
    const animation = entry.target.animate([
      { opacity: 0.45, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 460, easing: 'cubic-bezier(.2,.7,.2,1)' });
    active.add(animation);
    animation.finished.then(() => active.delete(animation)).catch(() => active.delete(animation));
  }
}, { threshold: 0.08 }) : undefined;
targets.forEach(el => observer?.observe(el));
reduced.addEventListener('change', () => { if (reduced.matches) active.forEach(a => a.cancel()); });
window.addEventListener('pagehide', () => { observer?.disconnect(); active.forEach(a => a.cancel()); });
export {};
