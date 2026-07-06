export const BSE_ENDPOINTS = {
  // Lookup
  peerSmartSearch: '/PeerSmartSearch/w',

  // Quotes & Stats
  scripHeaderData: '/getScripHeaderData/w',
  stockTrading: '/StockTrading/w',
  equityMetaInfo: '/ComHeadernew/w',
  highLow: '/HighLow/w',
  stockReachGraph: '/StockReachGraph/w',
  tabResults: '/TabResults_PAR/w',

  // Market data
  gainerLoser: '/MktRGainerLoserData/w',
  advanceDecline: '/advanceDecline/w',
  highLowData: '/MktHighLowData/w',
  listSecurities: '/ListofScripData/w',
  scripGroups: '/BindDDLEQ/w',

  // Corporate
  announcements: '/AnnSubCategoryGetData/w',
  actions: '/DefaultData/w',
  resultCalendar: '/Corpforthresults/w',
  circulars: '/getDataAdvance_New/w',

  // Indices
  indexArchiveDaily: '/IndexArchDailyAll/w',
  indexCSV: '/ProduceCSVForDate/w',
  indexNames: '/FillddlIndex/w',
  indexReportMetadata: '/Indexarchive_filedownload/w',

  // Bhavcopy
  bhavcopy: 'https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_{date}_F_0000.CSV',
  deliveryReport: 'https://www.bseindia.com/BSEDATA/gross/{year}/SCBSEALL{date}.zip',
} as const;
