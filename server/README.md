# TradeAI Server

Express/TypeScript backend for Indian stock market data. Wraps NSE and BSE APIs behind a unified interface with automatic fallback, rate limiting, caching, and retry logic.

## Architecture

```
Route Layer (routes/stock.ts)
  → CachedMarketService (services/cached-market.service.ts)
    → MarketService (services/market.service.ts) — fallback orchestration
      → NseProvider (providers/nse/) — primary
      → BseProvider (providers/bse/) — fallback
```

- **NSE provider**: cookie-jar axios session (tough-cookie), cookie auto-refresh on 401/403, 3 rps token bucket
- **BSE provider**: static headers (Chrome UA + Referer), 8 rps token bucket, no cookie jar needed
- All providers implement `MarketProvider` interface (13 methods)

## Quick Start

```bash
cd server
cp .env.example .env    # edit as needed
npm install
npm run dev             # tsx watch, restarts on changes
```

## Configuration

All config via `.env` (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| PORT | 3001 | Express server port |
| CACHE_TTL_SECONDS | 30 | In-memory cache TTL |
| RATE_LIMIT_PER_MINUTE | 30 | Express rate limit (req/min) |
| NSE_RATE_LIMIT_RPS | 3 | NSE API calls per second |
| NSE_TIMEOUT_MS | 15000 | NSE request timeout |
| BSE_RATE_LIMIT_RPS | 8 | BSE API calls per second |
| BSE_TIMEOUT_MS | 10000 | BSE request timeout |
| LOG_LEVEL | info | Pino log level |
| YAHOO_FINANCE_ENABLED | true | Enable Yahoo Finance fallback |
| STOCK_API_BASE_URL | — | Legacy external API (unused by new service) |

## API Endpoints

All under `/api/stock`:

| Endpoint | Params | Description |
|---|---|---|
| `GET /quote` | `symbol` (req), `exchange` (opt, NSE/BSE) | Live quote |
| `GET /search` | `q` (req) | Symbol search/autocomplete |
| `GET /list` | `symbols` (req, comma-sep) | Batch quotes |
| `GET /historical` | `symbol`, `from`, `to` | Historical candles |
| `GET /company` | `symbol` | Company profile |
| `GET /actions` | `symbol`, `from`, `to` | Corporate actions |
| `GET /announcements` | `symbol`, `from`, `to` | Corporate announcements |
| `GET /board-meetings` | `symbol`, `from`, `to` | Board meeting calendar |
| `GET /market-status` | — | Market open/closed status |
| `GET /indices` | `index` (opt) | Index list or single index data |
| `GET /option-chain` | `symbol`, `expiry` (opt) | F&O option chain |
| `GET /gainers` | `index` (opt) | Top gainers |
| `GET /losers` | `index` (opt) | Top losers |
| `GET /nse/fno-lots` | — | F&O lot sizes (NSE CSV) |
| `GET /nse/stocks-by-index` | `index` | Stocks in index/group |
| `GET /bse/52week-hl` | `symbol` | BSE 52-week high/low |
| `GET /bse/trading-stats` | `symbol` | BSE trading statistics |

### Fallback Behavior

- Primary: NSE → Fallback: BSE → Ultimate: Yahoo Finance (if enabled)
- `getOptionChain` and `getNseFnoLots` are NSE-only
- BSE methods (`/bse/*`) hit BSE directly
- `getQuote` accepts `?exchange=BSE` to prefer BSE

## Project Structure

```
src/
├── config/index.ts              — typed env config
├── index.ts                     — Express server entry
├── routes/
│   ├── stock.ts                 — market data endpoints
│   ├── chat.ts                  — AI chat
│   ├── prediction.ts            — predictions
├── services/
│   ├── market.service.ts        — fallback orchestration
│   ├── cached-market.service.ts — TTL caching decorator
│   ├── cache.ts                 — in-memory cache
│   ├── stockApi.ts              — legacy (unused)
│   ├── yahooFinance.ts          — Yahoo Finance fallback
├── providers/
│   ├── provider.interface.ts    — MarketProvider contract
│   ├── nse/
│   │   ├── index.ts             — NseProvider (13 methods)
│   │   ├── client.ts            — cookie-jar HTTP client
│   │   ├── endpoints.ts         — NSE API paths
│   │   └── parser.ts            — JSON→model parsers
│   ├── bse/
│   │   ├── index.ts             — BseProvider (13+ methods)
│   │   ├── client.ts            — static-header HTTP client
│   │   ├── endpoints.ts         — BSE API paths
│   │   └── parser.ts            — JSON/HTML→model parsers
├── models/
│   ├── market-quote.ts          — MarketQuote, SearchResult
│   ├── historical.ts            — HistoricalCandle
│   ├── company.ts               — CompanyProfile
│   ├── corporate.ts             — CorporateAction, Announcement, BoardMeeting
│   ├── index.ts                 — IndexData, IndexInfo
│   ├── option-chain.ts          — OptionChain
│   ├── market-status.ts         — MarketStatus
├── utils/
│   ├── rate-limiter.ts          — token bucket rate limiter
│   ├── retry.ts                 — exponential backoff + jitter
│   └── logger.ts                — pino logger
└── __tests__ / *.test.ts        — Vitest tests
```

## Testing

```bash
npm test           # single run
npm run test:watch # watch mode
```

Current coverage: providers (NSE/BSE parsers), services (MarketService fallback), utils (rate-limiter, retry).

## Error Handling

- Network/timeout errors → retry with exponential backoff (3 attempts, jitter)
- Non-2xx / parse errors → logged, propagated up
- Provider failure → fallback to next provider (NSE → BSE)
- All providers fail → aggregate error thrown
- Routes return 502 with `{ error, detail }` on failure

## Rate Limiting

Two layers:

1. **Express rate limiter** — global, configurable via `RATE_LIMIT_PER_MINUTE`
2. **Per-exchange token bucket** — NSE: 3 req/s, BSE: 8 req/s (configurable)

## Adding a New Provider

1. Create `providers/<name>/` with client, endpoints, parser
2. Implement `MarketProvider` interface
3. Add to `MarketService` constructor + fallback chain
4. Extend `CachedMarketService` if needed
5. Add route in `routes/stock.ts`

## Scripts

| Script | Action |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | TypeScript compile |
| `npm start` | Run compiled JS |
| `npm test` | Run Vitest tests |
