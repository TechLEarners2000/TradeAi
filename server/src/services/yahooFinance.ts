import YahooFinance from 'yahoo-finance2';
import type { StockData } from './stockApi.js';

const yf = new YahooFinance();

const NSE_SUFFIX = '.NS';

export async function getYahooQuote(symbol: string): Promise<StockData> {
  const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}${NSE_SUFFIX}`;
  const result = await yf.quote(yahooSymbol);

  const price = result.regularMarketPrice ?? 0;
  const change = result.regularMarketChange ?? 0;
  const changePercent = result.regularMarketChangePercent ?? 0;

  return {
    symbol: result.symbol?.replace('.NS', '').replace('.BO', '') || symbol,
    price,
    change,
    changePercent,
    dayRange: {
      low: result.regularMarketDayLow ?? 0,
      high: result.regularMarketDayHigh ?? 0,
    },
    week52Range: {
      low: result.fiftyTwoWeekLow ?? 0,
      high: result.fiftyTwoWeekHigh ?? 0,
    },
    volume: result.regularMarketVolume ?? 0,
    marketCap: (result.marketCap ?? 0) / 1e12,
    pe: result.trailingPE ?? 0,
    dividendYield: (result.trailingAnnualDividendYield ?? 0) * 100,
    eps: result.epsTrailingTwelveMonths ?? 0,
    sector: result.sector ?? '',
    industry: result.industry ?? '',
    name: result.longName || result.shortName || symbol,
  };
}

export async function getYahooBatchQuotes(symbols: string[]): Promise<StockData[]> {
  const yahooSymbols = symbols.map(s =>
    s.includes('.') ? s : `${s}${NSE_SUFFIX}`
  );
  const results = await yf.quote(yahooSymbols);
  const arr = Array.isArray(results) ? results : [results];

  return arr.map(result => {
    const sym = (result.symbol ?? '').replace('.NS', '').replace('.BO', '');
    const price = result.regularMarketPrice ?? 0;
    const change = result.regularMarketChange ?? 0;
    const changePercent = result.regularMarketChangePercent ?? 0;

    return {
      symbol: sym,
      price,
      change,
      changePercent,
      dayRange: {
        low: result.regularMarketDayLow ?? 0,
        high: result.regularMarketDayHigh ?? 0,
      },
      week52Range: {
        low: result.fiftyTwoWeekLow ?? 0,
        high: result.fiftyTwoWeekHigh ?? 0,
      },
      volume: result.regularMarketVolume ?? 0,
      marketCap: (result.marketCap ?? 0) / 1e12,
      pe: result.trailingPE ?? 0,
      dividendYield: (result.trailingAnnualDividendYield ?? 0) * 100,
      eps: result.epsTrailingTwelveMonths ?? 0,
      sector: result.sector ?? '',
      industry: result.industry ?? '',
      name: result.longName || result.shortName || sym,
    };
  });
}
