import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { MarketStatus, MarketSegment } from '../../models/market-status.js';
import type { OptionChain, OptionContract } from '../../models/option-chain.js';

export function parseQuote(raw: any, symbol: string): MarketQuote {
  const key = Object.keys(raw.data || {})[0];
  if (!key) throw new Error(`No quote data for ${symbol}`);

  const quote = raw.data[key];
  const lastPrice = quote.last_price || 0;
  const netChange = quote.net_change || 0;
  const previousClose = lastPrice - netChange;
  const changePercent = previousClose ? (netChange / previousClose) * 100 : 0;

  const ohlc = quote.ohlc || {};
  const timestamp = quote.timestamp || '';

  return {
    symbol: symbol.toUpperCase(),
    name: quote.symbol || symbol,
    price: lastPrice,
    change: netChange,
    changePercent,
    open: ohlc.open || 0,
    high: ohlc.high || 0,
    low: ohlc.low || 0,
    close: previousClose,
    volume: quote.volume || 0,
    marketCap: 0,
    pe: 0,
    dividendYield: 0,
    eps: 0,
    sector: '',
    industry: '',
    week52High: 0,
    week52Low: 0,
    lastUpdate: timestamp,
    exchange: 'NSE',
  };
}

export function parseHistorical(raw: any): HistoricalCandle[] {
  const candles: any[][] = raw.data?.candles || [];
  return candles.map(candle => ({
    date: candle[0] || '',
    open: candle[1] || 0,
    high: candle[2] || 0,
    low: candle[3] || 0,
    close: candle[4] || 0,
    volume: candle[5] || 0,
  }));
}

export function parseMarketStatus(raw: any): MarketStatus {
  const data = raw.data || {};
  const statusStr: string = data.status || '';
  const isOpen = statusStr === 'OPEN' || statusStr === 'PRE_OPEN' || statusStr === 'STARTING';

  const segments: MarketSegment[] = [
    {
      segment: 'Equity',
      status: isOpen ? 'Open' : 'Closed',
      time: data.last_updated ? new Date(data.last_updated).toISOString() : '',
    },
  ];

  return {
    exchange: 'NSE',
    open: isOpen,
    segments,
    timestamp: new Date().toISOString(),
  };
}

export function parseSearchResults(raw: any): SearchResult[] {
  const items: any[] = raw.data || [];
  return items
    .filter((item: any) => item.segment === 'NSE_EQ')
    .map((item: any) => ({
      symbol: item.trading_symbol || '',
      name: item.name || item.trading_symbol || '',
      exchange: 'NSE',
      isin: item.isin || '',
    }));
}

export function parseSearchResultItem(item: any): { instrumentKey: string; symbol: string } | null {
  if (!item || !item.instrument_key) return null;
  return {
    instrumentKey: item.instrument_key,
    symbol: item.trading_symbol || item.name || '',
  };
}

export function parseOptionChain(raw: any, symbol: string, expiry?: string): OptionChain {
  const contracts: any[] = raw.data || [];

  const now = Date.now();
  const underlyingPrice = 0;
  const calls: OptionContract[] = [];
  const puts: OptionContract[] = [];

  let totalCallOi = 0;
  let totalPutOi = 0;

  for (const c of contracts) {
    const instType: string = c.instrument_type || '';
    const isCe = instType === 'CE' || instType === 'CALL' || instType.toUpperCase() === 'CE';
    const isPe = instType === 'PE' || instType === 'PUT' || instType.toUpperCase() === 'PE';

    if (!isCe && !isPe) continue;

    const contract: OptionContract = {
      strikePrice: c.strike_price || 0,
      expiry: c.expiry || expiry || '',
      callOi: 0,
      callLastPrice: 0,
      callIv: 0,
      callChange: 0,
      callVolume: 0,
      putOi: 0,
      putLastPrice: 0,
      putIv: 0,
      putChange: 0,
      putVolume: 0,
    };

    if (isCe) {
      contract.callOi = c.oi || c.open_interest || 0;
      contract.callLastPrice = c.last_price || 0;
      contract.callIv = c.iv || 0;
      contract.callVolume = c.volume || 0;
      calls.push(contract);
    } else {
      contract.putOi = c.oi || c.open_interest || 0;
      contract.putLastPrice = c.last_price || 0;
      contract.putIv = c.iv || 0;
      contract.putVolume = c.volume || 0;
      puts.push(contract);
    }
  }

  const strikeMap = new Map<number, OptionContract>();

  for (const c of calls) {
    const key = c.strikePrice;
    if (!strikeMap.has(key)) {
      strikeMap.set(key, { ...c, putOi: 0, putLastPrice: 0, putIv: 0, putChange: 0, putVolume: 0 });
    } else {
      const existing = strikeMap.get(key)!;
      existing.callOi = c.callOi;
      existing.callLastPrice = c.callLastPrice;
      existing.callIv = c.callIv;
      existing.callVolume = c.callVolume;
    }
  }

  for (const p of puts) {
    const key = p.strikePrice;
    if (!strikeMap.has(key)) {
      strikeMap.set(key, { ...p, callOi: 0, callLastPrice: 0, callIv: 0, callChange: 0, callVolume: 0 });
    } else {
      const existing = strikeMap.get(key)!;
      existing.putOi = p.putOi;
      existing.putLastPrice = p.putLastPrice;
      existing.putIv = p.putIv;
      existing.putVolume = p.putVolume;
    }
  }

  const strikes = Array.from(strikeMap.values()).sort((a, b) => a.strikePrice - b.strikePrice);

  for (const s of strikes) {
    totalCallOi += s.callOi;
    totalPutOi += s.putOi;
  }

  const pcr = totalCallOi > 0 ? totalPutOi / totalCallOi : 0;
  const expiryDate = strikes.length > 0 ? strikes[0].expiry : expiry || '';

  return {
    symbol: symbol.toUpperCase(),
    underlying: underlyingPrice,
    expiry: expiryDate,
    timestamp: new Date().toISOString(),
    atm: underlyingPrice,
    totalCallOi,
    totalPutOi,
    pcr,
    maxPain: 0,
    strikes,
  };
}

export function isUpstoxError(raw: any): string | null {
  if (raw?.status === 'error') {
    const msg = raw?.errors?.[0]?.message || 'Unknown error';
    return msg;
  }
  return null;
}
