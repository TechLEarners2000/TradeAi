export interface IndexData {
  name: string;
  current: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  advance: number;
  decline: number;
  unchanged: number;
  timestamp: string;
}

export interface IndexInfo {
  symbol: string;
  name: string;
  fullName: string;
}
