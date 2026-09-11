import { registerDictionary } from './registry';

export const reportsEn = {
  title: 'Reports',
  subtitle: 'Revenue and performance overview across the chain',
  period: {
    today: 'Today',
    last7: '7 days',
    last30: '30 days',
    custom: 'Custom',
    from: 'From',
    to: 'To',
    apply: 'Apply',
  },
  storeFilter: {
    label: 'Store',
    all: 'All stores',
  },
  stat: {
    revenue: 'Revenue',
    orders: 'Orders',
    avgBasket: 'Avg basket',
    grossProfit: 'Gross profit',
    refunds: 'Refunds',
    vsPrevious: 'vs previous period',
  },
  section: {
    revenueByDay: 'Revenue by day',
    revenueByStore: 'By store',
    topProducts: 'Top 10 products',
    paymentMix: 'Payment methods',
    cashierPerformance: 'Cashiers',
  },
  table: {
    store: 'Store',
    orders: 'Orders',
    revenue: 'Revenue',
    share: 'Share',
    product: 'Product',
    qty: 'Qty',
    method: 'Method',
    amount: 'Amount',
    cashier: 'Cashier',
    avg: 'Avg/order',
  },
  paymentMethod: {
    cash: 'Cash',
    transfer: 'Bank transfer',
    card: 'Card',
    points: 'Points',
  },
  export: {
    button: 'Export report',
    toastTitle: 'Report exported',
    toastDescription: 'The report file is ready to download',
  },
  empty: {
    noData: 'No data for this period',
  },
};

registerDictionary('en', 'reports', reportsEn);
