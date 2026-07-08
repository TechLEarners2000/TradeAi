import * as cache from './cache.js';
import * as mongodb from './mongodb.js';
import { logger } from '../utils/logger.js';

interface CacheOptions {
  ttlMs?: number;
  mongoTtlSeconds?: number;
}

type FetchFn<T> = () => Promise<T>;
type MockFn<T> = () => T;

export async function get<T>(
  key: string,
  fetchFn: FetchFn<T>,
  mockFn?: MockFn<T>,
  opts?: CacheOptions,
): Promise<T & { _mockLoad?: true }> {
  // 1. Hot layer — in-memory cache
  const hot = cache.get<T>(key);
  if (hot) return hot as T & { _mockLoad?: true };

  // 2. Warm layer — MongoDB
  try {
    const mongoData = await mongodb.get<T>(key);
    if (mongoData) {
      cache.set(key, mongoData, opts?.ttlMs);
      return mongoData as T & { _mockLoad?: true };
    }
  } catch {
    // MongoDB unavailable — continue
  }

  // 3. API provider chain
  try {
    const data = await fetchFn();
    const ttl = opts?.ttlMs ?? 30_000;
    cache.set(key, data, ttl);
    mongodb.set(key, data).catch(() => {});
    return data as T & { _mockLoad?: true };
  } catch (err) {
    logger.debug({ err, key }, 'FetchFn failed, checking mock fallback');
  }

  // 4. Mock data fallback
  if (mockFn) {
    const mockData = mockFn();
    markMock(mockData);
    cache.set(key, mockData, opts?.ttlMs ?? 30_000);
    return mockData as T & { _mockLoad: true };
  }

  throw new Error(`No data available for key: ${key}`);
}

function markMock(data: unknown): void {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    (data as Record<string, unknown>)._mockLoad = true;
  }
}
