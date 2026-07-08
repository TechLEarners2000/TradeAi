import type { MarketQuote, SearchResult } from '../models/market-quote.js';
import type { HistoricalCandle } from '../models/historical.js';
import type { CompanyProfile } from '../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../models/corporate.js';
import type { IndexData, IndexInfo } from '../models/index.js';
import type { OptionChain, OptionContract } from '../models/option-chain.js';
import type { MarketStatus, MarketSegment } from '../models/market-status.js';

export type MockQuote = MarketQuote & {
  dayRange: { low: number; high: number };
  week52Range: { low: number; high: number };
  _mockLoad: true;
};

const now = new Date();
const ts = now.toISOString();

const LOREM = [
  'The company reported strong quarterly results with revenue growing 18% YoY driven by volume expansion and margin improvement.',
  'Management outlined a capex plan of ₹5,000Cr for FY26 focused on capacity expansion and digital transformation.',
  'Analysts remain bullish on the stock citing robust order book and improving working capital cycle.',
  'The board is expected to consider interim dividend in the upcoming meeting scheduled for next month.',
  'Competition from new entrants remains a key monitorable according to the latest brokerage report.',
  'Institutional investors increased their stake by 2.1% in the last quarter reflecting improved confidence.',
  'The company is exploring strategic partnerships in the EV space to diversify its revenue streams.',
  'Regulatory changes in the sector could impact margins in the near term, though long-term outlook remains positive.',
  'Export orders grew 25% QoQ as the company expanded its presence in European and ASEAN markets.',
  'The stock is trading at a premium valuation compared to historical averages, factoring in strong growth expectations.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dayAgo(n = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function toCrore(n: number): number {
  return Math.round(n / 1e7 * 100) / 100;
}

const STOCKS: Array<{
  symbol: string; name: string; price: number; sector: string; industry: string;
  marketCapCr: number; pe: number; eps: number; divYield: number; week52High: number; week52Low: number;
  isFno?: boolean; isin?: string; bseCode?: string;
}> = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2950.45, sector: 'Energy', industry: 'Refineries', marketCapCr: 1985000, pe: 28.4, eps: 104.2, divYield: 0.34, week52High: 3025.00, week52Low: 2200.10, isFno: true, isin: 'INE002A01018', bseCode: '500325' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', price: 3890.20, sector: 'IT', industry: 'Software', marketCapCr: 1420000, pe: 32.1, eps: 121.5, divYield: 1.20, week52High: 4150.00, week52Low: 3310.30, isFno: true, isin: 'INE467B01029', bseCode: '532540' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1680.55, sector: 'Financials', industry: 'Private Bank', marketCapCr: 1280000, pe: 19.8, eps: 85.0, divYield: 0.65, week52High: 1795.00, week52Low: 1360.55, isFno: true, isin: 'INE040A01034', bseCode: '500180' },
  { symbol: 'INFY', name: 'Infosys Ltd', price: 1580.30, sector: 'IT', industry: 'Software', marketCapCr: 680000, pe: 27.5, eps: 57.8, divYield: 1.80, week52High: 1705.00, week52Low: 1320.40, isFno: true, isin: 'INE009A01021', bseCode: '500209' },
  { symbol: 'ITC', name: 'ITC Ltd', price: 440.15, sector: 'FMCG', industry: 'Diversified', marketCapCr: 550000, pe: 24.2, eps: 18.2, divYield: 2.50, week52High: 470.50, week52Low: 388.65, isFno: true, isin: 'INE154A01025', bseCode: '500875' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 780.40, sector: 'Financials', industry: 'Public Bank', marketCapCr: 700000, pe: 10.5, eps: 74.5, divYield: 1.80, week52High: 840.00, week52Low: 540.30, isFno: true, isin: 'INE062A01020', bseCode: '500112' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1120.25, sector: 'Financials', industry: 'Private Bank', marketCapCr: 790000, pe: 18.5, eps: 60.8, divYield: 0.70, week52High: 1180.00, week52Low: 920.15, isFno: true, isin: 'INE090A01021', bseCode: '532174' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1350.60, sector: 'Telecom', industry: 'Telecom Services', marketCapCr: 750000, pe: 45.2, eps: 29.8, divYield: 0.40, week52High: 1420.00, week52Low: 850.50, isFno: true, isin: 'INE397D01024', bseCode: '532454' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', price: 1780.90, sector: 'Financials', industry: 'Private Bank', marketCapCr: 355000, pe: 22.5, eps: 79.5, divYield: 0.45, week52High: 1920.00, week52Low: 1480.00, isFno: true, isin: 'INE237A01028', bseCode: '500247' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', price: 6950.00, sector: 'Financials', industry: 'NBFC', marketCapCr: 420000, pe: 30.2, eps: 230.0, divYield: 0.55, week52High: 7300.00, week52Low: 5400.00, isFno: true, isin: 'INE296A01024', bseCode: '500034' },
];

const ALL_STOCKS = STOCKS.map(s => ({ symbol: s.symbol, name: s.name }));

const FNO_LOTS: Record<string, number> = {
  RELIANCE: 250, TCS: 150, HDFCBANK: 500, INFY: 400, ITC: 3000,
  SBIN: 2000, ICICIBANK: 1500, BHARTIARTL: 500, KOTAKBANK: 500, BAJFINANCE: 125,
  WIPRO: 2000, HCLTECH: 1000, LT: 500, ASIANPAINT: 300, MARUTI: 100,
  TATAMOTORS: 2000, TITAN: 300, SUNPHARMA: 1000, ULTRACEMCO: 250, NTPC: 5000,
};

const INDICES_LIST: IndexInfo[] = [
  { symbol: 'NIFTY50', name: 'NIFTY 50', fullName: 'Nifty 50 Index' },
  { symbol: 'BANKNIFTY', name: 'BANK NIFTY', fullName: 'Nifty Bank Index' },
  { symbol: 'SENSEX', name: 'SENSEX', fullName: 'BSE SENSEX' },
  { symbol: 'NIFTYIT', name: 'NIFTY IT', fullName: 'Nifty IT Index' },
  { symbol: 'NIFTYAUTO', name: 'NIFTY AUTO', fullName: 'Nifty Auto Index' },
  { symbol: 'NIFTYENERGY', name: 'NIFTY ENERGY', fullName: 'Nifty Energy Index' },
  { symbol: 'NIFTYFMCG', name: 'NIFTY FMCG', fullName: 'Nifty FMCG Index' },
  { symbol: 'NIFTYPHARMA', name: 'NIFTY PHARMA', fullName: 'Nifty Pharma Index' },
  { symbol: 'NIFTYPSU', name: 'NIFTY PSU', fullName: 'Nifty PSU Bank Index' },
  { symbol: 'NIFTYMID100', name: 'NIFTY MID 100', fullName: 'Nifty Midcap 100 Index' },
];

function baseQuote(s: typeof STOCKS[number]): MockQuote {
  const open = s.price * (1 + (Math.random() - 0.5) * 0.02);
  const change = s.price - open;
  const changePercent = (change / open) * 100;
  const high = s.price * (1 + Math.random() * 0.01);
  const low = s.price * (1 - Math.random() * 0.01);
  const volume = Math.floor(Math.random() * 20000000) + 500000;
  return {
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: s.price,
    volume,
    marketCap: toCrore(s.marketCapCr * 1e7),
    pe: s.pe,
    dividendYield: s.divYield,
    eps: s.eps,
    sector: s.sector,
    industry: s.industry,
    week52High: s.week52High,
    week52Low: s.week52Low,
    lastUpdate: ts,
    exchange: 'NSE',
    dayRange: { low: Math.round(low * 100) / 100, high: Math.round(high * 100) / 100 },
    week52Range: { low: s.week52Low, high: s.week52High },
    _mockLoad: true,
  };
}

export function getMockQuote(symbol?: string): MockQuote {
  const s = STOCKS.find(st => st.symbol === (symbol || '').toUpperCase()) || STOCKS[0];
  return baseQuote(s);
}

export function getMockBatchQuotes(symbols?: string[]): MockQuote[] {
  const list = symbols?.length
    ? symbols.map(s => STOCKS.find(st => st.symbol === s.toUpperCase())).filter(Boolean) as typeof STOCKS
    : STOCKS;
  return list.map(baseQuote);
}

export function getMockGainers(): MockQuote[] {
  return [...STOCKS].sort(() => Math.random() - 0.5).slice(0, 5).map(baseQuote);
}

export function getMockLosers(): MockQuote[] {
  return [...STOCKS].sort(() => Math.random() - 0.5).slice(0, 5).map(baseQuote);
}

export function getMockSearch(query: string): SearchResult[] {
  const q = query.toLowerCase();
  return STOCKS
    .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    .slice(0, 10)
    .map(s => ({
      symbol: s.symbol,
      name: s.name,
      exchange: 'NSE',
      isin: s.isin,
      bseCode: s.bseCode,
    }));
}

export function getMockHistorical(_symbol?: string): HistoricalCandle[] {
  const candles: HistoricalCandle[] = [];
  let px = STOCKS[0].price;
  for (let i = 30; i >= 0; i--) {
    const changePct = (Math.random() - 0.5) * 0.04;
    const open = px;
    const close = px * (1 + changePct);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    candles.push({
      date: dayAgo(i),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 15000000) + 1000000,
    });
    px = close;
  }
  return candles;
}

export function getMockCompanyProfile(symbol?: string): CompanyProfile & { _mockLoad: true } {
  const s = STOCKS.find(st => st.symbol === (symbol || '').toUpperCase()) || STOCKS[0];
  return {
    symbol: s.symbol,
    name: s.name,
    isin: s.isin || 'INE000A01000',
    sector: s.sector,
    industry: s.industry,
    marketCap: toCrore(s.marketCapCr * 1e7),
    listingDate: '2000-01-01',
    isFno: s.isFno || false,
    isEtf: false,
    isDebt: false,
    status: 'Active',
    exchange: 'NSE',
    _mockLoad: true,
  };
}

export function getMockCorporateActions(symbol?: string): CorporateAction[] {
  const sym = (symbol || '').toUpperCase();
  const stocks = sym ? STOCKS.filter(s => s.symbol === sym).slice(0, 1) : STOCKS.slice(0, 5);
  return stocks.map(s => ({
    symbol: s.symbol,
    companyName: s.name,
    exDate: dayAgo(Math.floor(Math.random() * 30) + 1),
    recordDate: dayAgo(Math.floor(Math.random() * 25)),
    bcStartDate: dayAgo(Math.floor(Math.random() * 20)),
    purpose: 'Interim Dividend',
    actionType: 'DIVIDEND' as const,
    details: `Interim Dividend of ₹${(Math.random() * 20 + 2).toFixed(1)} per share`,
    percentage: `${(Math.random() * 100 + 50).toFixed(0)}%`,
  }));
}

export function getMockAnnouncements(symbol?: string): Announcement[] {
  const sym = (symbol || '').toUpperCase();
  const stocks = sym ? STOCKS.filter(s => s.symbol === sym).slice(0, 1) : STOCKS.slice(0, 5);
  return stocks.map(s => ({
    symbol: s.symbol,
    companyName: s.name,
    date: dayAgo(Math.floor(Math.random() * 14)),
    title: `${s.symbol} - ${pick(['Board Meeting Intimation', 'Earnings Update', 'Investor Conference', 'Credit Rating Revision', 'Scheme of Arrangement'])}`,
    category: pick(['Board Meeting', 'Earnings', 'Corporate', 'Rating', 'Restructuring']),
    subcategory: pick(['Outcome', 'Update', 'Announcement']),
    attachmentUrl: '',
    details: pick(LOREM),
  }));
}

export function getMockBoardMeetings(symbol?: string): BoardMeeting[] {
  const sym = (symbol || '').toUpperCase();
  const stocks = sym ? STOCKS.filter(s => s.symbol === sym).slice(0, 1) : STOCKS.slice(0, 5);
  return stocks.map(s => ({
    symbol: s.symbol,
    companyName: s.name,
    meetingDate: dayAgo(Math.floor(Math.random() * 20) + 5),
    purpose: pick(['Quarterly Results', 'Dividend Declaration', 'Fund Raising', 'Stock Split', 'Buyback']),
    details: pick(LOREM),
  }));
}

export function getMockMarketStatus(): MarketStatus & { _mockLoad: true } {
  const segments: MarketSegment[] = [
    { segment: 'Equity Cash', status: 'Open', time: ts },
    { segment: 'Equity Derivatives', status: 'Open', time: ts },
    { segment: 'Currency Derivatives', status: 'Open', time: ts },
    { segment: 'Commodity Derivatives', status: 'Open', time: ts },
    { segment: 'Mutual Funds', status: 'Open', time: ts },
    { segment: 'Pre-Open', status: 'Closed', time: dayAgo() },
  ];
  return {
    exchange: 'NSE',
    open: true,
    segments,
    timestamp: ts,
    _mockLoad: true,
  };
}

const INDEX_MAP: Record<string, { current: number; prevClose: number }> = {
  NIFTY50: { current: 22453.15, prevClose: 22352.10 },
  BANKNIFTY: { current: 47891.45, prevClose: 47821.30 },
  SENSEX: { current: 73894.20, prevClose: 73501.50 },
  NIFTYIT: { current: 34512.20, prevClose: 34010.55 },
  NIFTYAUTO: { current: 20118.65, prevClose: 20220.10 },
  NIFTYENERGY: { current: 28944.10, prevClose: 28280.00 },
  NIFTYFMCG: { current: 56120.30, prevClose: 55800.45 },
  NIFTYPHARMA: { current: 19234.80, prevClose: 19450.00 },
  NIFTYPSU: { current: 6820.55, prevClose: 6700.30 },
  NIFTYMID100: { current: 38120.40, prevClose: 38001.20 },
};

export function getMockIndexData(indexName: string): IndexData & { _mockLoad: true } {
  const info = INDEX_MAP[indexName.toUpperCase()] || INDEX_MAP.NIFTY50;
  const change = info.current - info.prevClose;
  const changePercent = (change / info.prevClose) * 100;
  return {
    name: indexName.toUpperCase(),
    current: info.current,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    open: info.prevClose * (1 + (Math.random() - 0.5) * 0.005),
    high: info.current * (1 + Math.random() * 0.003),
    low: info.prevClose * (1 - Math.random() * 0.003),
    previousClose: info.prevClose,
    advance: Math.floor(Math.random() * 800 + 500),
    decline: Math.floor(Math.random() * 600 + 300),
    unchanged: Math.floor(Math.random() * 100 + 20),
    timestamp: ts,
    _mockLoad: true,
  };
}

export function getMockIndices(): (IndexInfo & { _mockLoad: true })[] {
  return INDICES_LIST.map(i => ({ ...i, _mockLoad: true }));
}

function generateOptionStrikes(underlying: number, spot: number): OptionContract[] {
  const atm = Math.round(spot / 50) * 50;
  const strikes: OptionContract[] = [];
  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * 50;
    if (strike <= 0) continue;
    const isITM = strike < spot;
    strikes.push({
      strikePrice: strike,
      expiry: dayAgo(-23),
      callOi: Math.floor(Math.random() * 5000000 + 100000),
      callLastPrice: isITM ? Math.round((spot - strike) * 10) / 10 : Math.round(Math.random() * 50 * 10) / 10,
      callIv: Math.round((Math.random() * 20 + 10) * 100) / 100,
      callChange: Math.round((Math.random() - 0.5) * 20 * 10) / 10,
      callVolume: Math.floor(Math.random() * 200000 + 5000),
      putOi: Math.floor(Math.random() * 5000000 + 100000),
      putLastPrice: isITM ? 0 : Math.round((strike - spot) * 10) / 10,
      putIv: Math.round((Math.random() * 20 + 10) * 100) / 100,
      putChange: Math.round((Math.random() - 0.5) * 20 * 10) / 10,
      putVolume: Math.floor(Math.random() * 200000 + 5000),
    });
  }
  return strikes;
}

export function getMockOptionChain(symbol?: string): OptionChain & { _mockLoad: true } {
  const s = STOCKS.find(st => st.symbol === (symbol || '').toUpperCase()) || STOCKS[0];
  const spot = s.price;
  const strikes = generateOptionStrikes(spot, spot);
  const totalCallOi = strikes.reduce((a, c) => a + c.callOi, 0);
  const totalPutOi = strikes.reduce((a, c) => a + c.putOi, 0);
  return {
    symbol: s.symbol,
    underlying: spot,
    expiry: dayAgo(-23),
    timestamp: ts,
    atm: Math.round(spot / 50) * 50,
    totalCallOi,
    totalPutOi,
    pcr: Math.round((totalPutOi / totalCallOi) * 100) / 100,
    maxPain: Math.round(spot * 0.98),
    strikes,
    _mockLoad: true,
  };
}

export function getMockStockList(): Array<{ symbol: string; name: string }> {
  return ALL_STOCKS;
}

export function getMockFnoLots(): Record<string, number> {
  return FNO_LOTS;
}

export function getMockNseStocksByIndex(_index: string): MockQuote[] {
  return STOCKS.slice(0, 15).map(baseQuote);
}

export function getMockChatReply(messages: Array<{ role: string; content: string }>): { reply: string } {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const context = lastMsg.toLowerCase();
  let reply: string;
  if (context.includes('compare') || context.includes('vs')) {
    reply = `**Comparative Analysis 📊**

Based on recent market data and fundamentals:

| Metric | RELIANCE | TCS | HDFCBANK |
|--------|----------|-----|----------|
| CMP (₹) | 2,950.45 | 3,890.20 | 1,680.55 |
| P/E | 28.4 | 32.1 | 19.8 |
| EPS (₹) | 104.2 | 121.5 | 85.0 |
| Div Yield | 0.34% | 1.20% | 0.65% |
| Market Cap | ₹19.8L Cr | ₹14.2L Cr | ₹12.8L Cr |

**Verdict:** ${STOCKS[0].name} offers the best dividend-adjusted growth at current levels with strong energy and retail tailwinds.`;
  } else if (context.includes('drop') || context.includes('down') || context.includes('fall')) {
    reply = `**Market Movement Analysis 📉**

The recent decline appears driven by:
1. **Global cues** — Weakness in US markets triggered selling
2. **FII outflows** — Foreign investors pulled ₹2,100Cr in the last session
3. **Technical resistance** — Nifty faced selling near 22,600 levels

**Support levels:** 22,300 → 22,100 → 21,800
**Key event:** RBI policy decision this Thursday

*Trade cautiously with strict stop-losses in the current volatile environment.*`;
  } else if (context.includes('dividend') || context.includes('dividend')) {
    reply = `**Top Dividend Stocks for Passive Income 💰**

| Stock | Dividend Yield | Payout Ratio | 5Y CAGR |
|------|:-------:|:------:|:------:|
| ITC | 2.50% | 65% | 12% |
| HINDUNILVR | 1.80% | 80% | 14% |
| ONGC | 4.20% | 50% | 9% |
| COALINDIA | 5.10% | 48% | 11% |
| POWERGRID | 3.20% | 55% | 13% |

**Recommendation:** ITC offers the best combination of yield and growth. Use the DRIP (Dividend Reinvestment Plan) for compounding.`;
  } else {
    reply = `**Analysis Summary for ${STOCKS[0].symbol} 🔍**

**Current Price:** ₹${STOCKS[0].price} | **P/E:** ${STOCKS[0].pe} | **Sector:** ${STOCKS[0].sector}

**Key Highlights:**
• Quarterly revenue grew 18% YoY with margin expansion of 120bps
• Strong FII buying worth ₹850Cr in the last week
• Technical indicators suggest bullish momentum with RSI at 62
• Support at ₹2,880 | Resistance at ₹3,020

**Analyst Consensus:** 18 Buy, 5 Hold, 2 Sell | Target: ₹3,180

*⚠️ This is educational analysis based on mock data. Not financial advice.*`;
  }
  return { reply };
}

export function getMockPrediction(_prices: number[]): { prediction: Array<{ date: string; price: number; upperBand: number; lowerBand: number }> } {
  const base = STOCKS[0].price;
  const pred = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const drift = base * (1 + i * 0.002);
    const noise = (Math.random() - 0.5) * base * 0.02;
    const price = Math.round((drift + noise) * 100) / 100;
    const band = base * 0.03;
    pred.push({
      date: d.toISOString().split('T')[0],
      price,
      upperBand: Math.round((price + band) * 100) / 100,
      lowerBand: Math.round((price - band) * 100) / 100,
    });
  }
  return { prediction: pred };
}
