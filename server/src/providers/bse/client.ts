import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../../config/index.js';
import { RateLimiter } from '../../utils/rate-limiter.js';
import { logger } from '../../utils/logger.js';

export class BseHttpClient {
  private readonly client: AxiosInstance;
  private readonly limiter: RateLimiter;

  constructor() {
    this.limiter = new RateLimiter(config.bse.rateLimitRps);

    this.client = axios.create({
      baseURL: config.bse.apiUrl,
      timeout: config.bse.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Origin': config.bse.baseUrl,
        'Referer': config.bse.baseUrl,
        'Connection': 'keep-alive',
      },
    });
  }

  async get<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    await this.limiter.acquire();

    const fullUrl = url.startsWith('http') ? url : `${config.bse.apiUrl}${url}`;

    const cfg: AxiosRequestConfig = {
      url: fullUrl,
      method: 'GET',
      params,
      responseType: 'json',
    };

    try {
      const res = await this.client.request<T>(cfg);
      return res.data;
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') throw new TimeoutError('BSE request timed out');
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      throw new ConnectionError(`BSE ${status || 'ERR'}: ${msg}`);
    }
  }

  async getText(url: string, params?: Record<string, string | number | boolean>): Promise<string> {
    await this.limiter.acquire();

    try {
      const res = await this.client.get(url, {
        params,
        responseType: 'text',
      });
      return res.data;
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') throw new TimeoutError('BSE request timed out');
      const status = err.response?.status;
      throw new ConnectionError(`BSE ${status}: ${err.message}`);
    }
  }
}

export class TimeoutError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'TimeoutError';
  }
}

export class ConnectionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ConnectionError';
  }
}
