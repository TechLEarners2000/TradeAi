const API_HOST = import.meta.env.VITE_API_HOST || '';
const BASE = `${API_HOST}/api`;

const SESSION_TTL = 5 * 60 * 1000; // 5 minutes

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

export interface ChatResponse {
  reply: string;
}

/** Tracks whether the last API response had _mockLoad: true */
export let isMockActive = false;

function sessionGet<T>(key: string): { data: T; mock: boolean } | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() > entry.expiry) {
      sessionStorage.removeItem(key);
      return null;
    }
    return { data: entry.data as T, mock: !!entry.mock };
  } catch {
    return null;
  }
}

function sessionSet(key: string, data: unknown, mock: boolean): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + SESSION_TTL, mock }));
  } catch {
    // sessionStorage full or unavailable — silently fail
  }
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  // Check sessionStorage first
  const cached = sessionGet<T>(url);
  if (cached) {
    if (cached.mock) isMockActive = true;
    return cached.data;
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const data = await res.json() as T;

  // Detect _mockLoad flag from server
  const hasMock = !!(data as any)._mockLoad;
  if (hasMock) isMockActive = true;

  // Cache in sessionStorage (strip _mockLoad from stored data; arrays don't carry _mockLoad)
  if (Array.isArray(data)) {
    sessionSet(url, data, hasMock);
  } else {
    const { _mockLoad, ...clean } = data as any;
    sessionSet(url, clean || data, hasMock);
  }

  return data;
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
  const url = `${BASE}/prediction?prices=${prices.join(',')}`;
  const cached = sessionGet<{ prediction: PredictionPoint[] }>(url);
  if (cached) return cached.data;
  return fetchJson<{ prediction: PredictionPoint[] }>(url);
}

export async function sendChat(messages: Array<{ role: string; content: string }>): Promise<ChatResponse> {
  const body = JSON.stringify({ messages });
  const url = `${BASE}/chat`;
  return fetchJson<ChatResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
