export interface HistoricalCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalRequest {
  symbol: string;
  fromDate: string;
  toDate: string;
  exchange?: 'NSE' | 'BSE';
}
