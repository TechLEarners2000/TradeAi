import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '30', 10),
  rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '30', 10),

  nse: {
    baseUrl: process.env.NSE_API_BASE_URL || 'https://www.nseindia.com',
    apiUrl: process.env.NSE_API_URL || 'https://www.nseindia.com/api',
    nextApiUrl: process.env.NSE_NEXT_API_URL || 'https://www.nseindia.com/api/NextApi/apiClient/GetQuoteApi',
    archiveUrl: process.env.NSE_ARCHIVE_URL || 'https://nsearchives.nseindia.com',
    rateLimitRps: parseInt(process.env.NSE_RATE_LIMIT_RPS || '3', 10),
    timeout: parseInt(process.env.NSE_TIMEOUT_MS || '15000', 10),
  },

  bse: {
    baseUrl: process.env.BSE_BASE_URL || 'https://www.bseindia.com',
    apiUrl: process.env.BSE_API_URL || 'https://api.bseindia.com/BseIndiaAPI/api',
    rateLimitRps: parseInt(process.env.BSE_RATE_LIMIT_RPS || '8', 10),
    timeout: parseInt(process.env.BSE_TIMEOUT_MS || '10000', 10),
  },

  yahooFinance: {
    enabled: process.env.YAHOO_FINANCE_ENABLED !== 'false',
  },

  upstox: {
    baseUrl: process.env.UPSTOX_BASE_URL || 'https://api.upstox.com/v2',
    baseUrlV3: process.env.UPSTOX_BASE_URL_V3 || 'https://api.upstox.com/v3',
    accessToken: process.env.UPSTOX_ACCESS_TOKEN || '',
    clientId: process.env.UPSTOX_CLIENT_ID || '',
    clientSecret: process.env.UPSTOX_CLIENT_SECRET || '',
    enabled: process.env.UPSTOX_ENABLED !== 'false',
    rateLimitRps: parseInt(process.env.UPSTOX_RATE_LIMIT_RPS || '5', 10),
    timeout: parseInt(process.env.UPSTOX_TIMEOUT_MS || '10000', 10),
  },

  stooq: {
    enabled: process.env.STOOQ_ENABLED !== 'false',
  },

  circuitBreaker: {
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '3', 10),
    resetTimeoutMs: parseInt(process.env.CIRCUIT_BREAKER_RESET_MS || '30000', 10),
  },

  llm: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    timeout: parseInt(process.env.LLM_TIMEOUT_MS || '30000', 10),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
