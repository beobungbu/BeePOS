import {
  capPerGroup,
  foldText,
  groupCommands,
  queryTokens,
  rankCommands,
  scoreCommand,
  type CommandItem,
} from '../command-search';

const item = (over: Partial<CommandItem> & Pick<CommandItem, 'id' | 'group' | 'title'>): CommandItem => ({
  href: `/${over.id}`,
  ...over,
});

const ITEMS: CommandItem[] = [
  item({ id: 'pos', group: 'screens', title: 'Bán hàng' }),
  item({ id: 'orders', group: 'screens', title: 'Đơn hàng' }),
  item({ id: 'p1', group: 'products', title: 'Nước ngọt Coca-Cola 330ml', subtitle: '330ml · lon', keywords: 'SP0003 8938000000037' }),
  item({ id: 'p2', group: 'products', title: 'Nước ngọt Pepsi 330ml', subtitle: '330ml · lon', keywords: 'SP0009' }),
  item({ id: 'o1', group: 'orders', title: 'HD-HN01-20260912-001', subtitle: '158.000 đ' }),
  item({ id: 'c1', group: 'customers', title: 'Vũ Minh Nga', keywords: '0901234567' }),
];

describe('foldText', () => {
  it('strips Vietnamese diacritics and lowercases', () => {
    expect(foldText('Nước ngọt')).toBe('nuoc ngot');
  });

  it('folds đ, which carries no combining mark', () => {
    expect(foldText('Đơn hàng')).toBe('don hang');
  });
});

describe('queryTokens', () => {
  it('splits on whitespace and drops empties', () => {
    expect(queryTokens('  Coca   330 ')).toEqual(['coca', '330']);
  });

  it('is empty for a blank query', () => {
    expect(queryTokens('   ')).toEqual([]);
  });
});

describe('scoreCommand', () => {
  it('rejects an item when one token matches nothing', () => {
    expect(scoreCommand(ITEMS[2], ['coca', 'khongcothat'])).toBeNull();
  });

  it('scores a title prefix above a title word prefix', () => {
    const prefix = scoreCommand(ITEMS[2], ['nuoc']) ?? 0;
    const wordPrefix = scoreCommand(ITEMS[2], ['coca']) ?? 0;
    expect(prefix).toBeGreaterThan(wordPrefix);
  });

  it('scores a title hit above a keywords-only hit', () => {
    const title = scoreCommand(ITEMS[2], ['coca']) ?? 0;
    const keyword = scoreCommand(ITEMS[2], ['sp0003']) ?? 0;
    expect(title).toBeGreaterThan(keyword);
    expect(keyword).toBeGreaterThan(0);
  });
});

describe('rankCommands', () => {
  it('keeps the caller order for an empty query', () => {
    expect(rankCommands(ITEMS, '').map((entry) => entry.id)).toEqual(ITEMS.map((entry) => entry.id));
  });

  it('finds an accented product from an unaccented query', () => {
    expect(rankCommands(ITEMS, 'nuoc ngot').map((entry) => entry.id)).toEqual(['p2', 'p1']);
  });

  it('narrows as tokens are added', () => {
    expect(rankCommands(ITEMS, 'nuoc coca').map((entry) => entry.id)).toEqual(['p1']);
  });

  it('matches a SKU and a barcode that are never shown', () => {
    expect(rankCommands(ITEMS, 'sp0009').map((entry) => entry.id)).toEqual(['p2']);
    expect(rankCommands(ITEMS, '8938000000037').map((entry) => entry.id)).toEqual(['p1']);
  });

  it('matches an order code and a customer phone', () => {
    expect(rankCommands(ITEMS, 'hd-hn01').map((entry) => entry.id)).toEqual(['o1']);
    expect(rankCommands(ITEMS, '0901234567').map((entry) => entry.id)).toEqual(['c1']);
  });

  it('returns nothing when no item matches', () => {
    expect(rankCommands(ITEMS, 'zzzz')).toEqual([]);
  });

  it('honours the limit', () => {
    expect(rankCommands(ITEMS, '330ml', 1)).toHaveLength(1);
  });
});

describe('capPerGroup', () => {
  it('keeps at most n rows per group in ranked order', () => {
    const capped = capPerGroup([ITEMS[2], ITEMS[3], ITEMS[0], ITEMS[1]], 1);
    expect(capped.map((entry) => entry.id)).toEqual(['p1', 'pos']);
  });
});

describe('groupCommands', () => {
  it('orders sections screens, products, orders, customers and drops empty ones', () => {
    const sections = groupCommands([ITEMS[5], ITEMS[2], ITEMS[0]]);
    expect(sections.map((section) => section.group)).toEqual(['screens', 'products', 'customers']);
  });
});
