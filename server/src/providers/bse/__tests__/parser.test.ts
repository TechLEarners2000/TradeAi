import { describe, it, expect } from 'vitest';
import {
  parseQuote,
  parseCorporateActions,
  parseAnnouncements,
  parseSearchResults,
  parseGainersLosers,
  lookupScripCode,
} from '../parser.js';

describe('BSE Parser', () => {
  describe('parseQuote', () => {
    it('should parse a BSE quote response', () => {
      const raw = {
        Header: {
          PrevClose: '2490',
          Open: '2500',
          High: '2550',
          Low: '2480',
          LTP: '2520',
          Volume: '5000000',
          ScripName: 'Reliance Industries',
        },
      };

      const quote = parseQuote(raw, 'RELIANCE');
      expect(quote.symbol).toBe('RELIANCE');
      expect(quote.price).toBe(2520);
      expect(quote.change).toBe(30);
      expect(quote.changePercent).toBeCloseTo(1.2048, 1);
      expect(quote.exchange).toBe('BSE');
    });
  });

  describe('parseCorporateActions', () => {
    it('should parse BSE corporate actions', () => {
      const raw = [
        { ScripCode: '500180', ScripName: 'HDFC Bank', ExDate: '2025-02-01', Purpose: 'Dividend' },
      ];

      const actions = parseCorporateActions(raw);
      expect(actions).toHaveLength(1);
      expect(actions[0].symbol).toBe('500180');
      expect(actions[0].actionType).toBe('DIVIDEND');
    });
  });

  describe('parseAnnouncements', () => {
    it('should parse BSE announcements', () => {
      const raw = {
        Table: [
          { ScripCode: '500180', ScripName: 'HDFC Bank', NewsDate: '2025-01-15', NewsSub: 'Board Meeting Intimation' },
        ],
      };

      const announcements = parseAnnouncements(raw);
      expect(announcements).toHaveLength(1);
      expect(announcements[0].title).toBe('Board Meeting Intimation');
    });
  });

  describe('parseSearchResults', () => {
    it('should parse HTML lookup results', () => {
      const html = '<a>HDFC Bank Ltd HDFCBANK INE001A01036 500180</a><a>TCS Ltd TCS INE123A 123456</a>';
      const results = parseSearchResults(html);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].isin).toBeDefined();
      expect(results[0].bseCode).toBeDefined();
    });

    it('should return empty array for no matches', () => {
      const results = parseSearchResults('<div>No results</div>');
      expect(results).toEqual([]);
    });
  });

  describe('lookupScripCode', () => {
    it('should extract scrip code from HTML', () => {
      const html = '<strong>HDFCBANK</strong>   INE001A01036   500180';
      const code = lookupScripCode(html, 'HDFCBANK');
      expect(code).toBe('500180');
    });

    it('should return null for no match', () => {
      const html = '<strong>TCS</strong> INE123A 123456';
      const code = lookupScripCode(html, 'UNKNOWN');
      expect(code).toBeNull();
    });
  });

  describe('parseGainersLosers', () => {
    it('should parse gainers list', () => {
      const raw = {
        Table: [
          { ScripCode: '500180', LTP: '2500', PercentChange: '5.5' },
          { ScripCode: '500001', LTP: '100', PercentChange: '3.2' },
        ],
      };

      const gainers = parseGainersLosers(raw);
      expect(gainers).toHaveLength(2);
      expect(gainers[0].exchange).toBe('BSE');
    });
  });
});
