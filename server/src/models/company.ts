export interface CompanyProfile {
  symbol: string;
  name: string;
  isin: string;
  sector: string;
  industry: string;
  marketCap: number;
  listingDate: string;
  isFno: boolean;
  isEtf: boolean;
  isDebt: boolean;
  status: 'Active' | 'Suspended' | 'Delisted';
  exchange: 'NSE' | 'BSE';
}
