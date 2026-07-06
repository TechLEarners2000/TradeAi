import type { MarketQuote, SearchResult } from '../models/market-quote.js';
import type { HistoricalCandle } from '../models/historical.js';
import type { CompanyProfile } from '../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../models/corporate.js';
import type { IndexData, IndexInfo } from '../models/index.js';
import type { OptionChain } from '../models/option-chain.js';
import type { MarketStatus } from '../models/market-status.js';
import { MarketService } from './market.service.js';
import * as cache from './cache.js';

export class CachedMarketService {
  private readonly inner: MarketService;

  constructor(inner?: MarketService) {
    this.inner = inner || new MarketService();
  }

  async init(): Promise<void> {
    await this.inner.init();
  }

  async getQuote(symbol: string, preferExchange?: 'NSE' | 'BSE'): Promise<MarketQuote> {
    const key = `quote:${symbol}:${preferExchange || 'NSE'}`;
    const cached = cache.get<MarketQuote>(key);
    if (cached) return cached;
    const data = await this.inner.getQuote(symbol, preferExchange);
    cache.set(key, data);
    return data;
  }

  async getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]> {
    const key = `hist:${symbol}:${fromDate}:${toDate}`;
    const cached = cache.get<HistoricalCandle[]>(key);
    if (cached) return cached;
    const data = await this.inner.getHistorical(symbol, fromDate, toDate);
    cache.set(key, data, 300_000);
    return data;
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const key = `profile:${symbol}`;
    const cached = cache.get<CompanyProfile>(key);
    if (cached) return cached;
    const data = await this.inner.getCompanyProfile(symbol);
    cache.set(key, data, 300_000);
    return data;
  }

  async getActions(symbol?: string, fromDate?: string, toDate?: string): Promise<CorporateAction[]> {
    const key = `actions:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const cached = cache.get<CorporateAction[]>(key);
    if (cached) return cached;
    const data = await this.inner.getActions(symbol, fromDate, toDate);
    cache.set(key, data, 60_000);
    return data;
  }

  async getAnnouncements(symbol?: string, fromDate?: string, toDate?: string): Promise<Announcement[]> {
    const key = `ann:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const cached = cache.get<Announcement[]>(key);
    if (cached) return cached;
    const data = await this.inner.getAnnouncements(symbol, fromDate, toDate);
    cache.set(key, data, 60_000);
    return data;
  }

  async getBoardMeetings(symbol?: string, fromDate?: string, toDate?: string): Promise<BoardMeeting[]> {
    const key = `bm:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const cached = cache.get<BoardMeeting[]>(key);
    if (cached) return cached;
    const data = await this.inner.getBoardMeetings(symbol, fromDate, toDate);
    cache.set(key, data, 60_000);
    return data;
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const key = 'marketStatus';
    const cached = cache.get<MarketStatus>(key);
    if (cached) return cached;
    const data = await this.inner.getMarketStatus();
    cache.set(key, data, 30_000);
    return data;
  }

  async getIndexData(indexName: string): Promise<IndexData> {
    const key = `index:${indexName}`;
    const cached = cache.get<IndexData>(key);
    if (cached) return cached;
    const data = await this.inner.getIndexData(indexName);
    cache.set(key, data, 60_000);
    return data;
  }

  async getIndices(): Promise<IndexInfo[]> {
    const key = 'indices';
    const cached = cache.get<IndexInfo[]>(key);
    if (cached) return cached;
    const data = await this.inner.getIndices();
    cache.set(key, data, 300_000);
    return data;
  }

  async getOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    const key = `oc:${symbol}:${expiry || 'auto'}`;
    const cached = cache.get<OptionChain>(key);
    if (cached) return cached;
    const data = await this.inner.getOptionChain(symbol, expiry);
    cache.set(key, data, 30_000);
    return data;
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    const key = `search:${query}`;
    const cached = cache.get<SearchResult[]>(key);
    if (cached) return cached;
    const data = await this.inner.searchSymbols(query);
    cache.set(key, data, 60_000);
    return data;
  }

  async getGainers(index?: string): Promise<MarketQuote[]> {
    const key = `gainers:${index || 'NIFTY50'}`;
    const cached = cache.get<MarketQuote[]>(key);
    if (cached) return cached;
    const data = await this.inner.getGainers(index);
    cache.set(key, data, 30_000);
    return data;
  }

  async getLosers(index?: string): Promise<MarketQuote[]> {
    const key = `losers:${index || 'NIFTY50'}`;
    const cached = cache.get<MarketQuote[]>(key);
    if (cached) return cached;
    const data = await this.inner.getLosers(index);
    cache.set(key, data, 30_000);
    return data;
  }

  async getNseOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    return this.inner.getNseOptionChain(symbol, expiry);
  }

  async getNseFnoLots(): Promise<Record<string, number>> {
    return this.inner.getNseFnoLots();
  }

  async getNseStocksByIndex(index: string): Promise<MarketQuote[]> {
    return this.inner.getNseStocksByIndex(index);
  }

  async getBse52WeekHL(symbol: string): Promise<any> {
    return this.inner.getBse52WeekHL(symbol);
  }

  async getBseTradingStats(symbol: string): Promise<any> {
    return this.inner.getBseTradingStats(symbol);
  }
}
