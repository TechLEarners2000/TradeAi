export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap: number;
  pe: number;
  dividendYield: number;
  eps: number;
  sector: string;
  industry: string;
  week52High: number;
  week52Low: number;
  lastUpdate: string;
  exchange: 'NSE' | 'BSE';
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  isin?: string;
  bseCode?: string;
}
