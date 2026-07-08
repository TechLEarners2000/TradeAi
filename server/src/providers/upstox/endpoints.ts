export const UPSTOX_ENDPOINTS = {
  baseUrl: 'https://api.upstox.com/v2',
  baseUrlV3: 'https://api.upstox.com/v3',

  search: '/instruments/search',

  marketStatus: '/market/status',
  holidays: '/market/holidays',
  marketTimings: '/market/timings',

  quotes: '/market-quote/quotes',
  ltp: '/market-quote/ltp',
  ohlc: '/market-quote/ohlc',

  historicalCandle: '/historical-candle',
  intradayCandle: '/historical-candle/intraday',

  optionChain: '/option/chain',
  optionContract: '/option/contract',
} as const;
