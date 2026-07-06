import type { MarketProvider } from '../provider.interface.js';
import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { CompanyProfile } from '../../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../../models/corporate.js';
import type { IndexData, IndexInfo } from '../../models/index.js';
import type { OptionChain } from '../../models/option-chain.js';
import type { MarketStatus } from '../../models/market-status.js';
import { NseHttpClient } from './client.js';
import * as E from './endpoints.js';
import * as P from './parser.js';
import { retry } from '../../utils/retry.js';
import { logger } from '../../utils/logger.js';

export class NseProvider implements MarketProvider {
  readonly exchange = 'NSE' as const;
  private readonly http: NseHttpClient;

  constructor() {
    this.http = new NseHttpClient();
  }

  async init(): Promise<void> {
    await this.http.initCookies();
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    return retry(async () => {
      const raw = await this.http.get<any>(E.NSE_ENDPOINTS.getQuoteData, {
        symbol: symbol.toUpperCase(),
      });
      return P.parseQuote(raw, symbol);
    });
  }

  async getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]> {
    return retry(async () => {
      const raw = await this.http.get<{ data: any[] }>(`${E.NSE_ENDPOINTS.equityHistorical}`, {
        symbol: symbol.toUpperCase(),
        from: fromDate,
        to: toDate,
        series: 'EQ',
      });
      return P.parseHistorical(raw.data || []);
    });
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    return retry(async () => {
      const raw = await this.http.get<any>(E.NSE_ENDPOINTS.equityMetaInfo, {
        symbol: symbol.toUpperCase(),
      });
      return P.parseCompanyProfile(raw, symbol);
    });
  }

  async getActions(symbol?: string, fromDate?: string, toDate?: string): Promise<CorporateAction[]> {
    return retry(async () => {
      const params: Record<string, string | number | boolean> = { index: 'equities' };
      if (symbol) params.symbol = symbol;
      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      }
      const raw = await this.http.get<any[]>(E.NSE_ENDPOINTS.corporateActions, params);
      return P.parseCorporateActions(raw);
    });
  }

  async getAnnouncements(symbol?: string, fromDate?: string, toDate?: string): Promise<Announcement[]> {
    return retry(async () => {
      const params: Record<string, string | number | boolean> = { index: 'equities' };
      if (symbol) params.symbol = symbol;
      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      }
      const raw = await this.http.get<any[]>(E.NSE_ENDPOINTS.corporateAnnouncements, params);
      return P.parseAnnouncements(raw);
    });
  }

  async getBoardMeetings(symbol?: string, fromDate?: string, toDate?: string): Promise<BoardMeeting[]> {
    return retry(async () => {
      const params: Record<string, string | number | boolean> = { index: 'equities' };
      if (symbol) params.symbol = symbol;
      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      }
      const raw = await this.http.get<any[]>(E.NSE_ENDPOINTS.boardMeetings, params);
      return P.parseBoardMeetings(raw);
    });
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const raw = await this.http.get<any>(E.NSE_ENDPOINTS.marketStatus);
    return P.parseMarketStatus(raw);
  }

  async getIndexData(indexName: string): Promise<IndexData> {
    const raw = await this.http.get<any>(E.NSE_ENDPOINTS.allIndices);
    return P.parseIndexData(raw, indexName);
  }

  async getIndices(): Promise<IndexInfo[]> {
    const raw = await this.http.get<any>(E.NSE_ENDPOINTS.allIndices);
    return P.parseIndices(raw);
  }

  async getOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    return retry(async () => {
      const isIndex = ['banknifty', 'nifty', 'finnifty', 'niftyit'].includes(symbol.toLowerCase());
      const params: Record<string, string | number | boolean> = {
        symbol: symbol.toUpperCase(),
        type: isIndex ? 'Indices' : 'Equity',
      };
      if (expiry) params.expiry = expiry;

      const raw = await this.http.get<any>(E.NSE_ENDPOINTS.optionChainV3, params);
      return P.parseOptionChain(raw, symbol, expiry);
    });
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    const raw = await this.http.get<any>(E.NSE_ENDPOINTS.searchAutocomplete, { q: query });
    return P.parseSearchResults(raw);
  }

  async getGainers(index?: string): Promise<MarketQuote[]> {
    const raw = await this.http.get<any>(E.NSE_ENDPOINTS.equityStockIndices, {
      index: (index || 'NIFTY 50').toUpperCase(),
    });
    return P.parseGainersLosers(raw, true);
  }

  async getLosers(index?: string): Promise<MarketQuote[]> {
    const raw = await this.http.get<any>(E.NSE_ENDPOINTS.equityStockIndices, {
      index: (index || 'NIFTY 50').toUpperCase(),
    });
    return P.parseGainersLosers(raw, false);
  }

  async getStocksByIndex(index: string): Promise<MarketQuote[]> {
    const isFnO = ['SECURITIES IN F&O', 'PERMITTED TO TRADE'].includes(index.toUpperCase());
    const endpoint = isFnO ? E.NSE_ENDPOINTS.equityStockIndex : E.NSE_ENDPOINTS.equityStockIndices;
    const raw = await this.http.get<any>(endpoint, { index: index.toUpperCase() });
    return P.parseGainersLosers(raw, true).concat(P.parseGainersLosers(raw, false));
  }

  async getFnoLots(): Promise<Record<string, number>> {
    const csvText = await this.http.get<string>(E.NSE_ENDPOINTS.fnoLots);
    const lines = csvText.trim().split('\n');
    const result: Record<string, number> = {};
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        const sym = parts[1]?.trim();
        const lot = parseInt(parts[2]?.trim(), 10);
        if (sym && !isNaN(lot)) result[sym] = lot;
      }
    }
    return result;
  }
}
