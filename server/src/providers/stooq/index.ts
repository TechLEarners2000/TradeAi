import type { MarketProvider } from '../provider.interface.js';
import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { CompanyProfile } from '../../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../../models/corporate.js';
import type { IndexData, IndexInfo } from '../../models/index.js';
import type { OptionChain } from '../../models/option-chain.js';
import type { MarketStatus, MarketSegment } from '../../models/market-status.js';

const STOOQ_QUOTE_URL = 'https://stooq.com/q/l/';
const STOOQ_HISTORICAL_URL = 'https://stooq.com/q/d/l/';

export class StooqProvider implements MarketProvider {
  readonly exchange = 'NSE' as const;

  private toStooqSymbol(symbol: string): string {
    return symbol.includes('.') ? symbol : `${symbol}.NS`;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const stooqSymbol = this.toStooqSymbol(symbol);
    const url = `${STOOQ_QUOTE_URL}?s=${stooqSymbol}&f=sd2t2ohlcvn&e=csv`;
    const res = await fetch(url);
    const text = await res.text();

    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error(`Stooq: no data for ${symbol}`);

    const cols = lines[1].split(',');
    if (cols.length < 8) throw new Error(`Stooq: malformed response for ${symbol}`);

    const price = parseFloat(cols[3]) || 0;
    const open = parseFloat(cols[4]) || 0;
    const high = parseFloat(cols[5]) || 0;
    const low = parseFloat(cols[6]) || 0;
    const close = parseFloat(cols[7]) || 0;
    const volume = parseInt(cols[8], 10) || 0;
    const name = cols[9]?.trim() || symbol;

    return {
      symbol,
      name,
      price,
      change: price - close,
      changePercent: close ? ((price - close) / close) * 100 : 0,
      open,
      high,
      low,
      close,
      volume,
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
    };
  }

  async getHistorical(symbol: string, _fromDate: string, _toDate: string): Promise<HistoricalCandle[]> {
    const stooqSymbol = this.toStooqSymbol(symbol);
    const url = `${STOOQ_HISTORICAL_URL}?s=${stooqSymbol}&i=d`;
    const res = await fetch(url);
    const text = await res.text();

    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const candles: HistoricalCandle[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length < 6) continue;
      candles.push({
        date: cols[0]?.trim() ?? '',
        open: parseFloat(cols[1]) || 0,
        high: parseFloat(cols[2]) || 0,
        low: parseFloat(cols[3]) || 0,
        close: parseFloat(cols[4]) || 0,
        volume: parseInt(cols[5], 10) || 0,
      });
    }
    return candles;
  }

  async getCompanyProfile(_symbol: string): Promise<CompanyProfile> {
    throw new Error('Stooq provider does not support company profiles');
  }

  async getActions(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<CorporateAction[]> {
    return [];
  }

  async getAnnouncements(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<Announcement[]> {
    return [];
  }

  async getBoardMeetings(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<BoardMeeting[]> {
    return [];
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const day = ist.getDay();
    const hours = ist.getUTCHours();
    const minutes = ist.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;
    const open = day >= 1 && day <= 5 && totalMinutes >= 555 && totalMinutes <= 945;

    const segments: MarketSegment[] = open
      ? [{ segment: 'EQ', status: 'Open', time: now.toISOString() }]
      : [];
    return {
      exchange: 'NSE',
      open,
      segments,
      timestamp: now.toISOString(),
    };
  }

  async getIndexData(_indexName: string): Promise<IndexData> {
    throw new Error('Stooq provider does not support index data');
  }

  async getIndices(): Promise<IndexInfo[]> {
    return [];
  }

  async getOptionChain(_symbol: string, _expiry?: string): Promise<OptionChain> {
    throw new Error('Stooq provider does not support option chain');
  }

  async searchSymbols(_query: string): Promise<SearchResult[]> {
    return [];
  }

  async getGainers(_index?: string): Promise<MarketQuote[]> {
    return [];
  }

  async getLosers(_index?: string): Promise<MarketQuote[]> {
    return [];
  }
}
