import type { MarketQuote, SearchResult } from '../models/market-quote.js';
import type { HistoricalCandle } from '../models/historical.js';
import type { CompanyProfile } from '../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../models/corporate.js';
import type { IndexData, IndexInfo } from '../models/index.js';
import type { OptionChain } from '../models/option-chain.js';
import type { MarketStatus } from '../models/market-status.js';

export interface MarketProvider {
  readonly exchange: 'NSE' | 'BSE';

  getQuote(symbol: string): Promise<MarketQuote>;
  getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]>;
  getCompanyProfile(symbol: string): Promise<CompanyProfile>;
  getActions(symbol?: string, fromDate?: string, toDate?: string): Promise<CorporateAction[]>;
  getAnnouncements(symbol?: string, fromDate?: string, toDate?: string): Promise<Announcement[]>;
  getBoardMeetings(symbol?: string, fromDate?: string, toDate?: string): Promise<BoardMeeting[]>;
  getMarketStatus(): Promise<MarketStatus>;
  getIndexData(indexName: string): Promise<IndexData>;
  getIndices(): Promise<IndexInfo[]>;
  getOptionChain(symbol: string, expiry?: string): Promise<OptionChain>;
  searchSymbols(query: string): Promise<SearchResult[]>;
  getGainers(index?: string): Promise<MarketQuote[]>;
  getLosers(index?: string): Promise<MarketQuote[]>;
}
