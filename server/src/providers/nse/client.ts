import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { config } from '../../config/index.js';
import { RateLimiter } from '../../utils/rate-limiter.js';
import { logger } from '../../utils/logger.js';

export class NseHttpClient {
  private readonly client: AxiosInstance;
  private readonly limiter: RateLimiter;
  private cookieJar: tough.CookieJar;
  private cookiePath: string;
  private retriedUrls: Set<string>;

  constructor() {
    this.limiter = new RateLimiter(config.nse.rateLimitRps);
    this.cookieJar = new tough.CookieJar();
    this.cookiePath = '/tmp/nse_cookies.json';
    this.retriedUrls = new Set();

    this.client = wrapper(
      axios.create({
        baseURL: config.nse.apiUrl,
        timeout: config.nse.timeout,
        withCredentials: true,
        jar: this.cookieJar,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Origin': 'https://www.nseindia.com',
        },
      }),
    );

    this.client.interceptors.response.use(
      res => res,
      async err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          const reqUrl = err.config?.url || '';
          if (this.retriedUrls.has(reqUrl)) {
            logger.error({ url: reqUrl }, 'NSE retry already attempted for this URL, not retrying again');
            return Promise.reject(err);
          }
          this.retriedUrls.add(reqUrl);
          logger.warn({ url: reqUrl }, 'NSE auth failure, refreshing cookies');
          try {
            await this.initCookies();
          } catch {
            return Promise.reject(err);
          }
          if (err.config) {
            return this.client.request(err.config);
          }
        }
        return Promise.reject(err);
      },
    );
  }

  async initCookies(): Promise<void> {
    const errors: string[] = [];
    const pages = [
      'https://www.nseindia.com',
      'https://www.nseindia.com/option-chain',
      'https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE',
    ];

    for (const page of pages) {
      try {
        await this.client.get(page, { baseURL: undefined, timeout: 15000 });
      } catch (err) {
        errors.push(`${page}: ${(err as Error).message}`);
      }
    }

    const cookies = await this.cookieJar.getCookies('https://www.nseindia.com');
    logger.info({ count: cookies.length, errors: errors.length }, 'NSE cookies initialized');
    if (cookies.length === 0) {
      throw new Error(`Failed to initialize NSE session: ${errors.join('; ')}`);
    }
  }

  async get<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    await this.limiter.acquire();
    const fullUrl = url.startsWith('http') ? url : `${config.nse.apiUrl}${url}`;
    const baseURL = url.startsWith('http') ? undefined : config.nse.apiUrl;

    // Dynamic Referer matching the endpoint and symbol
    const symbol = (params?.symbol as string) || '';
    const isQuote = url.includes('quote-equity');
    const referer = isQuote && symbol
      ? `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`
      : 'https://www.nseindia.com';

    const cfg: AxiosRequestConfig = {
      url: fullUrl,
      baseURL,
      method: 'GET',
      params,
      responseType: 'json',
      headers: { Referer: referer },
    };

    // For archive downloads
    if (url.includes('nsearchives')) {
      cfg.baseURL = undefined;
      cfg.url = url;
    }

    try {
      const res = await this.client.request<T>(cfg);
      return res.data;
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') throw new TimeoutError('NSE request timed out');
      const status = err.response?.status;
      const statusText = err.response?.statusText || '';
      const body = err.response?.data;
      const bodySnippet = typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300);
      const msg = err.response?.data?.message || err.message || 'Unknown error';

      logger.error({
        url: fullUrl,
        params,
        status,
        statusText,
        responseBody: bodySnippet,
        referer,
      }, 'NSE request failed');

      throw new ConnectionError(`NSE ${status || 'ERR'} (${statusText}): ${msg}`);
    }
  }

  async download(url: string, folder: string): Promise<string> {
    await this.limiter.acquire();
    const fname = url.split('/').pop() || 'download';
    const fpath = `${folder}/${fname}`;

    try {
      const res = await this.client.get(url, {
        baseURL: undefined,
        responseType: 'stream',
        timeout: 60000,
      });

      const ct = res.headers['content-type'];
      if (typeof ct === 'string' && ct.includes('text/html')) {
        throw new Error('NSE file is unavailable or not yet updated');
      }

      const fs = await import('fs/promises');
      const writeStream = require('fs').createWriteStream(fpath);
      res.data.pipe(writeStream);
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      return fpath;
    } catch (err: any) {
      throw new ConnectionError(`Download failed: ${err.message}`);
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
