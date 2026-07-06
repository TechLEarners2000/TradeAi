# Product Requirements Document: AI Trading Assistant Platform

**Version:** 1.0
**Author:** Jay Harish P
**Date:** July 2026
**Status:** Draft

---

## 1. Overview

### 1.1 Purpose
A web platform that lets retail investors track Indian stocks (NSE/BSE), chat with an AI assistant for market questions, and view historical + live + predicted price charts — combining a public stock data API with an LLM for conversational Q&A and insight generation.

### 1.2 Problem Statement
Retail investors juggle multiple apps for stock quotes, news, and analysis. Existing tools either give raw numbers with no context, or "AI" tools that don't ground answers in real data. This product merges real market data with an LLM that can explain, summarize, and (with clear disclaimers) suggest — all in one dashboard.

### 1.3 Goals
- Give users a single dashboard for real-time NSE/BSE stock data.
- Let users ask natural-language questions about stocks/markets and get grounded answers.
- Visualize historical price action and a clearly-labeled "predicted" trend line.
- Keep the system legally safe (educational, not financial advice).

### 1.4 Non-Goals
- Not a brokerage — no real order placement/execution.
- Not a guaranteed-accuracy prediction engine — predictions are illustrative/statistical, not investment advice.
- No options/derivatives/F&O data in v1.

---

## 2. Target Users
- Students and early-career developers/investors tracking NSE/BSE stocks casually.
- Retail investors wanting quick explanations of jargon (P/E, EPS, market cap) alongside live data.
- Hackathon/portfolio use case — showcase full-stack + AI integration skills.

---

## 3. Data Sources & Constraints

### 3.1 Stock Data API
Using the free **Indian Stock Market API** (`0xramm/Indian-Stock-Market-API`):
- Base URL: `http://65.0.104.9/`
- Endpoints: `/search`, `/stock`, `/stock/list`, `/symbols`, `/`
- No auth required, but **rate-limited to 60 requests/min** — must be respected via caching/backend queueing.
- Data sourced from NSE API, local cache, and Yahoo Finance; last-available data returned when markets closed.
- **Important constraints to design around:**
  - Base URL is plain HTTP, not HTTPS — must proxy through our own HTTPS backend (browsers/mixed-content will block direct calls from an HTTPS frontend).
  - Single point of failure — it's a small, unofficial community project (115 stars), not an SLA-backed service. Design a caching layer and a fallback/error state for when it's down.
  - Only ~30 pre-cached symbols listed for `/symbols`, though `/stock` and `/search` may resolve more via Yahoo Finance fallback — needs verification during implementation.
  - No historical time-series endpoint exists in this API — only current/last-available snapshot data. **Historical charting will need a separate data source** (e.g., Yahoo Finance via `yfinance` library, or NSE historical bhavcopy files) since this API alone cannot power "past" charts.
- Recommended backend cache: 30–60 second TTL per symbol (per API's own best-practice guidance) to stay under rate limits and reduce load.

### 3.2 Historical Data (for charts) — additional source needed
Since the given API only returns live/latest snapshots, plan a secondary source:
- `yfinance` (Python) hitting Yahoo Finance directly for OHLCV historical candles, or
- NSE's public historical data downloads.
This should be clearly documented as a second integration, not assumed to come free from the given API.

### 3.3 LLM API
- Anthropic Claude API (or similar) for chat, using function-calling / tool-use to fetch live data from our backend before answering, so answers are grounded in real numbers instead of hallucinated.
- System prompt should force the model to (a) call the stock-data tool before quoting prices, (b) always append an educational-disclaimer, (c) avoid definitive buy/sell directives.

### 3.4 Prediction Component
Not from any API — must be built in-house:
- v1: simple statistical models (e.g., moving averages, linear regression, ARIMA) run on the historical data, displayed as a "projected trend" band with confidence interval — explicitly labeled "not financial advice, statistical projection only."
- v2 (stretch): LSTM/Prophet-based model trained on historical OHLCV.

---

## 4. Key Features

### 4.1 Stock Dashboard
- Search bar (uses `/search`) with autocomplete.
- Stock detail page (uses `/stock`): price, change %, day range, 52-week range, volume, market cap, P/E, dividend yield, EPS, sector/industry.
- Exchange toggle: NSE (.NS) / BSE (.BO), with side-by-side price comparison.
- Watchlist: multiple stocks via `/stock/list`, refreshed on interval respecting rate limits.
- Trending/popular stocks list (curated from the API's known symbol list: RELIANCE, TCS, INFY, HDFCBANK, ITC, etc.).

### 4.2 Live + Historical + Predicted Chart
- Interactive candlestick/line chart per stock with 3 zones on the same timeline:
  1. **Historical** (from secondary historical data source) — 1D/1W/1M/1Y toggle.
  2. **Live** — last price marker updating on poll/refresh (not true tick-by-tick, since API has no WebSocket/streaming; use polling every 30–60s within rate limits).
  3. **Predicted** — dashed/shaded projection line for next N days with a visible "Projection — not advice" label and confidence band.
- Overlays: moving averages (SMA/EMA), volume bars.

### 4.3 AI Chat Assistant
- Chat panel (persistent side panel or full page) where users ask things like "How is Reliance doing today?" or "Explain P/E ratio for TCS."
- Assistant flow: parse intent → call internal stock-data endpoint(s) as a tool → compose grounded natural-language answer → cite the numbers it used.
- Can generate suggestions/comparisons ("compare TCS vs INFY P/E") but must include a standard disclaimer and avoid direct "buy/sell now" language.
- Conversation history stored per user session.

### 4.4 Market Overview Page
- Snapshot of major sector performers using the `/stock/list` batch endpoint.
- Simple sector heatmap (gainers/losers) — computed client-side from batch data since the API doesn't expose an index-level endpoint (no direct Nifty/Sensex index value in the given API — verify separately; may need another data source for actual index values).

### 4.5 Alerts & Notifications (stretch goal)
- Price threshold alerts (email or in-app), checked by a backend cron respecting API rate limits.

---

## 5. Non-Functional Requirements
- **Rate-limit safety:** all calls to the stock API go through our backend, never client-direct, with request queueing/caching to stay under 60 req/min.
- **Resilience:** graceful degradation with cached "last known" data and a visible "data may be delayed" banner if the upstream API is unreachable.
- **Security:** backend proxies all third-party calls; API keys for the LLM never exposed client-side.
- **Performance:** dashboard first paint < 2s using cached data; live refresh via polling, not blocking UI.
- **Disclaimer compliance:** every price/prediction/chat page displays "Educational use only — not financial advice; verify with official sources," matching the source API's own disclaimer.

---

## 6. Proposed Architecture
Given Jay's existing stack (Node.js/Express, React/TypeScript, MongoDB/Redis) — consistent with the TradeAI project already in progress:

- **Frontend:** React + TypeScript, TailwindCSS, charting via a library like Recharts/Lightweight-Charts.
- **Backend:** Node.js/Express (or FastAPI, matching TradeAI's existing Python backend) acting as a proxy/cache layer for the stock API, plus an endpoint that orchestrates LLM tool-calls.
- **Cache/Queue:** Redis for caching stock responses (30–60s TTL) and rate-limit tracking; Celery/BullMQ for scheduled historical-data refresh and alert checks.
- **Database:** PostgreSQL/MongoDB for user accounts, watchlists, chat history, alert configs.
- **Historical data ingestion job:** scheduled job pulling OHLCV from `yfinance` or similar into the DB for chart history + model training.
- **Prediction service:** separate lightweight Python service (statsmodels/Prophet) invoked on-demand or via scheduled batch job.

---

## 7. Success Metrics
- API error rate from upstream stock source < 2% (post-caching).
- Chat answer groundedness: >95% of price-related answers backed by an actual tool call (not hallucinated).
- Page load and chart render < 2s on cached data.
- User retention: watchlist usage as a proxy for engagement.

---

## 8. Risks
| Risk | Mitigation |
|---|---|
| Third-party stock API is unofficial/small (single maintainer, no SLA) and could go down or change | Cache aggressively; abstract the data layer so a different provider can be swapped in later |
| No historical/index-level endpoint in the given API | Source historical/index data separately from day one; don't assume it's covered |
| LLM hallucinating prices/advice | Force tool-use grounding; disclaimers on every AI response |
| Regulatory/legal exposure from "predictions" | Label clearly as statistical projections, not investment advice; consider legal review before public launch |

---

## 9. Open Questions
1. Should predictions be shown for all stocks or only pre-cached/high-liquidity ones where historical data quality is higher?
2. Do we need user auth for MVP, or can watchlists be local-storage only initially?
3. Which historical data source (yfinance vs NSE bhavcopy) gives the most reliable long-term free access?
