import { Router } from 'express';
import { ProviderChain } from '../services/provider-chain.js';
import { get as persistentGet } from '../services/persistent-cache.js';
import * as mock from '../data/mock-data.js';

const router = Router();
let _service: ProviderChain | null = null;
let _initialized = false;

function getService(): ProviderChain {
  if (!_service) {
    _service = new ProviderChain();
  }
  return _service;
}

export async function ensureInitialized(): Promise<void> {
  if (!_initialized) {
    await getService().init();
    _initialized = true;
  }
}

router.get('/search', async (req, res) => {
  try {
    await ensureInitialized();
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: 'Missing query param q' });
    const data = await persistentGet(
      `search:${q}`,
      () => getService().searchSymbols(q),
      () => mock.getMockSearch(q),
      { ttlMs: 60000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Search unavailable', detail: (err as Error).message });
  }
});

router.get('/quote', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol param' });
    const exchange = req.query.exchange as 'NSE' | 'BSE' | undefined;
    const data = await persistentGet(
      `quote:${symbol}:${exchange || 'NSE'}`,
      () => getService().getQuote(symbol, exchange),
      () => mock.getMockQuote(symbol),
      { ttlMs: 30000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Quote unavailable', detail: (err as Error).message });
  }
});

router.get('/list', async (req, res) => {
  try {
    await ensureInitialized();
    const symbols = (req.query.symbols as string || '').split(',').filter(Boolean);
    if (symbols.length === 0) return res.status(400).json({ error: 'Missing symbols' });
    const data = await persistentGet(
      `list:${symbols.join(',')}`,
      async () => {
        const results = await Promise.allSettled(
          symbols.map(sym => getService().getQuote(sym))
        );
        return results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value);
      },
      () => mock.getMockBatchQuotes(symbols),
      { ttlMs: 30000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Batch quote unavailable', detail: (err as Error).message });
  }
});

router.get('/symbols', async (_req, res) => {
  try {
    await ensureInitialized();
    const data = await persistentGet(
      'indices',
      () => getService().getIndices(),
      () => mock.getMockIndices() as any,
      { ttlMs: 300000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Symbols unavailable', detail: (err as Error).message });
  }
});

router.get('/historical', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string;
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol param' });
    const data = await persistentGet(
      `hist:${symbol}:${fromDate}:${toDate}`,
      () => getService().getHistorical(symbol, fromDate, toDate),
      () => mock.getMockHistorical(symbol) as any,
      { ttlMs: 300000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Historical data unavailable', detail: (err as Error).message });
  }
});

router.get('/company', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol param' });
    const data = await persistentGet(
      `profile:${symbol}`,
      () => getService().getCompanyProfile(symbol),
      () => mock.getMockCompanyProfile(symbol) as any,
      { ttlMs: 300000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Company info unavailable', detail: (err as Error).message });
  }
});

router.get('/actions', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string | undefined;
    const fromDate = req.query.from as string | undefined;
    const toDate = req.query.to as string | undefined;
    const key = `actions:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const data = await persistentGet(
      key,
      () => getService().getActions(symbol, fromDate, toDate),
      () => mock.getMockCorporateActions(symbol) as any,
      { ttlMs: 60000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Corporate actions unavailable', detail: (err as Error).message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string | undefined;
    const fromDate = req.query.from as string | undefined;
    const toDate = req.query.to as string | undefined;
    const key = `ann:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const data = await persistentGet(
      key,
      () => getService().getAnnouncements(symbol, fromDate, toDate),
      () => mock.getMockAnnouncements(symbol) as any,
      { ttlMs: 60000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Announcements unavailable', detail: (err as Error).message });
  }
});

router.get('/board-meetings', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string | undefined;
    const fromDate = req.query.from as string | undefined;
    const toDate = req.query.to as string | undefined;
    const key = `bm:${symbol || 'all'}:${fromDate || ''}:${toDate || ''}`;
    const data = await persistentGet(
      key,
      () => getService().getBoardMeetings(symbol, fromDate, toDate),
      () => mock.getMockBoardMeetings(symbol) as any,
      { ttlMs: 60000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Board meetings unavailable', detail: (err as Error).message });
  }
});

router.get('/market-status', async (_req, res) => {
  try {
    await ensureInitialized();
    const data = await persistentGet(
      'marketStatus',
      () => getService().getMarketStatus(),
      () => mock.getMockMarketStatus() as any,
      { ttlMs: 30000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Market status unavailable', detail: (err as Error).message });
  }
});

router.get('/indices', async (req, res) => {
  try {
    await ensureInitialized();
    const indexName = req.query.index as string | undefined;
    if (indexName) {
      const data = await persistentGet(
        `index:${indexName}`,
        () => getService().getIndexData(indexName),
        () => mock.getMockIndexData(indexName) as any,
        { ttlMs: 60000 },
      );
      res.json(data);
    } else {
      const data = await persistentGet(
        'indices',
        () => getService().getIndices(),
        () => mock.getMockIndices() as any,
        { ttlMs: 300000 },
      );
      res.json(data);
    }
  } catch (err) {
    res.status(502).json({ error: 'Index data unavailable', detail: (err as Error).message });
  }
});

router.get('/option-chain', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string;
    const expiry = req.query.expiry as string | undefined;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol param' });
    const data = await persistentGet(
      `oc:${symbol}:${expiry || 'auto'}`,
      () => getService().getOptionChain(symbol, expiry),
      () => mock.getMockOptionChain(symbol) as any,
      { ttlMs: 30000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Option chain unavailable', detail: (err as Error).message });
  }
});

router.get('/gainers', async (req, res) => {
  try {
    await ensureInitialized();
    const index = req.query.index as string | undefined;
    const data = await persistentGet(
      `gainers:${index || 'all'}`,
      () => getService().getGainers(index),
      () => mock.getMockGainers() as any,
      { ttlMs: 60000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Gainers unavailable', detail: (err as Error).message });
  }
});

router.get('/losers', async (req, res) => {
  try {
    await ensureInitialized();
    const index = req.query.index as string | undefined;
    const data = await persistentGet(
      `losers:${index || 'all'}`,
      () => getService().getLosers(index),
      () => mock.getMockLosers() as any,
      { ttlMs: 60000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Losers unavailable', detail: (err as Error).message });
  }
});

router.get('/nse/fno-lots', async (_req, res) => {
  try {
    await ensureInitialized();
    const data = await persistentGet(
      'fnoLots',
      () => getService().getNseFnoLots(),
      () => mock.getMockFnoLots(),
      { ttlMs: 3600000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'FnO lots unavailable', detail: (err as Error).message });
  }
});

router.get('/nse/stocks-by-index', async (req, res) => {
  try {
    await ensureInitialized();
    const index = req.query.index as string;
    if (!index) return res.status(400).json({ error: 'Missing index param' });
    const data = await persistentGet(
      `stocksByIndex:${index}`,
      () => getService().getNseStocksByIndex(index),
      () => mock.getMockNseStocksByIndex(index) as any,
      { ttlMs: 60000 },
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Stocks by index unavailable', detail: (err as Error).message });
  }
});

router.get('/stocks', async (_req, res) => {
  try {
    await ensureInitialized();
    const service = getService();
    let stocks: Array<{ symbol: string; name: string }>;

    try {
      stocks = await persistentGet(
        'stockList',
        async () => {
          const fnoLots = await service.getNseFnoLots();
          return Object.keys(fnoLots).map(sym => ({ symbol: sym, name: sym }));
        },
        () => mock.getMockStockList(),
        { ttlMs: 3600000 },
      );
    } catch {
      stocks = mock.getMockStockList();
    }

    res.json(stocks);
  } catch (err) {
    res.status(502).json({ error: 'Stock list unavailable', detail: (err as Error).message });
  }
});

router.get('/bse/52week-hl', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol param' });
    const data = await getService().getBse52WeekHL(symbol);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: '52-week data unavailable', detail: (err as Error).message });
  }
});

router.get('/bse/trading-stats', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol param' });
    const data = await getService().getBseTradingStats(symbol);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Trading stats unavailable', detail: (err as Error).message });
  }
});

export default router;
