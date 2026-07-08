import type { MarketProvider } from '../provider.interface.js';
import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { CompanyProfile } from '../../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../../models/corporate.js';
import type { IndexData, IndexInfo } from '../../models/index.js';
import type { OptionChain } from '../../models/option-chain.js';
import type { MarketStatus } from '../../models/market-status.js';
import { UpstoxHttpClient, ConnectionError } from './client.js';
import * as E from './endpoints.js';
import * as P from './parser.js';
import { retry } from '../../utils/retry.js';
import { logger } from '../../utils/logger.js';

interface InstrumentInfo {
  instrumentKey: string;
  symbol: string;
  name: string;
  isin: string;
  segment: string;
}

export class UpstoxProvider implements MarketProvider {
  readonly exchange = 'NSE' as const;
  private readonly http: UpstoxHttpClient;
  private readonly symbolCache = new Map<string, InstrumentInfo>();

  constructor() {
    this.http = new UpstoxHttpClient();
  }

  private async resolveSymbol(symbol: string): Promise<InstrumentInfo> {
    const upper = symbol.toUpperCase();
    const cached = this.symbolCache.get(upper);
    if (cached) return cached;

    const raw = await this.http.get<any>(E.UPSTOX_ENDPOINTS.search, { query: upper });
    const items: any[] = raw.data || [];
    const match = items.find((i: any) =>
      i.segment === 'NSE_EQ' && i.trading_symbol?.toUpperCase() === upper
    );

    if (!match) throw new Error(`Symbol ${symbol} not found on Upstox`);

    const info: InstrumentInfo = {
      instrumentKey: match.instrument_key,
      symbol: match.trading_symbol,
      name: match.name,
      isin: match.isin || '',
      segment: match.segment,
    };

    this.symbolCache.set(upper, info);
    return info;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    return retry(async () => {
      const info = await this.resolveSymbol(symbol);
      const raw = await this.http.get<any>(E.UPSTOX_ENDPOINTS.quotes, {
        instrument_key: info.instrumentKey,
      });
      const errMsg = P.isUpstoxError(raw);
      if (errMsg) throw new ConnectionError(errMsg);
      return P.parseQuote(raw, symbol);
    });
  }

  async getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]> {
    return retry(async () => {
      const info = await this.resolveSymbol(symbol);
      const url = `${E.UPSTOX_ENDPOINTS.historicalCandle}/${info.instrumentKey}/day/${toDate}/${fromDate}`;
      const raw = await this.http.get<any>(url);
      const errMsg = P.isUpstoxError(raw);
      if (errMsg) throw new ConnectionError(errMsg);
      return P.parseHistorical(raw);
    });
  }

  async getCompanyProfile(_symbol: string): Promise<CompanyProfile> {
    throw new Error('Upstox provider does not support company profiles');
  }

  async getActions(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<CorporateAction[]> {
    throw new Error('Upstox provider does not support corporate actions');
  }

  async getAnnouncements(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<Announcement[]> {
    throw new Error('Upstox provider does not support announcements');
  }

  async getBoardMeetings(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<BoardMeeting[]> {
    throw new Error('Upstox provider does not support board meetings');
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const raw = await this.http.get<any>(`${E.UPSTOX_ENDPOINTS.marketStatus}/NSE`);
    const errMsg = P.isUpstoxError(raw);
    if (errMsg) throw new ConnectionError(errMsg);
    return P.parseMarketStatus(raw);
  }

  async getIndexData(_indexName: string): Promise<IndexData> {
    throw new Error('Upstox provider does not support index data');
  }

  async getIndices(): Promise<IndexInfo[]> {
    throw new Error('Upstox provider does not support indices');
  }

  async getOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    return retry(async () => {
      const info = await this.resolveSymbol(symbol);
      const params: Record<string, string | number | boolean> = {
        instrument_key: info.instrumentKey,
      };
      if (expiry) params.expiry_date = expiry;
      const raw = await this.http.get<any>(E.UPSTOX_ENDPOINTS.optionChain, params);
      const errMsg = P.isUpstoxError(raw);
      if (errMsg) throw new ConnectionError(errMsg);
      return P.parseOptionChain(raw, symbol, expiry);
    });
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    const raw = await this.http.get<any>(E.UPSTOX_ENDPOINTS.search, { query });
    const errMsg = P.isUpstoxError(raw);
    if (errMsg) throw new ConnectionError(errMsg);
    return P.parseSearchResults(raw);
  }

  async getGainers(_index?: string): Promise<MarketQuote[]> {
    throw new Error('Upstox provider does not support gainers data');
  }

  async getLosers(_index?: string): Promise<MarketQuote[]> {
    throw new Error('Upstox provider does not support losers data');
  }
}
