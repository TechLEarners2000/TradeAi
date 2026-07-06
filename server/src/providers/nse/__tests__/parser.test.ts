import { describe, it, expect } from 'vitest';
import {
  parseQuote,
  parseHistorical,
  parseCorporateActions,
  parseAnnouncements,
  parseMarketStatus,
  parseOptionChain,
  parseSearchResults,
  parseGainersLosers,
} from '../parser.js';

describe('NSE Parser', () => {
  describe('parseQuote', () => {
    it('should parse a standard NSE quote response (current /api/quote-equity format)', () => {
      const raw = {
        priceInfo: {
          lastPrice: 2520,
          previousClose: 2490,
          change: 30,
          pChange: 1.2048,
          open: 2500,
          dayHigh: 2550,
          dayLow: 2480,
          totalTradedVolume: 5000000,
        },
        metadata: {
          companyName: 'Reliance Industries',
          high52: 2600,
          low52: 2200,
          marketCapFull: 15000000000000,
          earningsPerShare: 50,
          dividendYield: 0.5,
          pdSymbolPe: 28.4,
        },
        securityInfo: { symbol: 'RELIANCE', companyName: 'Reliance Industries' },
        industryInfo: { sector: 'Oil & Gas', industry: 'Refineries' },
      };

      const quote = parseQuote(raw, 'RELIANCE');
      expect(quote.symbol).toBe('RELIANCE');
      expect(quote.name).toBe('Reliance Industries');
      expect(quote.price).toBe(2520);
      expect(quote.change).toBe(30);
      expect(quote.changePercent).toBeCloseTo(1.2048, 1);
      expect(quote.volume).toBe(5000000);
      expect(quote.sector).toBe('Oil & Gas');
    });

    it('should handle minimal response', () => {
      const quote = parseQuote({}, 'TEST');
      expect(quote.symbol).toBe('TEST');
      expect(quote.price).toBe(0);
    });
  });

  describe('parseHistorical', () => {
    it('should parse historical data rows', () => {
      const raw = [
        { mTIMESTAMP: '2025-01-10', OPEN: '100', HIGH: '105', LOW: '99', CLOSE: '103', TOTTRDQTY: '1000000' },
        { mTIMESTAMP: '2025-01-11', OPEN: '103', HIGH: '107', LOW: '102', CLOSE: '106', TOTTRDQTY: '1200000' },
      ];

      const candles = parseHistorical(raw);
      expect(candles).toHaveLength(2);
      expect(candles[0].open).toBe(100);
      expect(candles[0].high).toBe(105);
      expect(candles[0].volume).toBe(1000000);
    });

    it('should return empty array for non-array input', () => {
      expect(parseHistorical(null as any)).toEqual([]);
    });
  });

  describe('parseCorporateActions', () => {
    it('should parse corporate actions', () => {
      const raw = [
        { symbol: 'RELIANCE', exDate: '2025-02-01', purpose: 'Interim Dividend', percentage: '6' },
      ];

      const actions = parseCorporateActions(raw);
      expect(actions).toHaveLength(1);
      expect(actions[0].symbol).toBe('RELIANCE');
      expect(actions[0].actionType).toBe('DIVIDEND');
    });
  });

  describe('parseAnnouncements', () => {
    it('should parse announcements', () => {
      const raw = [
        { symbol: 'TCS', companyName: 'TCS Ltd', anndate: '2025-01-15', secDesc: 'Q3 Results' },
      ];

      const announcements = parseAnnouncements(raw);
      expect(announcements).toHaveLength(1);
      expect(announcements[0].title).toBe('Q3 Results');
    });
  });

  describe('parseMarketStatus', () => {
    it('should parse market status', () => {
      const raw = {
        marketState: [
          { marketType: 'CM', marketStatus: 'Open', tradeDate: '2025-01-15' },
          { marketType: 'FO', marketStatus: 'Open', tradeDate: '2025-01-15' },
        ],
      };

      const status = parseMarketStatus(raw);
      expect(status.open).toBe(true);
      expect(status.segments).toHaveLength(2);
    });
  });

  describe('parseOptionChain', () => {
    it('should parse option chain data', () => {
      const raw = {
        records: {
          underlyingValue: 23000,
          timestamp: '2025-01-15',
          data: [
            {
              strikePrice: 23000,
              expiryDates: '15-FEB-2025',
              CE: { openInterest: 5000, lastPrice: 150, impliedVolatility: 15, change: 10, totalTradedVolume: 1000 },
              PE: { openInterest: 3000, lastPrice: 80, impliedVolatility: 16, change: -5, totalTradedVolume: 800 },
            },
            {
              strikePrice: 23100,
              expiryDates: '15-FEB-2025',
              CE: { openInterest: 2000, lastPrice: 100, impliedVolatility: 14, change: 5, totalTradedVolume: 500 },
              PE: { openInterest: 4000, lastPrice: 120, impliedVolatility: 17, change: 8, totalTradedVolume: 600 },
            },
          ],
        },
      };

      const oc = parseOptionChain(raw, 'NIFTY', '15-FEB-2025');
      expect(oc.symbol).toBe('NIFTY');
      expect(oc.underlying).toBe(23000);
      expect(oc.strikes).toHaveLength(2);
      expect(oc.pcr).toBeCloseTo(7000 / 7000, 1);
    });
  });

  describe('parseSearchResults', () => {
    it('should parse search results', () => {
      const raw = {
        symbols: [
          { symbol: 'RELIANCE', symbol_info: 'Reliance Industries Limited' },
          { symbol: 'TCS', symbol_info: 'Tata Consultancy Services' },
        ],
      };

      const results = parseSearchResults(raw);
      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('RELIANCE');
      expect(results[0].exchange).toBe('NSE');
    });
  });

  describe('parseGainersLosers', () => {
    it('should filter and sort gainers', () => {
      const raw = {
        data: [
          { symbol: 'ABC', ltp: 100, pChange: 5.5 },
          { symbol: 'XYZ', ltp: 200, pChange: -2.3 },
          { symbol: 'DEF', ltp: 50, pChange: 3.2 },
        ],
      };

      const gainers = parseGainersLosers(raw, true);
      expect(gainers).toHaveLength(2);
      expect(gainers[0].changePercent).toBe(5.5);
      expect(gainers[1].changePercent).toBe(3.2);
    });

    it('should filter and sort losers', () => {
      const raw = {
        data: [
          { symbol: 'ABC', ltp: 100, pChange: 5.5 },
          { symbol: 'XYZ', ltp: 200, pChange: -2.3 },
          { symbol: 'DEF', ltp: 50, pChange: -3.2 },
        ],
      };

      const losers = parseGainersLosers(raw, false);
      expect(losers).toHaveLength(2);
      expect(losers[0].changePercent).toBe(-3.2);
      expect(losers[1].changePercent).toBe(-2.3);
    });
  });
});
