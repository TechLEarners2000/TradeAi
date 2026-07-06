export interface OptionContract {
  strikePrice: number;
  expiry: string;
  callOi: number;
  callLastPrice: number;
  callIv: number;
  callChange: number;
  callVolume: number;
  putOi: number;
  putLastPrice: number;
  putIv: number;
  putChange: number;
  putVolume: number;
}

export interface OptionChain {
  symbol: string;
  underlying: number;
  expiry: string;
  timestamp: string;
  atm: number;
  totalCallOi: number;
  totalPutOi: number;
  pcr: number;
  maxPain: number;
  strikes: OptionContract[];
}
