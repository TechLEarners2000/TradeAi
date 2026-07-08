import type { MarketProvider } from '../providers/provider.interface.js';
import type { MarketQuote, SearchResult } from '../models/market-quote.js';
import type { HistoricalCandle } from '../models/historical.js';
import type { CompanyProfile } from '../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../models/corporate.js';
import type { IndexData, IndexInfo } from '../models/index.js';
import type { OptionChain } from '../models/option-chain.js';
import type { MarketStatus } from '../models/market-status.js';
import { UpstoxProvider } from '../providers/upstox/index.js';
import { NseProvider } from '../providers/nse/index.js';
import { BseProvider } from '../providers/bse/index.js';
import { YahooProvider } from '../providers/yahoo/index.js';
import { StooqProvider } from '../providers/stooq/index.js';
import { config } from '../config/index.js';
import { CircuitBreaker, CircuitOpenError } from '../utils/circuit-breaker.js';
import * as cache from './cache.js';
import { logger } from '../utils/logger.js';

interface ProviderEntry<T> {
  name: string;
  fn: () => Promise<T>;
}

const CIRCUIT_OPTIONS = {
  failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '3', 10),
  resetTimeoutMs: parseInt(process.env.CIRCUIT_BREAKER_RESET_MS || '30000', 10),
};

export class ProviderChain implements MarketProvider {
  readonly exchange = 'NSE' as const;
  private readonly upstox: UpstoxProvider;
  private readonly nse: NseProvider;
  private readonly bse: BseProvider;
  private readonly yahoo: YahooProvider;
  private readonly stooq: StooqProvider;
  private readonly circuits = new Map<string, CircuitBreaker>();
  private readonly upstoxEnabled: boolean;

  constructor(
    upstoxProvider?: UpstoxProvider,
    nseProvider?: NseProvider,
    bseProvider?: BseProvider,
    yahooProvider?: YahooProvider,
    stooqProvider?: StooqProvider,
  ) {
    this.upstoxEnabled = config.upstox.enabled && !!config.upstox.accessToken;
    this.upstox = upstoxProvider || (this.upstoxEnabled ? new UpstoxProvider() : null as any);
    this.nse = nseProvider || new NseProvider();
    this.bse = bseProvider || new BseProvider();
    this.yahoo = yahooProvider || new YahooProvider();
    this.stooq = stooqProvider || new StooqProvider();
  }

  async init(): Promise<void> {
    await this.nse.init();
    const order = this.upstoxEnabled ? 'Upstox → NSE → BSE → Yahoo → Stooq' : 'NSE → BSE → Yahoo → Stooq';
    logger.info(`ProviderChain initialized: ${order}`);
  }

  private hasUpstox(): boolean {
    return this.upstoxEnabled && !!this.upstox;
  }

  async getQuote(symbol: string, preferExchange?: 'NSE' | 'BSE'): Promise<MarketQuote> {
    const key = `quote:${symbol}:${preferExchange || 'NSE'}`;
    const cached = cache.get<MarketQuote>(key);
    if (cached) return cached;

    const providers: ProviderEntry<MarketQuote>[] = preferExchange === 'BSE'
      ? [
          { name: 'bse:getQuote', fn: () => this.bse.getQuote(symbol) },
          { name: 'nse:getQuote', fn: () => this.nse.getQuote(symbol) },
          { name: 'yahoo:getQuote', fn: () => this.yahoo.getQuote(symbol) },
          { name: 'stooq:getQuote', fn: () => this.stooq.getQuote(symbol) },
        ]
      : [
          ...(this.hasUpstox() ? [{ name: 'upstox:getQuote', fn: () => this.upstox.getQuote(symbol) } as ProviderEntry<MarketQuote>] : []),
          { name: 'nse:getQuote', fn: () => this.nse.getQuote(symbol) },
          { name: 'bse:getQuote', fn: () => this.bse.getQuote(symbol) },
          { name: 'yahoo:getQuote', fn: () => this.yahoo.getQuote(symbol) },
          { name: 'stooq:getQuote', fn: () => this.stooq.getQuote(symbol) },
        ];

    const data = await this.runChain(providers);
    cache.set(key, data);
    return data;
  }

  async getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]> {
    const key = `hist:${symbol}:${fromDate}:${toDate}`;
    const cached = cache.get<HistoricalCandle[]>(key);
    if (cached) return cached;

    const providers: ProviderEntry<HistoricalCandle[]>[] = [
      ...(this.hasUpstox() ? [{ name: 'upstox:getHistorical', fn: () => this.upstox.getHistorical(symbol, fromDate, toDate) } as ProviderEntry<HistoricalCandle[]>] : []),
      { name: 'nse:getHistorical', fn: () => this.nse.getHistorical(symbol, fromDate, toDate) },
      { name: 'bse:getHistorical', fn: () => this.bse.getHistorical(symbol, fromDate, toDate) },
      { name: 'yahoo:getHistorical', fn: () => this.yahoo.getHistorical(symbol, fromDate, toDate) },
      { name: 'stooq:getHistorical', fn: () => this.stooq.getHistorical(symbol, fromDate, toDate) },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 300_000);
    return data;
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const key = `profile:${symbol}`;
    const cached = cache.get<CompanyProfile>(key);
    if (cached) return cached;

    const providers: ProviderEntry<CompanyProfile>[] = [
      { name: 'nse:getCompanyProfile', fn: () => this.nse.getCompanyProfile(symbol) },
      { name: 'bse:getCompanyProfile', fn: () => this.bse.getCompanyProfile(symbol) },
      { name: 'yahoo:getCompanyProfile', fn: () => this.yahoo.getCompanyProfile(symbol) },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 300_000);
    return data;
  }

  async getActions(symbol?: string, fromDate?: string, toDate?: string): Promise<CorporateAction[]> {
    const key = `actions:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const cached = cache.get<CorporateAction[]>(key);
    if (cached) return cached;

    const providers: ProviderEntry<CorporateAction[]>[] = [
      { name: 'nse:getActions', fn: () => this.nse.getActions(symbol, fromDate, toDate) },
      { name: 'bse:getActions', fn: () => this.bse.getActions(symbol, fromDate, toDate) },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 60_000);
    return data;
  }

  async getAnnouncements(symbol?: string, fromDate?: string, toDate?: string): Promise<Announcement[]> {
    const key = `ann:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const cached = cache.get<Announcement[]>(key);
    if (cached) return cached;

    const providers: ProviderEntry<Announcement[]>[] = [
      { name: 'nse:getAnnouncements', fn: () => this.nse.getAnnouncements(symbol, fromDate, toDate) },
      { name: 'bse:getAnnouncements', fn: () => this.bse.getAnnouncements(symbol, fromDate, toDate) },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 60_000);
    return data;
  }

  async getBoardMeetings(symbol?: string, fromDate?: string, toDate?: string): Promise<BoardMeeting[]> {
    const key = `bm:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const cached = cache.get<BoardMeeting[]>(key);
    if (cached) return cached;

    const providers: ProviderEntry<BoardMeeting[]>[] = [
      { name: 'nse:getBoardMeetings', fn: () => this.nse.getBoardMeetings(symbol, fromDate, toDate) },
      { name: 'bse:getBoardMeetings', fn: () => this.bse.getBoardMeetings(symbol, fromDate, toDate) },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 60_000);
    return data;
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const key = 'marketStatus';
    const cached = cache.get<MarketStatus>(key);
    if (cached) return cached;

    const providers: ProviderEntry<MarketStatus>[] = [
      ...(this.hasUpstox() ? [{ name: 'upstox:getMarketStatus', fn: () => this.upstox.getMarketStatus() } as ProviderEntry<MarketStatus>] : []),
      { name: 'nse:getMarketStatus', fn: () => this.nse.getMarketStatus() },
      { name: 'bse:getMarketStatus', fn: () => this.bse.getMarketStatus() },
      { name: 'yahoo:getMarketStatus', fn: () => this.yahoo.getMarketStatus() },
      { name: 'stooq:getMarketStatus', fn: () => this.stooq.getMarketStatus() },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 30_000);
    return data;
  }

  async getIndexData(indexName: string): Promise<IndexData> {
    const key = `index:${indexName}`;
    const cached = cache.get<IndexData>(key);
    if (cached) return cached;

    const providers: ProviderEntry<IndexData>[] = [
      { name: 'nse:getIndexData', fn: () => this.nse.getIndexData(indexName) },
      { name: 'bse:getIndexData', fn: () => this.bse.getIndexData(indexName) },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 60_000);
    return data;
  }

  async getIndices(): Promise<IndexInfo[]> {
    const key = 'indices';
    const cached = cache.get<IndexInfo[]>(key);
    if (cached) return cached;

    const providers: ProviderEntry<IndexInfo[]>[] = [
      { name: 'nse:getIndices', fn: () => this.nse.getIndices() },
      { name: 'bse:getIndices', fn: () => this.bse.getIndices() },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 300_000);
    return data;
  }

  async getOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    const key = `oc:${symbol}:${expiry || 'auto'}`;
    const cached = cache.get<OptionChain>(key);
    if (cached) return cached;

    const providers: ProviderEntry<OptionChain>[] = [
      ...(this.hasUpstox() ? [{ name: 'upstox:getOptionChain', fn: () => this.upstox.getOptionChain(symbol, expiry) } as ProviderEntry<OptionChain>] : []),
      { name: 'nse:getOptionChain', fn: () => this.nse.getOptionChain(symbol, expiry) },
    ];

    const data = await this.runChain(providers);
    cache.set(key, data, 30_000);
    return data;
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    const providers: ProviderEntry<SearchResult[]>[] = [
      ...(this.hasUpstox() ? [{ name: 'upstox:searchSymbols', fn: () => this.upstox.searchSymbols(query) } as ProviderEntry<SearchResult[]>] : []),
      { name: 'nse:searchSymbols', fn: () => this.nse.searchSymbols(query) },
      { name: 'bse:searchSymbols', fn: () => this.bse.searchSymbols(query) },
      { name: 'yahoo:searchSymbols', fn: () => this.yahoo.searchSymbols(query) },
    ];

    return this.runChain(providers);
  }

  async getGainers(index?: string): Promise<MarketQuote[]> {
    const providers: ProviderEntry<MarketQuote[]>[] = [
      { name: 'nse:getGainers', fn: () => this.nse.getGainers(index) },
      { name: 'bse:getGainers', fn: () => this.bse.getGainers() },
    ];

    return this.runChain(providers);
  }

  async getLosers(index?: string): Promise<MarketQuote[]> {
    const providers: ProviderEntry<MarketQuote[]>[] = [
      { name: 'nse:getLosers', fn: () => this.nse.getLosers(index) },
      { name: 'bse:getLosers', fn: () => this.bse.getLosers() },
    ];

    return this.runChain(providers);
  }

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

  async getBseQuote(symbol: string): Promise<MarketQuote> {
    return this.bse.getQuote(symbol);
  }

  async getBse52WeekHL(symbol: string): Promise<any> {
    return this.bse.get52WeekHL(symbol);
  }

  async getBseTradingStats(symbol: string): Promise<any> {
    return this.bse.getTradingStats(symbol);
  }

  getCircuitStats(): Array<{ name: string; state: string; successCount: number; failureCount: number; lastError: string | null }> {
    return Array.from(this.circuits.entries()).map(([name, cb]) => ({
      ...cb.getStats(),
      name,
    }));
  }

  private getCircuit(name: string): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker(name, CIRCUIT_OPTIONS));
    }
    return this.circuits.get(name)!;
  }

  private async runChain<T>(providers: ProviderEntry<T>[]): Promise<T> {
    const errors: Error[] = [];
    for (const p of providers) {
      try {
        const circuit = this.getCircuit(p.name);
        return await circuit.call(p.fn);
      } catch (err) {
        errors.push(err as Error);
        if (err instanceof CircuitOpenError) {
          logger.debug({ circuit: p.name }, 'Circuit open, skipping provider');
        } else {
          logger.warn({ err, provider: p.name }, 'Provider failed, trying next');
        }
      }
    }
    const messages = errors.map(e => e.message).join('; ');
    throw new Error(`All providers failed: ${messages}`);
  }
}
