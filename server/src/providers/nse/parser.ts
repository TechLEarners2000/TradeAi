import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { CompanyProfile } from '../../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../../models/corporate.js';
import type { IndexData, IndexInfo } from '../../models/index.js';
import type { OptionChain, OptionContract } from '../../models/option-chain.js';
import type { MarketStatus, MarketSegment } from '../../models/market-status.js';

export function parseQuote(raw: any, symbol: string): MarketQuote {
  // Handle current /api/quote-equity response format
  const priceInfo = raw.priceInfo || {};
  const meta = raw.metadata || {};
  const secInfo = raw.securityInfo || {};
  const indInfo = raw.industryInfo || {};

  const lastPrice = priceInfo.lastPrice || 0;
  const prevClose = priceInfo.previousClose || 0;
  const change = priceInfo.change ?? (lastPrice - prevClose);
  const changePercent = priceInfo.pChange ?? (prevClose ? (change / prevClose) * 100 : 0);

  return {
    symbol: symbol.toUpperCase(),
    name: secInfo.companyName || secInfo.symbol || symbol,
    price: lastPrice,
    change,
    changePercent,
    open: priceInfo.open || 0,
    high: priceInfo.dayHigh || 0,
    low: priceInfo.dayLow || 0,
    close: prevClose,
    volume: priceInfo.totalTradedVolume || 0,
    marketCap: (meta.marketCapFull || 0) / 1e7,
    pe: meta.pdSymbolPe || 0,
    dividendYield: meta.dividendYield || 0,
    eps: meta.earningsPerShare || 0,
    sector: indInfo.sector || '',
    industry: indInfo.industry || '',
    week52High: meta.high52 || 0,
    week52Low: meta.low52 || 0,
    lastUpdate: priceInfo.tradeDateTime || new Date().toISOString(),
    exchange: 'NSE',
  };
}

export function parseEquityQuote(raw: any, symbol: string): MarketQuote {
  const lastPrice = raw.close || raw.lastPrice || 0;
  const prevClose = raw.previousClose || 0;
  const change = lastPrice - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    name: raw.symbol || symbol,
    price: lastPrice,
    change,
    changePercent,
    open: raw.open || 0,
    high: raw.dayHigh || raw.high || 0,
    low: raw.dayLow || raw.low || 0,
    close: prevClose,
    volume: raw.totalTradedVolume || raw.volume || 0,
    marketCap: 0,
    pe: 0,
    dividendYield: 0,
    eps: 0,
    sector: '',
    industry: '',
    week52High: raw.high52 || 0,
    week52Low: raw.low52 || 0,
    lastUpdate: raw.lastUpdateTime || new Date().toISOString(),
    exchange: 'NSE',
  };
}

export function parseHistorical(raw: any[]): HistoricalCandle[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(row => ({
    date: row.mTIMESTAMP || row.EOD_TIMESTAMP || row.TIMESTAMP || '',
    open: parseFloat(row.OPEN || row.OPEN_PRICE || 0),
    high: parseFloat(row.HIGH || row.HIGH_PRICE || 0),
    low: parseFloat(row.LOW || row.LOW_PRICE || 0),
    close: parseFloat(row.CLOSE || row.CLOSE_PRICE || 0),
    volume: parseInt(row.TOTTRDQTY || row.VOLUME || '0', 10),
  }));
}

export function parseCompanyProfile(raw: any, symbol: string): CompanyProfile {
  return {
    symbol: symbol.toUpperCase(),
    name: raw.companyName || raw.symbolInfo || symbol,
    isin: raw.isin || '',
    sector: raw.sector || '',
    industry: raw.industry || '',
    marketCap: raw.marketCapFull || raw.marketCap || 0,
    listingDate: raw.dateOfListing || '',
    isFno: raw.fno === 'Y' || raw.fno === true,
    isEtf: raw.etf === 'Y' || raw.etf === true,
    isDebt: raw.debt === 'Y' || raw.debt === true,
    status: raw.status === 'Active' ? 'Active' : raw.status === 'Suspended' ? 'Suspended' : 'Delisted',
    exchange: 'NSE',
  };
}

export function parseCorporateActions(raw: any[]): CorporateAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    symbol: item.symbol || '',
    companyName: item.companyName || item.symbolInfo || '',
    exDate: item.exDate || '',
    recordDate: item.recordDate || item.recDate || '',
    bcStartDate: item.bcStartDate || item.bcFromDate || '',
    purpose: item.purpose || '',
    actionType: classifyAction(item.purpose || ''),
    details: item.details || '',
    percentage: item.percentage || '',
  }));
}

export function parseAnnouncements(raw: any[]): Announcement[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    symbol: item.symbol || item.symId || '',
    companyName: item.companyName || item.symName || '',
    date: item.anndate || item.annDate || '',
    title: item.secDesc || item.newsTitle || item.headline || '',
    category: item.category || item.catDesc || '',
    subcategory: item.subCategory || item.subCatDesc || '',
    attachmentUrl: item.attchmntFile || item.attachment || '',
    details: item.desc || item.description || item.details || '',
  }));
}

export function parseBoardMeetings(raw: any[]): BoardMeeting[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    symbol: item.symbol || '',
    companyName: item.companyName || '',
    meetingDate: item.meetingDate || item.bmDate || '',
    purpose: item.purpose || '',
    details: item.details || '',
  }));
}

export function parseMarketStatus(raw: any): MarketStatus {
  const segments: MarketSegment[] = (raw.marketState || []).map((s: any) => ({
    segment: s.marketType || s.segment || '',
    status: s.marketStatus || s.tradingStatus || 'Closed',
    time: s.tradeDate || s.time || '',
  }));

  const open = segments.some(s => s.status === 'Open');

  return {
    exchange: 'NSE',
    open,
    segments,
    timestamp: new Date().toISOString(),
  };
}

export function parseIndexData(raw: any, indexName: string): IndexData {
  const data = raw.data || [];
  const idx = data.find((d: any) => d.index === indexName || d.name === indexName);
  if (!idx) {
    return {
      name: indexName,
      current: 0,
      change: 0,
      changePercent: 0,
      open: 0,
      high: 0,
      low: 0,
      previousClose: 0,
      advance: 0,
      decline: 0,
      unchanged: 0,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    name: idx.index || idx.name,
    current: idx.last || idx.current || 0,
    change: idx.variation || idx.change || 0,
    changePercent: idx.pChange || idx.percentChange || 0,
    open: idx.open || 0,
    high: idx.dayHigh || idx.high || 0,
    low: idx.dayLow || idx.low || 0,
    previousClose: idx.previousClose || idx.prevClose || 0,
    advance: idx.advances || 0,
    decline: idx.declines || 0,
    unchanged: idx.unchanged || 0,
    timestamp: idx.timestamp || new Date().toISOString(),
  };
}

export function parseIndices(raw: any): IndexInfo[] {
  const data = raw.data || [];
  return data.map((d: any) => ({
    symbol: d.indexSymbol || d.symbol || '',
    name: d.index || d.name || '',
    fullName: d.indexFullName || d.fullName || '',
  }));
}

export function parseOptionChain(raw: any, symbol: string, expiry?: string): OptionChain {
  const records = raw.records || {};
  const underlying = records.underlyingValue || 0;
  const timestamp = records.timestamp || '';
  const data = records.data || [];

  const filtered = expiry
    ? data.filter((row: any) => row.expiryDates === expiry)
    : data;

  const strike1 = filtered[0]?.strikePrice || 0;
  const strike2 = filtered[1]?.strikePrice || 0;
  const multiple = Math.abs(strike1 - strike2) || 50;

  const atm = multiple * Math.round(underlying / multiple);

  let totalCallOi = 0;
  let totalPutOi = 0;
  let maxCoi = 0;
  let maxPoi = 0;

  const strikes: OptionContract[] = filtered.map((row: any) => {
    const ce = row.CE || {};
    const pe = row.PE || {};
    const coi = ce.openInterest || 0;
    const poi = pe.openInterest || 0;

    totalCallOi += coi;
    totalPutOi += poi;
    if (coi > maxCoi) maxCoi = coi;
    if (poi > maxPoi) maxPoi = poi;

    return {
      strikePrice: row.strikePrice,
      expiry: row.expiryDates,
      callOi: coi,
      callLastPrice: ce.lastPrice || 0,
      callIv: ce.impliedVolatility || 0,
      callChange: ce.change || 0,
      callVolume: ce.totalTradedVolume || 0,
      putOi: poi,
      putLastPrice: pe.lastPrice || 0,
      putIv: pe.impliedVolatility || 0,
      putChange: pe.change || 0,
      putVolume: pe.totalTradedVolume || 0,
    };
  });

  const pcr = totalCallOi ? totalPutOi / totalCallOi : 0;
  const maxPain = calculateMaxPain(filtered, expiry);

  return {
    symbol: symbol.toUpperCase(),
    underlying,
    expiry: expiry || '',
    timestamp,
    atm,
    totalCallOi,
    totalPutOi,
    pcr,
    maxPain,
    strikes,
  };
}

function calculateMaxPain(data: any[], expiryStr?: string): number {
  const filtered = expiryStr
    ? data.filter((r: any) => r.expiryDates === expiryStr)
    : data;

  const ceOi: number[] = [];
  const peOi: number[] = [];
  const strikes: number[] = [];

  for (const row of filtered) {
    ceOi.push(row.CE?.openInterest || 0);
    peOi.push(row.PE?.openInterest || 0);
    strikes.push(row.strikePrice);
  }

  const n = strikes.length;
  if (n === 0) return 0;

  const ceSum = new Array(n).fill(0);
  const peSum = new Array(n).fill(0);
  const ceVal = new Array(n).fill(0);
  const peVal = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    ceSum[i] = (ceSum[i - 1] || 0) + ceOi[i];
    ceVal[i] = (ceVal[i - 1] || 0) + ceOi[i] * strikes[i];
    peSum[i] = (peSum[i - 1] || 0) + peOi[i];
    peVal[i] = (peVal[i - 1] || 0) + peOi[i] * strikes[i];
  }

  let minPayout = Infinity;
  let maxPainStrike = strikes[0];

  for (let i = 0; i < n; i++) {
    const callPain = strikes[i] * ceSum[i] - ceVal[i];
    const putPain = (peVal[n - 1] - peVal[i]) - strikes[i] * (peSum[n - 1] - peSum[i]);
    const totalPain = callPain + putPain;
    if (totalPain < minPayout) {
      minPayout = totalPain;
      maxPainStrike = strikes[i];
    }
  }

  return maxPainStrike;
}

export function parseSearchResults(raw: any): SearchResult[] {
  const symbols = raw.symbols || [];
  return symbols.map((s: any) => ({
    symbol: s.symbol || '',
    name: s.symbol_info || s.companyName || '',
    exchange: 'NSE',
  }));
}

export function parseGainersLosers(raw: any, isGainer: boolean): MarketQuote[] {
  const data = raw.data || [];
  const filtered = data.filter((d: any) =>
    isGainer ? d.pChange > 0 : d.pChange < 0
  );
  const sorted = [...filtered].sort((a, b) =>
    isGainer ? b.pChange - a.pChange : a.pChange - b.pChange
  );

  return sorted.map((d: any) => ({
    symbol: d.symbol || '',
    name: d.companyName || d.symbol || '',
    price: d.ltp || d.lastPrice || 0,
    change: d.variation || d.change || 0,
    changePercent: d.pChange || 0,
    open: 0,
    high: d.dayHigh || 0,
    low: d.dayLow || 0,
    close: d.previousClose || 0,
    volume: d.totalTradedVolume || d.volume || 0,
    marketCap: 0,
    pe: 0,
    dividendYield: 0,
    eps: 0,
    sector: '',
    industry: '',
    week52High: 0,
    week52Low: 0,
    lastUpdate: new Date().toISOString(),
    exchange: 'NSE',
  }));
}

function classifyAction(purpose: string): CorporateAction['actionType'] {
  const upper = (purpose || '').toUpperCase();
  if (upper.includes('DIVIDEND')) return 'DIVIDEND';
  if (upper.includes('BONUS')) return 'BONUS';
  if (upper.includes('SPLIT')) return 'SPLIT';
  if (upper.includes('BUYBACK')) return 'BUYBACK';
  if (upper.includes('RIGHTS')) return 'RIGHTS';
  return 'OTHER';
}
