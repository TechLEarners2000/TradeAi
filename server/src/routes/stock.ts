import { Router } from 'express';
import { ProviderChain } from '../services/provider-chain.js';

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

// Existing endpoints (backward compatible)

router.get('/search', async (req, res) => {
  try {
    await ensureInitialized();
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: 'Missing query param q' });
    const results = await getService().searchSymbols(q);
    res.json(results);
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
    const data = await getService().getQuote(symbol, exchange);
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
    const results = await Promise.allSettled(
      symbols.map(sym => getService().getQuote(sym))
    );
    const data = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Batch quote unavailable', detail: (err as Error).message });
  }
});

router.get('/symbols', async (_req, res) => {
  try {
    await ensureInitialized();
    const symbols = await getService().getIndices();
    res.json(symbols);
  } catch (err) {
    res.status(502).json({ error: 'Symbols unavailable', detail: (err as Error).message });
  }
});

// New endpoints

router.get('/historical', async (req, res) => {
  try {
    await ensureInitialized();
    const symbol = req.query.symbol as string;
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol param' });
    const data = await getService().getHistorical(symbol, fromDate, toDate);
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
    const data = await getService().getCompanyProfile(symbol);
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
    const data = await getService().getActions(symbol, fromDate, toDate);
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
    const data = await getService().getAnnouncements(symbol, fromDate, toDate);
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
    const data = await getService().getBoardMeetings(symbol, fromDate, toDate);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Board meetings unavailable', detail: (err as Error).message });
  }
});

router.get('/market-status', async (_req, res) => {
  try {
    await ensureInitialized();
    const data = await getService().getMarketStatus();
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
      const data = await getService().getIndexData(indexName);
      res.json(data);
    } else {
      const data = await getService().getIndices();
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
    const data = await getService().getOptionChain(symbol, expiry);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Option chain unavailable', detail: (err as Error).message });
  }
});

router.get('/gainers', async (req, res) => {
  try {
    await ensureInitialized();
    const index = req.query.index as string | undefined;
    const data = await getService().getGainers(index);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Gainers unavailable', detail: (err as Error).message });
  }
});

router.get('/losers', async (req, res) => {
  try {
    await ensureInitialized();
    const index = req.query.index as string | undefined;
    const data = await getService().getLosers(index);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Losers unavailable', detail: (err as Error).message });
  }
});

// NSE-specific endpoints
router.get('/nse/fno-lots', async (_req, res) => {
  try {
    await ensureInitialized();
    const data = await getService().getNseFnoLots();
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
    const data = await getService().getNseStocksByIndex(index);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Stocks by index unavailable', detail: (err as Error).message });
  }
});

router.get('/stocks', async (_req, res) => {
  try {
    await ensureInitialized();
    const service = getService();
    let stocks: Array<{ symbol: string; name: string }> = [];

    try {
      const fnoLots = await service.getNseFnoLots();
      stocks = Object.keys(fnoLots).map(sym => ({ symbol: sym, name: sym }));
    } catch {
      const fallback = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'SBIN', 'ICICIBANK', 'BHARTIARTL',
        'KOTAKBANK', 'BAJFINANCE', 'WIPRO', 'HCLTECH', 'LT', 'ASIANPAINT', 'MARUTI',
        'TATAMOTORS', 'TITAN', 'SUNPHARMA', 'ULTRACEMCO', 'NTPC', 'M&M', 'POWERGRID',
        'HINDUNILVR', 'AXISBANK', 'BAJAJFINSV', 'ADANIPORTS', 'NESTLEIND', 'ONGC',
        'JSWSTEEL', 'TATASTEEL', 'COALINDIA', 'BPCL', 'HINDALCO', 'DIVISLAB', 'SBILIFE',
        'EICHERMOT', 'BRITANNIA', 'DRREDDY', 'INDUSINDBK', 'GRASIM', 'APOLLOHOSP',
        'HEROMOTOCO', 'BAJAJ-AUTO', 'CIPLA', 'TATACONSUM', 'ADANIENT', 'HDFCLIFE',
        'HAVELLS', 'DABUR', 'PIDILITIND', 'ICICIPRULI', 'MARICO', 'SRTRANSFIN',
        'TECHM', 'HINDZINC', 'TVSMOTOR', 'MUTHOOTFIN', 'VEDL', 'BANDHANBNK', 'GODREJCP',
        'RECLTD', 'PFC', 'SIEMENS', 'TATAPOWER', 'AMBUJACEM', 'BERGEPAINT', 'DLF',
        'ZOMATO', 'PAYTM', 'IEX', 'IRCTC', 'HAL', 'BEL', 'NHPC', 'IDEA', 'YESBANK',
        'IDFCFIRSTB', 'BHEL', 'SAIL', 'IOC', 'GAIL', 'LICHSGFIN', 'COLPAL', 'MCDOWELL-N',
        'BANKBARODA', 'CANBK', 'PNB', 'UNIONBANK', 'INDIANB', 'FEDERALBNK', 'RBLBANK',
      ];
      stocks = fallback.map(sym => ({ symbol: sym, name: sym }));
    }

    res.json(stocks);
  } catch (err) {
    res.status(502).json({ error: 'Stock list unavailable', detail: (err as Error).message });
  }
});

// BSE-specific endpoints
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
