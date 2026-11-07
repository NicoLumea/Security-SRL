import { test, expect, type Page, type Locator } from '@playwright/test';

const home = '/concepts/sentinel/ro/';
test.beforeEach(async ({ page }) => {
  // Keep the existing timed cookie dialog from obscuring scroll/focus checks.
  await page.addInitScript(() => {
    localStorage.setItem(
      'security-srl-consent-v1',
      JSON.stringify({
        version: 1,
        at: Date.now(),
        analytics: false,
        marketing: false,
      }),
    );
  });
});

async function show(element: Locator) {
  await element.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(element).toHaveAttribute('data-reveal-state', 'visible');
  await expect(element).toHaveCSS('opacity', '1');
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Sentinel reveal entry, upward replay and stable layout at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(home);
    await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero [data-reveal]')).toHaveCount(0);
    await expect(page.locator('.hero-image')).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
    const card = page.locator('.service-card').first();
    await expect(card).toHaveAttribute('data-reveal-state', 'hidden');
    await expect(card).toHaveCSS('opacity', '0');
    const originalSize = await card.evaluate((el: HTMLElement) => [
      el.offsetWidth,
      el.offsetHeight,
    ]);
    await card.evaluate((el) => {
      el.dataset.testTransitions = '0';
      el.addEventListener('transitionrun', (event) => {
        if (event.target === el && (event as TransitionEvent).propertyName === 'opacity')
          el.dataset.testTransitions = String(Number(el.dataset.testTransitions) + 1);
      });
    });
    await noOverflow(page);
    await show(card);
    await expect(card).toHaveAttribute('data-test-transitions', '1');
    expect(await card.evaluate((el: HTMLElement) => [el.offsetWidth, el.offsetHeight])).toEqual(
      originalSize,
    );
    await noOverflow(page);
    await info.attach(`solutions-${width}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // Keep the bottom 100px of the card in view: this must NOT reset it.
    await card.evaluate((el) =>
      window.scrollTo({
        top: window.scrollY + el.getBoundingClientRect().bottom - 100,
        behavior: 'instant',
      }),
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(card).toHaveAttribute('data-reveal-state', 'visible');
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    );
    await expect(card).toHaveAttribute('data-reveal-state', 'hidden');
    await noOverflow(page);
    await show(card); // Re-enter from above while scrolling upward.
    await expect(card).toHaveAttribute('data-test-transitions', '2');
    await noOverflow(page);
    await expect(page.locator('.site-header')).toBeVisible();
  });
}

test('simultaneously entering service cards stagger with bounded delays', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto(home);
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
  const cards = page.locator('.service-card');
  await cards.first().evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(cards.last()).toHaveAttribute('data-reveal-state', 'visible');
  const delays = await cards.evaluateAll((elements) =>
    elements.map((el) => (el as HTMLElement).style.getPropertyValue('--reveal-delay')),
  );
  expect(delays).toEqual(['0ms', '100ms', '200ms', '300ms']);
});

test('keyboard focus reveals content immediately and prevents offscreen reset', async ({
  page,
}) => {
  await page.goto(home);
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
  const card = page.locator('.service-card').first();
  await page.locator('.hero-rail a').focus();
  await page.keyboard.press('Tab');
  await expect(card).toBeFocused();
  await expect(card).toHaveAttribute('data-reveal-state', 'visible');
  await expect(card).toHaveCSS('opacity', '1');
  await expect(card).toHaveCSS('translate', 'none');
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await expect(card).toHaveAttribute('data-reveal-state', 'visible');
});

test('reduced motion immediately reveals everything, including preference changes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(home);
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'reduced');
  const allVisible = () =>
    page.locator('[data-reveal]').evaluateAll((elements) =>
      elements.every((el) => {
        const style = getComputedStyle(el);
        return (
          style.opacity === '1' && style.translate === 'none' && style.transitionDuration === '0s'
        );
      }),
    );
  expect(await allVisible()).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
  await expect(page.locator('[data-reveal-state=hidden]').first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-reveal-state]')).toHaveCount(0);
  expect(await allVisible()).toBe(true);
});

test('no JavaScript keeps every reveal visible and navigation usable', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto(home);
    await expect(page.locator('[data-reveal-state]')).toHaveCount(0);
    expect(
      await page
        .locator('[data-reveal]')
        .evaluateAll((elements) => elements.every((el) => getComputedStyle(el).opacity === '1')),
    ).toBe(true);
    await page.locator('.service-card').first().click();
    await expect(page).toHaveURL(/servicii\/#/);
  } finally {
    await context.close();
  }
});

for (const failure of ['unavailable', 'partial initialization']) {
  test(`observer ${failure} fails open without hidden content`, async ({ page }) => {
    await page.addInitScript((mode) => {
      if (mode === 'unavailable') {
        Object.defineProperty(window, 'IntersectionObserver', {
          value: undefined,
          configurable: true,
        });
      } else {
        const Native = window.IntersectionObserver;
        let calls = 0;
        window.IntersectionObserver = class extends Native {
          override observe(element: Element) {
            if (++calls === 3) throw new Error('Test observer initialization failure');
            super.observe(element);
          }
        };
      }
    }, failure);
    await page.goto(home);
    await expect(page.locator('[data-reveal-state]')).toHaveCount(0);
    expect(
      await page
        .locator('[data-reveal]')
        .evaluateAll((elements) => elements.every((el) => getComputedStyle(el).opacity === '1')),
    ).toBe(true);
    await expect(page.locator('.hero-image')).toBeVisible();
  });
}

test('fragment navigation and portfolio filtering never leave selected content hidden', async ({
  page,
}) => {
  await page.goto(home + 'servicii/#video');
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
  const service = page.locator('.service-detail').last();
  const id = await service.getAttribute('id');
  await page.evaluate((fragment) => {
    window.location.hash = fragment!;
  }, id);
  await expect(service).toHaveAttribute('data-reveal-state', 'visible');
  await page.goto(home + 'proiecte/');
  await page.locator('[data-project-search]').fill('inexistent');
  await expect(page.locator('[data-empty]')).toBeVisible();
  await page.locator('[data-project-search]').fill('');
  for (const card of await page.locator('[data-project]').all()) await show(card);
});

for (const path of [
  'servicii/',
  'proiecte/',
  'proiecte/exemplu-spatiu-comercial/',
  'despre-noi/',
  'contact/',
]) {
  test(`all eligible sections settle visibly on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(home + path);
    await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
    for (const element of await page.locator('[data-reveal]').all()) {
      if (await element.evaluate((el) => el.getBoundingClientRect().height > 0))
        await show(element);
      await noOverflow(page);
    }
    await expect(page.locator('form [data-reveal], .site-header [data-reveal]')).toHaveCount(0);
  });
}

test('English uses the same motion and gallery remains isolated', async ({ page }) => {
  await page.goto('/concepts/sentinel/en/');
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
  await show(page.locator('.service-card').first());
  await page.goto('/');
  await expect(page.locator('[data-reveal], [data-reveal-state]')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveAttribute('data-reveals', 'ready');
  await expect(page.locator('.concept-card')).toHaveCount(4);
  await expect(page.locator('.concept-action[href]')).toHaveCount(1);
});

test('page lifecycle cleanup restores visibility and reinitializes on back/forward restore', async ({
  page,
}) => {
  await page.goto(home);
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
  );
  await expect(page.locator('[data-reveal-state]')).toHaveCount(0);
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
  );
  await expect(page.locator('body')).toHaveAttribute('data-reveals', 'ready');
  await show(page.locator('.service-card').first());
});
