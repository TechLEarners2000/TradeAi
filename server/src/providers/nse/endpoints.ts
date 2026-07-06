export const NSE_ENDPOINTS = {
  marketStatus: '/marketStatus',
  searchAutocomplete: '/search/autocomplete',

  // Quotes & Meta — current NSE API (Next API was deprecated)
  getQuoteData: '/quote-equity',
  equityMetaInfo: '/quote-equity',

  // Historical
  equityHistorical: '/historical/securityArchives',
  indexHistorical: '/historicalOR/indicesHistory',
  vixHistorical: '/historical/vixHistory',
  fnoHistorical: '/historical/foSecurities',

  // Corporate
  corporateActions: '/corporates-corporateActions',
  corporateAnnouncements: '/corporate-announcements',
  boardMeetings: '/corporate-board-meetings',
  shareholding: '/corporate-share-holdings-master',
  annualReports: '/annual-reports',

  // Indices
  allIndices: '/allIndices',
  equityStockIndices: '/equity-stock-indices',
  equityStockIndex: '/equity-stockIndex',

  // FnO
  optionChainV3: '/option-chain-v3',
  optionChainContractInfo: '/option-chain-contract-info',
  liveEquityDerivatives: '/liveEquity-derivatives',
  fnoLots: 'https://nsearchives.nseindia.com/content/fo/fo_mktlots.csv',

  // Market data
  blockDeal: '/block-deal',
  liveVolumeGainers: '/live-analysis-volume-gainers',
  liveEmerge: '/live-analysis-emerge',

  // Listings
  etf: '/etf',
  sovereignGoldBonds: '/sovereign-gold-bonds',
  ipoCurrent: '/ipo-current-issue',
  ipoUpcoming: '/all-upcoming-issues',
  ipoPast: '/public-past-issues',

  // Circulars
  circulars: '/circulars',

  // Archive bhavcopy
  equityBhavcopy: 'https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{date}_F_0000.csv.zip',
  equityBhavcopyOld: 'https://nsearchives.nseindia.com/content/historical/EQUITIES/{year}/{month}/cm{date}bhav.csv.zip',
  deliveryBhavcopy: 'https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_{date}.csv',
  indicesBhavcopy: 'https://nsearchives.nseindia.com/content/indices/ind_close_all_{date}.csv',
  fnoBhavcopy: 'https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_{date}_F_0000.csv.zip',
  prBhavcopy: 'https://nsearchives.nseindia.com/archives/equities/bhavcopy/pr/PR{date}.zip',
  priceband: 'https://nsearchives.nseindia.com/content/equities/sec_list_{date}.csv',
  cmMiiSecurity: 'https://nsearchives.nseindia.com/content/cm/NSE_CM_security_{date}.csv.gz',
} as const;

export const NSE_NEXT_API_FUNCTIONS = {
  metaData: 'getMetaData',
  symbolData: 'getSymbolData',
} as const;
