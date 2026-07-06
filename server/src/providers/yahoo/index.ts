import type { MarketProvider } from '../provider.interface.js';
import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { CompanyProfile } from '../../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../../models/corporate.js';
import type { IndexData, IndexInfo } from '../../models/index.js';
import type { OptionChain } from '../../models/option-chain.js';
import type { MarketStatus, MarketSegment } from '../../models/market-status.js';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();
const NSE_SUFFIX = '.NS';

export class YahooProvider implements MarketProvider {
  readonly exchange = 'NSE' as const;

  private toYahooSymbol(symbol: string): string {
    return symbol.includes('.') ? symbol : `${symbol}${NSE_SUFFIX}`;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const yahooSymbol = this.toYahooSymbol(symbol);
    const result = await yf.quote(yahooSymbol);

    return {
      symbol: (result.symbol ?? '').replace('.NS', '').replace('.BO', '') || symbol,
      name: result.longName || result.shortName || symbol,
      price: result.regularMarketPrice ?? 0,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      open: result.regularMarketOpen ?? 0,
      high: result.regularMarketDayHigh ?? 0,
      low: result.regularMarketDayLow ?? 0,
      close: result.regularMarketPreviousClose ?? 0,
      volume: result.regularMarketVolume ?? 0,
      marketCap: result.marketCap ?? 0,
      pe: result.trailingPE ?? 0,
      dividendYield: (result.trailingAnnualDividendYield ?? 0) * 100,
      eps: result.epsTrailingTwelveMonths ?? 0,
      sector: result.sector ?? '',
      industry: result.industry ?? '',
      week52High: result.fiftyTwoWeekHigh ?? 0,
      week52Low: result.fiftyTwoWeekLow ?? 0,
      lastUpdate: new Date().toISOString(),
      exchange: 'NSE',
    };
  }

  async getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]> {
    const yahooSymbol = this.toYahooSymbol(symbol);
    const queryOptions: any = {
      symbol: yahooSymbol,
      period1: fromDate || '2024-01-01',
      period2: toDate || new Date().toISOString().split('T')[0],
    };
    const result: any[] = await (yf.historical as any)(queryOptions, {}) as any;
    return result.map((r: any) => ({
      date: typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0],
      open: r.open ?? 0,
      high: r.high ?? 0,
      low: r.low ?? 0,
      close: r.close ?? 0,
      volume: r.volume ?? 0,
    }));
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const yahooSymbol = this.toYahooSymbol(symbol);
    const result: any = await yf.quoteSummary(yahooSymbol, { modules: ['assetProfile', 'summaryDetail', 'price'] }) as any;

    const assetProfile = result.assetProfile ?? {};
    const summaryDetail = result.summaryDetail ?? {};
    const price = result.price ?? {};

    return {
      symbol,
      name: price.longName || price.shortName || symbol,
      isin: '',
      sector: assetProfile.sector ?? '',
      industry: assetProfile.industry ?? '',
      marketCap: summaryDetail.marketCap ?? 0,
      listingDate: '',
      isFno: false,
      isEtf: false,
      isDebt: false,
      status: 'Active',
      exchange: 'NSE',
    };
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    const results: any = await yf.search(query);
    return ((results.quotes ?? []) as any[])
      .filter((q: any) => q.exchange === 'NSI' || q.exchange === 'BSE')
      .map((q: any) => ({
        symbol: q.symbol ?? '',
        name: (q.longname || q.shortname || q.symbol) ?? '',
        exchange: q.exchange === 'NSI' ? 'NSE' : 'BSE',
      }));
  }

  getActions(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<CorporateAction[]> {
    return Promise.resolve([]);
  }

  getAnnouncements(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<Announcement[]> {
    return Promise.resolve([]);
  }

  getBoardMeetings(_symbol?: string, _fromDate?: string, _toDate?: string): Promise<BoardMeeting[]> {
    return Promise.resolve([]);
  }

  getMarketStatus(): Promise<MarketStatus> {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const day = ist.getDay();
    const hours = ist.getUTCHours();
    const minutes = ist.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;
    const open = day >= 1 && day <= 5 && totalMinutes >= 555 && totalMinutes <= 945;

    const segments: MarketSegment[] = open
      ? [
          { segment: 'EQ', status: 'Open', time: now.toISOString() },
          { segment: 'FNO', status: 'Open', time: now.toISOString() },
        ]
      : [];
    return Promise.resolve({
      exchange: 'NSE',
      open,
      segments,
      timestamp: now.toISOString(),
    });
  }

  getIndexData(_indexName: string): Promise<IndexData> {
    return Promise.reject(new Error('Yahoo provider does not support index data'));
  }

  getIndices(): Promise<IndexInfo[]> {
    return Promise.reject(new Error('Yahoo provider does not support index list'));
  }

  getOptionChain(_symbol: string, _expiry?: string): Promise<OptionChain> {
    return Promise.reject(new Error('Yahoo provider does not support option chain'));
  }

  getGainers(_index?: string): Promise<MarketQuote[]> {
    return Promise.reject(new Error('Yahoo provider does not support gainers'));
  }

  getLosers(_index?: string): Promise<MarketQuote[]> {
    return Promise.reject(new Error('Yahoo provider does not support losers'));
  }
}
