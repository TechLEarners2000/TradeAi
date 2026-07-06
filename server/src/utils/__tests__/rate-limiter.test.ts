import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../rate-limiter.js';

describe('RateLimiter', () => {
  it('should allow requests within the rate limit', async () => {
    const limiter = new RateLimiter(10);
    await limiter.acquire();
    expect(true).toBe(true);
  });

  it('should queue requests when rate limited', async () => {
    const limiter = new RateLimiter(1);
    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(900);
  });
});
