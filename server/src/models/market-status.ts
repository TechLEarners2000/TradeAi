export interface MarketStatus {
  exchange: 'NSE' | 'BSE';
  open: boolean;
  segments: MarketSegment[];
  timestamp: string;
}

export interface MarketSegment {
  segment: string;
  status: 'Open' | 'Closed' | 'Pre-Open' | 'Holiday';
  time: string;
}
