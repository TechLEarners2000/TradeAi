import { describe, it, expect, vi } from 'vitest';
import { MarketService } from '../market.service.js';
import type { MarketProvider } from '../../providers/provider.interface.js';
import type { MarketQuote } from '../../models/market-quote.js';
import type { HistoricalCandle } from '../../models/historical.js';

function createMockProvider(exchange: 'NSE' | 'BSE', fail = false): MarketProvider {
  return {
    exchange,
    getQuote: vi.fn().mockImplementation(async (symbol: string) => {
      if (fail) throw new Error(`${exchange} failed`);
      return {
        symbol,
        name: `${symbol} Corp`,
        price: 100,
        change: 5,
        changePercent: 5.26,
        open: 95,
        high: 102,
        low: 94,
        close: 95,
        volume: 1000000,
        marketCap: 100000,
        pe: 20,
        dividendYield: 1.5,
        eps: 5,
        sector: 'Technology',
        industry: 'Software',
        week52High: 120,
        week52Low: 80,
        lastUpdate: new Date().toISOString(),
        exchange,
      } as MarketQuote;
    }),
    getHistorical: vi.fn().mockImplementation(async () => [] as HistoricalCandle[]),
    getCompanyProfile: vi.fn(),
    getActions: vi.fn(),
    getAnnouncements: vi.fn(),
    getBoardMeetings: vi.fn(),
    getMarketStatus: vi.fn(),
    getIndexData: vi.fn(),
    getIndices: vi.fn(),
    getOptionChain: vi.fn(),
    searchSymbols: vi.fn(),
    getGainers: vi.fn(),
    getLosers: vi.fn(),
  };
}

describe('MarketService', () => {
  describe('getQuote', () => {
    it('should return NSE quote when NSE succeeds', async () => {
      const nse = createMockProvider('NSE');
      const bse = createMockProvider('BSE');
      const service = new MarketService(nse as any, bse as any);

      const result = await service.getQuote('RELIANCE');
      expect(result.exchange).toBe('NSE');
      expect(result.price).toBe(100);
    });

    it('should fallback to BSE when NSE fails', async () => {
      const nse = createMockProvider('NSE', true);
      const bse = createMockProvider('BSE');
      const service = new MarketService(nse as any, bse as any);

      const result = await service.getQuote('RELIANCE');
      expect(result.exchange).toBe('BSE');
    });

    it('should throw when both providers fail', async () => {
      const nse = createMockProvider('NSE', true);
      const bse = createMockProvider('BSE', true);
      const service = new MarketService(nse as any, bse as any);

      await expect(service.getQuote('RELIANCE')).rejects.toThrow('All providers failed');
    });
  });

  describe('getOptionChain', () => {
    it('should call NSE for option chain', async () => {
      const nse = createMockProvider('NSE');
      const bse = createMockProvider('BSE');
      nse.getOptionChain = vi.fn().mockResolvedValue({ symbol: 'NIFTY', strikes: [] });
      const service = new MarketService(nse as any, bse as any);

      const result = await service.getOptionChain('NIFTY');
      expect(result.symbol).toBe('NIFTY');
    });
  });
});
