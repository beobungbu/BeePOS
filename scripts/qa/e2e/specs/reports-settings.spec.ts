import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { V, money, pick } from '../lib/flows';

/**
 * The two admin controls that change what the whole screen says: the report period (including
 * a hand-picked range) and the app language. Both viewports: the period control is a segmented
 * control on desktop and a scrolling chip row on the phone, and the assertions are written
 * against the values rather than the control, so one spec covers both.
 */

/** The first money value on the report is the revenue stat, the same anchor the journey uses. */
function revenueStat(page: Page) {
  return page.locator('text=/\\d[\\d.,]*\\s*đ/').first();
}

/**
 * The accessible name BeeUI's `Calendar` gives a day cell: an en-US long date built in UTC
 * (`getCalendarDayAccessibilityLabel`), on an element whose role is `cell`, not `button`.
 * "Selected"/"Today" are appended to it, hence the prefix match.
 */
function dayName(year: number, monthIndex: number, day: number): RegExp {
  const label = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, monthIndex, day)));
  return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

/** The toolbar's collapsed-filters trigger, which carries an active count in its name. */
const FILTERS = 'Bộ lọc';

/**
 * Brings a report filter control on screen.
 *
 * At 1280 the four period segments and the store select fit inline in the toolbar, but picking
 * "Tuỳ chọn" adds two date triggers and the whole filter group moves into the toolbar's
 * "Bộ lọc" popover (`src/components/toolbar.tsx`). The popover closes whenever something inside
 * it is pressed or Escape is sent, so every access goes through here rather than opening it once.
 * On the phone the filters are laid out in the screen and there is no trigger, so this is a
 * no-op; that keeps one spec covering both viewports.
 */
async function revealFilter(page: Page, control: Locator): Promise<void> {
  if (await control.isVisible().catch(() => false)) return;
  const trigger = page.getByRole('button', { name: new RegExp(`^${FILTERS}`) }).first();
  if (!(await trigger.isVisible().catch(() => false))) return;
  await trigger.click();
  await control.waitFor({ state: 'visible' });
}

/**
 * Presses a date trigger and returns the calendar grid it opens. The press is retried twice,
 * defensively rather than against a known defect: the trigger is a hair old when it is pressed
 * (the custom range only appears when "Tuỳ chọn" is selected), and a suite that loses a report
 * assertion to a dropped press would be reporting the wrong thing. A retry prints itself, so a
 * run log says whether it ever fired.
 */
async function openCalendar(page: Page, trigger: Locator) {
  const grid = page.getByRole('grid').first();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await grid.isVisible()) return grid;
    if (attempt > 0) console.log(`retrying the date popover press (attempt ${attempt + 1})`);
    await revealFilter(page, trigger);
    await trigger.click();
    const opened = await grid
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (opened) return grid;
  }
  throw new Error('the date popover never opened');
}

test.describe('reports and settings', () => {
  test('report period switch and a custom range', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, '/reports');

    const today = money(await revenueStat(page).textContent());

    await test.step('a wider period reports more revenue than today alone', async () => {
      await revealFilter(page, pick(page, V.period30));
      await pick(page, V.period30).click();
      await expect.poll(async () => money(await revenueStat(page).textContent()), { timeout: 10_000 })
        .not.toBe(today);
      expect(money(await revenueStat(page).textContent())).toBeGreaterThan(today);
    });

    await test.step('a custom range asks for two dates before it means anything', async () => {
      await revealFilter(page, pick(page, V.periodCustom));
      await pick(page, V.periodCustom).click();
      const from = page.getByRole('button', { name: V.rangeFrom }).first();
      const to = page.getByRole('button', { name: V.rangeTo }).first();
      await revealFilter(page, from);
      await expect(from).toContainText(V.datePlaceholder);
      await expect(to).toContainText(V.datePlaceholder);
      await page.keyboard.press('Escape');
      // With no dates picked the range falls back to today, so the stat is today's again.
      expect(money(await revenueStat(page).textContent())).toBe(today);

      const now = new Date();
      const fromGrid = await openCalendar(page, from);
      await fromGrid.getByRole('cell', { name: dayName(now.getFullYear(), now.getMonth(), 1) }).click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('grid')).toHaveCount(0);
      await revealFilter(page, from);
      await expect(from).not.toContainText(V.datePlaceholder);
      await page.keyboard.press('Escape');

      const toGrid = await openCalendar(page, to);
      await toGrid
        .getByRole('cell', { name: dayName(now.getFullYear(), now.getMonth(), now.getDate()) })
        .click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('grid')).toHaveCount(0);
      await revealFilter(page, to);
      await expect(to).not.toContainText(V.datePlaceholder);
      await page.keyboard.press('Escape');

      // The first of this month to today covers today and every day before it in the month,
      // and the seed spreads its orders over the last 30 days.
      const custom = money(await revenueStat(page).textContent());
      if (now.getDate() > 1) expect(custom).toBeGreaterThan(today);
      else expect(custom).toBe(today);
    });

    await test.step('back to today', async () => {
      await revealFilter(page, pick(page, V.periodToday));
      await pick(page, V.periodToday).click();
      await expect.poll(async () => money(await revenueStat(page).textContent()), { timeout: 10_000 })
        .toBe(today);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('language switch changes the labels and goes back', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, '/settings');

    await test.step('switch to English', async () => {
      await page.getByRole('combobox', { name: V.language }).click();
      await page.getByRole('option', { name: /English/ }).click();
      await expect(page.getByText(V.languageEn).first()).toBeVisible();
      await expect(page.getByText('Reset demo data').first()).toBeVisible();
      await expect(page.getByText(V.resetData)).toHaveCount(0);
    });

    await test.step('switch back to Vietnamese', async () => {
      await page.getByRole('combobox', { name: V.languageEn }).click();
      await page.getByRole('option', { name: /Tiếng Việt/ }).click();
      await expect(page.getByText(V.language).first()).toBeVisible();
      await expect(page.getByText(V.resetData).first()).toBeVisible();
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
