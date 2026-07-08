const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayRange: { low: number; high: number };
  week52Range: { low: number; high: number };
  volume: number;
  marketCap: number;
  pe: number;
  dividendYield: number;
  eps: number;
  sector: string;
  industry: string;
  name: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface SymbolInfo {
  symbol: string;
  searchTerm: string;
  nseTicker: string;
  bseTicker: string;
}

export interface PredictionPoint {
  date: string;
  price: number;
  upperBand: number;
  lowerBand: number;
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function searchStocks(q: string): Promise<SearchResult[]> {
  return fetchJson<SearchResult[]>(`${BASE}/stock/search?q=${encodeURIComponent(q)}`);
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  return fetchJson<StockQuote>(`${BASE}/stock/quote?symbol=${encodeURIComponent(symbol)}`);
}

export async function getBatchQuotes(symbols: string[]): Promise<StockQuote[]> {
  return fetchJson<StockQuote[]>(`${BASE}/stock/list?symbols=${symbols.join(',')}`);
}

export async function getSymbols(): Promise<SymbolInfo[]> {
  return fetchJson<SymbolInfo[]>(`${BASE}/stock/symbols`);
}

export async function getStockList(): Promise<Array<{ symbol: string; name: string }>> {
  return fetchJson<Array<{ symbol: string; name: string }>>(`${BASE}/stock/stocks`);
}

export async function getPrediction(prices: number[]): Promise<{ prediction: PredictionPoint[] }> {
  return fetchJson<{ prediction: PredictionPoint[] }>(
    `${BASE}/prediction?prices=${prices.join(',')}`
  );
}

export interface ChatResponse {
  reply: string;
}

export async function sendChat(messages: Array<{ role: string; content: string }>): Promise<ChatResponse> {
  return fetchJson<ChatResponse>(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
}
