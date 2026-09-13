import { filtersFitInline, SEARCH_MIN_WIDTH, TOOLBAR_GAP } from '../toolbar-fit';

/** A 1440 pt window minus the 240 pt sidebar and the 48 pt page gutter. */
const AT_1440 = 1152;
/** A 1280 pt window minus the same chrome, the tightest desktop the app supports. */
const AT_1280 = 992;

const fit = (overrides: Partial<Parameters<typeof filtersFitInline>[0]>) =>
  filtersFitInline({
    available: AT_1440,
    filtersWidth: 0,
    pinnedWidth: 0,
    actionsWidth: 0,
    searchWidth: SEARCH_MIN_WIDTH,
    ...overrides,
  });

describe('filtersFitInline', () => {
  it('keeps the filters inline until the first layout pass has measured them', () => {
    expect(fit({ available: 0, filtersWidth: 0 })).toBe(true);
    expect(fit({ available: AT_1440, filtersWidth: 0 })).toBe(true);
  });

  it('keeps the filters inline when everything fits the row', () => {
    expect(fit({ filtersWidth: 500, actionsWidth: 160 })).toBe(true);
  });

  it('collapses the filters rather than squeezing the search below its floor', () => {
    // 260 + 700 + 200 + two gaps = 1176, past the 1152 the row has.
    expect(fit({ filtersWidth: 700, actionsWidth: 200 })).toBe(false);
  });

  it('counts the pinned slot, which never collapses', () => {
    expect(fit({ available: AT_1280, filtersWidth: 400, actionsWidth: 300 })).toBe(true);
    expect(fit({ available: AT_1280, filtersWidth: 400, actionsWidth: 300, pinnedWidth: 120 })).toBe(false);
  });

  it('drops the gap for a slot the screen does not have', () => {
    const exact = AT_1280 - SEARCH_MIN_WIDTH - TOOLBAR_GAP;
    expect(fit({ available: AT_1280, filtersWidth: exact })).toBe(true);
    expect(fit({ available: AT_1280, filtersWidth: exact + 1 })).toBe(false);
  });

  it('judges a screen with no search on the filters and actions alone', () => {
    expect(fit({ available: AT_1280, searchWidth: 0, filtersWidth: 800, actionsWidth: 184 })).toBe(true);
    expect(fit({ available: AT_1280, searchWidth: 0, filtersWidth: 800, actionsWidth: 185 })).toBe(false);
  });
});
