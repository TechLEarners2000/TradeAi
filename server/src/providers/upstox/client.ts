import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../../config/index.js';
import { RateLimiter } from '../../utils/rate-limiter.js';
import { logger } from '../../utils/logger.js';

export class UpstoxHttpClient {
  private readonly client: AxiosInstance;
  private readonly limiter: RateLimiter;

  constructor() {
    this.limiter = new RateLimiter(config.upstox.rateLimitRps);

    this.client = axios.create({
      timeout: config.upstox.timeout,
      headers: {
        'Accept': 'application/json',
        'Api-Version': '2.0',
      },
    });

    this.client.interceptors.request.use(cfg => {
      cfg.headers.Authorization = `Bearer ${config.upstox.accessToken}`;
      return cfg;
    });
  }

  async get<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    await this.limiter.acquire();

    const fullUrl = url.startsWith('http') ? url : `${config.upstox.baseUrl}${url}`;

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
      if (err.code === 'ECONNABORTED') throw new TimeoutError('Upstox request timed out');
      const status = err.response?.status;
      const body = err.response?.data;
      const errorMsg = body?.errors?.[0]?.message || body?.message || err.message || 'Unknown error';
      throw new ConnectionError(`Upstox ${status || 'ERR'}: ${errorMsg}`);
    }
  }

  async getV3<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    await this.limiter.acquire();

    const fullUrl = url.startsWith('http') ? url : `${config.upstox.baseUrlV3}${url}`;

    const cfg: AxiosRequestConfig = {
      url: fullUrl,
      method: 'GET',
      params,
      responseType: 'json',
      headers: { 'Api-Version': '3.0' },
    };

    try {
      const res = await this.client.request<T>(cfg);
      return res.data;
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') throw new TimeoutError('Upstox request timed out');
      const status = err.response?.status;
      const body = err.response?.data;
      const errorMsg = body?.errors?.[0]?.message || body?.message || err.message || 'Unknown error';
      throw new ConnectionError(`Upstox ${status || 'ERR'}: ${errorMsg}`);
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
