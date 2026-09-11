import { expect, test } from '@playwright/test';
import { gotoAuditHarness } from './helpers';

// TOAST-01, TOAST-02 (docs/beeui-audit/behavior-claims.md)

function visibleToasts(page: import('@playwright/test').Page) {
  return page.locator('[aria-live="polite"]');
}

/** Extracts each toast's title, stripping the trailing dismiss-button glyph text. */
async function toastTitles(toasts: ReturnType<typeof visibleToasts>): Promise<string[]> {
  const texts = await toasts.allTextContents();
  return texts.map((t) => t.replace(/[×✕xX]\s*$/, '').trim()).sort();
}

test('TOAST-01: toasts queue FIFO with at most three visible at once', async ({ page }) => {
  await gotoAuditHarness(page);
  const toasts = visibleToasts(page);

  await page.locator('[data-testid="toast01-trigger-5"]').click();

  // At most TOAST_MAX_VISIBLE (3) are shown, and they are the three oldest enqueued
  // (Toast 1-3), not the three newest — that is the FIFO admission order. Rendering
  // order within that set (newest-on-top stacking) is a presentation detail, not part
  // of this claim, so titles are compared as a set.
  await expect(toasts).toHaveCount(3);
  expect(await toastTitles(toasts)).toEqual(['Toast 1', 'Toast 2', 'Toast 3']);

  // Dismissing the oldest admits the next queued toast (Toast 4), preserving FIFO order.
  await page.getByRole('button', { name: 'Dismiss Toast 1' }).click();
  await expect(toasts).toHaveCount(3);
  expect(await toastTitles(toasts)).toEqual(['Toast 2', 'Toast 3', 'Toast 4']);

  await page.locator('[data-testid="toast01-dismiss-all"]').click();
  await expect(toasts).toHaveCount(0);
});

test('TOAST-02: an explicit persistent toast never auto-dismisses; action-triggered dismissal is deterministic', async ({
  page,
}) => {
  await gotoAuditHarness(page);
  const toasts = visibleToasts(page);
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.locator('[data-testid="toast02-persistent"]').click();
  await expect(toasts).toHaveCount(1);
  await expect(toasts.first()).toContainText('Persistent Toast');

  // TOAST_DEFAULT_DURATION is 5000ms; wait past it and confirm it is still there.
  await page.waitForTimeout(5500);
  await expect(toasts).toHaveCount(1);
  await expect(toasts.first()).toContainText('Persistent Toast');

  await page.locator('[data-testid="toast02-dismiss-all"]').click();
  await expect(toasts).toHaveCount(0);

  // A short-duration toast dismissed via its action button (well before the timer
  // fires) is removed exactly once, with no console/page error from a racing
  // auto-dismiss firing on top of the action dismissal.
  await page.locator('[data-testid="toast02-timed-action"]').click();
  await expect(toasts).toHaveCount(1);
  await page.getByRole('button', { name: 'Dismiss now' }).click();
  await expect(toasts).toHaveCount(0);

  // Wait past the toast's 1500ms duration to make sure the cancelled timer does not
  // fire a second, redundant dismiss (which would be harmless here but would
  // indicate the timer was not actually cleared).
  await page.waitForTimeout(2000);
  await expect(toasts).toHaveCount(0);
  expect(errors).toEqual([]);
});
