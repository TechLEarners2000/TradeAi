import type { MarketProvider } from '../providers/provider.interface.js';
import type { MarketQuote, SearchResult } from '../models/market-quote.js';
import type { HistoricalCandle } from '../models/historical.js';
import type { CompanyProfile } from '../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../models/corporate.js';
import type { IndexData, IndexInfo } from '../models/index.js';
import type { OptionChain } from '../models/option-chain.js';
import type { MarketStatus } from '../models/market-status.js';
import { NseProvider } from '../providers/nse/index.js';
import { BseProvider } from '../providers/bse/index.js';
import { logger } from '../utils/logger.js';

export class MarketService implements MarketProvider {
  readonly exchange = 'NSE' as const;
  private readonly nse: NseProvider;
  private readonly bse: BseProvider;

  constructor(nseProvider?: NseProvider, bseProvider?: BseProvider) {
    this.nse = nseProvider || new NseProvider();
    this.bse = bseProvider || new BseProvider();
  }

  async init(): Promise<void> {
    await this.nse.init();
    logger.info('MarketService initialized with NSE + BSE providers');
  }

  async getQuote(symbol: string, preferExchange?: 'NSE' | 'BSE'): Promise<MarketQuote> {
    if (preferExchange === 'BSE') {
      return this.fallbackBse(() => this.bse.getQuote(symbol), () => this.nse.getQuote(symbol));
    }
    return this.fallback(() => this.nse.getQuote(symbol), () => this.bse.getQuote(symbol));
  }

  async getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]> {
    return this.fallback(
      () => this.nse.getHistorical(symbol, fromDate, toDate),
      () => this.bse.getHistorical(symbol, fromDate, toDate),
    );
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    return this.fallback(
      () => this.nse.getCompanyProfile(symbol),
      () => this.bse.getCompanyProfile(symbol),
    );
  }

  async getActions(symbol?: string, fromDate?: string, toDate?: string): Promise<CorporateAction[]> {
    return this.fallback(
      () => this.nse.getActions(symbol, fromDate, toDate),
      () => this.bse.getActions(symbol, fromDate, toDate),
    );
  }

  async getAnnouncements(symbol?: string, fromDate?: string, toDate?: string): Promise<Announcement[]> {
    return this.fallback(
      () => this.nse.getAnnouncements(symbol, fromDate, toDate),
      () => this.bse.getAnnouncements(symbol, fromDate, toDate),
    );
  }

  async getBoardMeetings(symbol?: string, fromDate?: string, toDate?: string): Promise<BoardMeeting[]> {
    return this.fallback(
      () => this.nse.getBoardMeetings(symbol, fromDate, toDate),
      () => this.bse.getBoardMeetings(symbol, fromDate, toDate),
    );
  }

  async getMarketStatus(): Promise<MarketStatus> {
    try {
      return await this.nse.getMarketStatus();
    } catch {
      logger.warn('NSE market status failed, trying BSE');
      return this.bse.getMarketStatus();
    }
  }

  async getIndexData(indexName: string): Promise<IndexData> {
    return this.fallback(
      () => this.nse.getIndexData(indexName),
      () => this.bse.getIndexData(indexName),
    );
  }

  async getIndices(): Promise<IndexInfo[]> {
    return this.fallback(
      () => this.nse.getIndices(),
      () => this.bse.getIndices(),
    );
  }

  async getOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    return this.nse.getOptionChain(symbol, expiry);
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    try {
      const results = await this.nse.searchSymbols(query);
      if (results.length > 0) return results;
    } catch {
      logger.warn('NSE search failed, trying BSE');
    }
    try {
      return await this.bse.searchSymbols(query);
    } catch {
      return [];
    }
  }

  async getGainers(index?: string): Promise<MarketQuote[]> {
    return this.fallback(
      () => this.nse.getGainers(index),
      () => this.bse.getGainers(),
    );
  }

  async getLosers(index?: string): Promise<MarketQuote[]> {
    return this.fallback(
      () => this.nse.getLosers(index),
      () => this.bse.getLosers(),
    );
  }

  // NSE-specific passthroughs
  async getNseQuote(symbol: string): Promise<MarketQuote> {
    return this.nse.getQuote(symbol);
  }

  async getNseOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    return this.nse.getOptionChain(symbol, expiry);
  }

  async getNseFnoLots(): Promise<Record<string, number>> {
    return this.nse.getFnoLots();
  }

  async getNseStocksByIndex(index: string): Promise<MarketQuote[]> {
    return this.nse.getStocksByIndex(index);
  }

  // BSE-specific passthroughs
  async getBseQuote(symbol: string): Promise<MarketQuote> {
    return this.bse.getQuote(symbol);
  }

  async getBse52WeekHL(symbol: string): Promise<any> {
    return this.bse.get52WeekHL(symbol);
  }

  async getBseTradingStats(symbol: string): Promise<any> {
    return this.bse.getTradingStats(symbol);
  }

  private async fallback<T>(primary: () => Promise<T>, secondary: () => Promise<T>): Promise<T> {
    const errors: Error[] = [];
    try {
      return await primary();
    } catch (err) {
      errors.push(err as Error);
      logger.warn({ err }, 'Primary provider failed, trying fallback');
    }
    try {
      return await secondary();
    } catch (err) {
      errors.push(err as Error);
    }
    const messages = errors.map(e => e.message).join('; ');
    throw new Error(`All providers failed: ${messages}`);
  }

  private async fallbackBse<T>(primary: () => Promise<T>, secondary: () => Promise<T>): Promise<T> {
    return this.fallback(primary, secondary);
  }
}
