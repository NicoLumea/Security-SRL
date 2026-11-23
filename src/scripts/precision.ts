const menu = document.querySelector<HTMLDetailsElement>('.p-mobile-menu');
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { menu.open = false; }));
menu?.addEventListener('keydown', (event) => {
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
export {};
