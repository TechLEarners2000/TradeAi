import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { CompanyProfile } from '../../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../../models/corporate.js';
import type { IndexData, IndexInfo } from '../../models/index.js';
import type { MarketStatus, MarketSegment } from '../../models/market-status.js';

export function parseQuote(raw: any, symbol: string): MarketQuote {
  const header = raw.Header || raw;
  const prevClose = parseFloat(header.PrevClose || 0);
  const ltp = parseFloat(header.LTP || header.LastPrice || 0);
  const change = ltp - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    name: header.ScripName || header.symbol || symbol,
    price: ltp,
    change,
    changePercent,
    open: parseFloat(header.Open || 0),
    high: parseFloat(header.High || 0),
    low: parseFloat(header.Low || 0),
    close: prevClose,
    volume: parseInt(header.Volume || header.TotalTradedVolume || '0', 10),
    marketCap: parseFloat(header.MarketCap || header.MarketCapitalisation || 0),
    pe: parseFloat(header.PE || header.PERatio || 0),
    dividendYield: parseFloat(header.DividendYield || 0),
    eps: parseFloat(header.EPS || 0),
    sector: header.Sector || '',
    industry: header.Industry || '',
    week52High: parseFloat(header.High52 || header.Fifty2WkHigh || 0),
    week52Low: parseFloat(header.Low52 || header.Fifty2WkLow || 0),
    lastUpdate: header.UpdateTime || header.LastUpdated || new Date().toISOString(),
    exchange: 'BSE',
  };
}

export function parseHistorical(raw: any): HistoricalCandle[] {
  if (!raw.Data) return [];

  const fields = raw.Data.fields || [];
  const data = raw.Data.data || [];
  const dateIdx = fields.findIndex((f: string) => f.toLowerCase().includes('dttm') || f.toLowerCase() === 'date');
  const openIdx = fields.findIndex((f: string) => f.toLowerCase().includes('open'));
  const highIdx = fields.findIndex((f: string) => f.toLowerCase().includes('high'));
  const lowIdx = fields.findIndex((f: string) => f.toLowerCase().includes('low'));
  const closeIdx = fields.findIndex((f: string) => f.toLowerCase().includes('close') || f === 'vale1');
  const volumeIdx = fields.findIndex((f: string) => f.toLowerCase().includes('vol') || f === 'vole');

  return data.map((row: any[]) => ({
    date: row[dateIdx] || '',
    open: parseFloat(row[openIdx] || 0),
    high: parseFloat(row[highIdx] || 0),
    low: parseFloat(row[lowIdx] || 0),
    close: parseFloat(row[closeIdx] || 0),
    volume: parseInt(row[volumeIdx] || '0', 10),
  }));
}

export function parseCompanyProfile(raw: any, symbol: string, scripCode: string): CompanyProfile {
  return {
    symbol: symbol.toUpperCase(),
    name: raw.companyName || raw.ScripName || symbol,
    isin: raw.ISIN || raw.isin || '',
    sector: raw.Sector || raw.sector || '',
    industry: raw.Industry || raw.industry || '',
    marketCap: parseFloat(raw.MarketCapitalisation || raw.marketCap || 0),
    listingDate: raw.ListingDate || raw.dateOfListing || '',
    isFno: false,
    isEtf: raw.Segment === 'MF' || raw.Segment === 'ETF',
    isDebt: raw.Segment === 'Debt' || raw.Segment === 'Debentures and Bonds',
    status: raw.Status === 'Active' ? 'Active' : raw.Status === 'Suspended' ? 'Suspended' : 'Delisted',
    exchange: 'BSE',
  };
}

export function parseCorporateActions(raw: any[]): CorporateAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    symbol: item.ScripCode || item.scripcode || item.symbol || '',
    companyName: item.ScripName || item.companyName || item.scripName || '',
    exDate: item.ExDate || item.exDate || '',
    recordDate: item.RecDate || item.recordDate || '',
    bcStartDate: item.BcStartDate || item.bcStart || '',
    purpose: item.Purpose || item.purpose || '',
    actionType: classifyAction(item.Purpose || item.purpose || ''),
    details: item.Description || item.details || '',
    percentage: item.Percentage || item.percentage || '',
  }));
}

export function parseAnnouncements(raw: any): Announcement[] {
  const table = raw.Table || [];
  if (!Array.isArray(table)) return [];
  return table.map((item: any) => ({
    symbol: item.ScripCode || item.scripcode || item.symbol || '',
    companyName: item.ScripName || item.companyName || '',
    date: item.NewsDate || item.date || item.AnnDate || '',
    title: item.NewsSub || item.heading || item.title || '',
    category: item.Category || item.category || '',
    subcategory: item.SubCategory || item.subcategory || '',
    attachmentUrl: item.Attachment || item.attachment || item.fileName || '',
    details: item.Details || item.details || item.NewsDetails || '',
  }));
}

export function parseBoardMeetings(raw: any[]): BoardMeeting[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    symbol: item.ScripCode || item.symbol || '',
    companyName: item.ScripName || item.companyName || '',
    meetingDate: item.MeetingDate || item.meetingDate || '',
    purpose: item.Purpose || item.purpose || '',
    details: item.Details || item.details || '',
  }));
}

export function parseMarketStatus(raw: any): MarketStatus {
  const isOpen = raw.marketStatus === 'Open' || raw.Status === 'Open';
  const segments: MarketSegment[] = [{
    segment: 'Equity',
    status: isOpen ? 'Open' : 'Closed',
    time: raw.tradeDate || raw.time || '',
  }];

  return {
    exchange: 'BSE',
    open: isOpen,
    segments,
    timestamp: new Date().toISOString(),
  };
}

export function parseIndexData(raw: any, indexName: string): IndexData {
  const data = Array.isArray(raw) ? raw : (raw.Table || []);
  const idx = data.find((d: any) =>
    d.IndexName === indexName || d.indexName === indexName || d.name === indexName
  );

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
    name: idx.IndexName || idx.name,
    current: parseFloat(idx.Current || idx.Close || idx.last || 0),
    change: parseFloat(idx.Change || idx.variation || 0),
    changePercent: parseFloat(idx.PercentChange || idx.pChange || 0),
    open: parseFloat(idx.Open || 0),
    high: parseFloat(idx.High || idx.DayHigh || 0),
    low: parseFloat(idx.Low || idx.DayLow || 0),
    previousClose: parseFloat(idx.PreviousClose || idx.PrevClose || 0),
    advance: parseInt(idx.Advances || idx.advances || '0', 10),
    decline: parseInt(idx.Declines || idx.declines || '0', 10),
    unchanged: parseInt(idx.Unchanged || idx.unchanged || '0', 10),
    timestamp: idx.Time || idx.timestamp || new Date().toISOString(),
  };
}

export function parseIndices(raw: any): IndexInfo[] {
  const data = Array.isArray(raw) ? raw : [];
  return data.map((d: any) => ({
    symbol: d.IndexName || d.symbol || '',
    name: d.IndexName || d.name || '',
    fullName: d.IndexFullName || d.fullName || '',
  }));
}

export function parseSearchResults(html: string): SearchResult[] {
  // BSE lookup returns HTML with <a> tags containing company info
  // Format: <a>company_name symbol isin bse_code</a>
  const results: SearchResult[] = [];
  const regex = /<a[^>]*>([^<]+)<\/a>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const content = match[1].trim();
    // Split by whitespace but handle multiple spaces
    const parts = content.split(/\s+/).filter(Boolean);
    if (parts.length >= 1) {
      results.push({
        symbol: parts[1] || parts[0],
        name: parts[0],
        exchange: 'BSE',
        isin: parts.length >= 3 ? parts[2] : undefined,
        bseCode: parts.length >= 4 ? parts[3] : undefined,
      });
    }
  }

  return results;
}

export function parseGainersLosers(raw: any): MarketQuote[] {
  const table = raw.Table || [];
  if (!Array.isArray(table)) return [];
  return table.map((d: any) => ({
    symbol: d.ScripCode || d.symbol || '',
    name: d.ScripName || d.companyName || d.symbol || '',
    price: parseFloat(d.LTP || d.LastPrice || 0),
    change: parseFloat(d.Change || d.variation || 0),
    changePercent: parseFloat(d.PercentChange || d.pChange || 0),
    open: 0,
    high: 0,
    low: 0,
    close: parseFloat(d.PrevClose || 0),
    volume: parseInt(d.TradedVolume || d.Volume || '0', 10),
    marketCap: 0,
    pe: 0,
    dividendYield: 0,
    eps: 0,
    sector: '',
    industry: '',
    week52High: 0,
    week52Low: 0,
    lastUpdate: new Date().toISOString(),
    exchange: 'BSE',
  }));
}

export function lookupScripCode(html: string, scripname: string): string | null {
  const upper = scripname.toUpperCase();
  // Pattern: <strong>HDFC</strong>   INE001A01036   500180
  const regex = /<strong>([A-Z0-9]+)<\/strong>\s+(\w+)\s+(\d{6})/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1].toUpperCase() === upper) {
      return match[3];
    }
  }
  return null;
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
