import type { MarketProvider } from '../provider.interface.js';
import type { MarketQuote, SearchResult } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';
import type { CompanyProfile } from '../../models/company.js';
import type { CorporateAction, Announcement, BoardMeeting } from '../../models/corporate.js';
import type { IndexData, IndexInfo } from '../../models/index.js';
import type { OptionChain } from '../../models/option-chain.js';
import type { MarketStatus } from '../../models/market-status.js';
import { BseHttpClient } from './client.js';
import * as E from './endpoints.js';
import * as P from './parser.js';
import { retry } from '../../utils/retry.js';

export class BseProvider implements MarketProvider {
  readonly exchange = 'BSE' as const;
  private readonly http: BseHttpClient;

  constructor() {
    this.http = new BseHttpClient();
  }

  async getScripCode(symbol: string): Promise<string | null> {
    const html = await this.http.getText(E.BSE_ENDPOINTS.peerSmartSearch, { Type: 'SS', text: symbol });
    return P.lookupScripCode(html, symbol);
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    return retry(async () => {
      const scripCode = await this.getScripCode(symbol);
      if (!scripCode) throw new Error(`BSE scrip code not found for ${symbol}`);
      const raw = await this.http.get<any>(E.BSE_ENDPOINTS.scripHeaderData, { scripcode: scripCode });
      return P.parseQuote(raw, symbol);
    });
  }

  async getHistorical(symbol: string, fromDate: string, toDate: string): Promise<HistoricalCandle[]> {
    return retry(async () => {
      const scripCode = await this.getScripCode(symbol);
      if (!scripCode) throw new Error(`BSE scrip code not found for ${symbol}`);
      const raw = await this.http.get<any>(E.BSE_ENDPOINTS.stockReachGraph, {
        scripcode: scripCode,
        flag: '12M',
        fromdate: '',
        todate: '',
        seriesid: '',
      });
      if (typeof raw === 'string') {
        return [];
      }
      return P.parseHistorical(raw);
    });
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    return retry(async () => {
      const scripCode = await this.getScripCode(symbol);
      if (!scripCode) throw new Error(`BSE scrip code not found for ${symbol}`);
      const raw = await this.http.get<any>(E.BSE_ENDPOINTS.equityMetaInfo, {
        quotetype: 'EQ',
        scripcode: scripCode,
        seriesid: '',
      });
      return P.parseCompanyProfile(raw, symbol, scripCode);
    });
  }

  async getActions(symbol?: string, fromDate?: string, toDate?: string): Promise<CorporateAction[]> {
    return retry(async () => {
      const params: Record<string, string | number | boolean> = {
        ddlcategorys: 'E',
        ddlindustrys: '',
        segment: '0',
        strSearch: 'D',
      };
      if (symbol) {
        const scripCode = await this.getScripCode(symbol);
        if (scripCode) params.scripcode = scripCode;
      }
      if (fromDate && toDate) {
        params.Fdate = fromDate.replace(/-/g, '');
        params.TDate = toDate.replace(/-/g, '');
      }
      const raw = await this.http.get<any[]>(E.BSE_ENDPOINTS.actions, params);
      return P.parseCorporateActions(raw);
    });
  }

  async getAnnouncements(symbol?: string, fromDate?: string, toDate?: string): Promise<Announcement[]> {
    return retry(async () => {
      const params: Record<string, string | number | boolean> = {
        pageno: 1,
        strCat: '-1',
        subcategory: '-1',
        strSearch: 'P',
        strType: 'C',
      };
      if (fromDate) params.strPrevDate = fromDate.replace(/-/g, '');
      if (toDate) params.strToDate = toDate.replace(/-/g, '');
      if (symbol) {
        const scripCode = await this.getScripCode(symbol);
        if (scripCode) params.strscrip = scripCode;
      }
      const raw = await this.http.get<any>(E.BSE_ENDPOINTS.announcements, params);
      return P.parseAnnouncements(raw);
    });
  }

  async getBoardMeetings(symbol?: string, fromDate?: string, toDate?: string): Promise<BoardMeeting[]> {
    return retry(async () => {
      const params: Record<string, string | number | boolean> = {};
      if (fromDate) params.fromdate = fromDate.replace(/-/g, '');
      if (toDate) params.todate = toDate.replace(/-/g, '');
      if (symbol) {
        const scripCode = await this.getScripCode(symbol);
        if (scripCode) params.scripcode = scripCode;
      }
      const raw = await this.http.get<any[]>(E.BSE_ENDPOINTS.resultCalendar, params);
      return P.parseBoardMeetings(raw);
    });
  }

  async getMarketStatus(): Promise<MarketStatus> {
    return {
      exchange: 'BSE',
      open: false,
      segments: [],
      timestamp: new Date().toISOString(),
    };
  }

  async getIndexData(indexName: string): Promise<IndexData> {
    const raw = await this.http.get<any>(E.BSE_ENDPOINTS.indexArchiveDaily);
    return P.parseIndexData(raw, indexName);
  }

  async getIndices(): Promise<IndexInfo[]> {
    const raw = await this.http.get<any>(E.BSE_ENDPOINTS.indexNames);
    return P.parseIndices(raw);
  }

  async getOptionChain(_symbol: string, _expiry?: string): Promise<OptionChain> {
    throw new Error('BSE does not provide option chain data');
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    const html = await this.http.getText(E.BSE_ENDPOINTS.peerSmartSearch, { Type: 'SS', text: query });
    return P.parseSearchResults(html);
  }

  async getGainers(): Promise<MarketQuote[]> {
    const raw = await this.http.get<any>(E.BSE_ENDPOINTS.gainerLoser, {
      GLtype: 'gainer',
      IndxGrp: 'group',
      IndxGrpval: 'A',
      orderby: 'all',
    });
    return P.parseGainersLosers(raw);
  }

  async getLosers(): Promise<MarketQuote[]> {
    const raw = await this.http.get<any>(E.BSE_ENDPOINTS.gainerLoser, {
      GLtype: 'loser',
      IndxGrp: 'group',
      IndxGrpval: 'A',
      orderby: 'all',
    });
    return P.parseGainersLosers(raw);
  }

  // BSE-specific low-level access
  async getTradingStats(symbol: string): Promise<any> {
    const scripCode = await this.getScripCode(symbol);
    if (!scripCode) throw new Error(`BSE scrip code not found for ${symbol}`);
    return this.http.get(E.BSE_ENDPOINTS.stockTrading, {
      flag: '',
      quotetype: 'EQ',
      scripcode: scripCode,
    });
  }

  async get52WeekHL(symbol: string): Promise<any> {
    const scripCode = await this.getScripCode(symbol);
    if (!scripCode) throw new Error(`BSE scrip code not found for ${symbol}`);
    return this.http.get(E.BSE_ENDPOINTS.highLow, {
      Type: 'EQ',
      flag: 'C',
      scripcode: scripCode,
    });
  }
}
